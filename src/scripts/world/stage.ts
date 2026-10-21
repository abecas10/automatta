// Escenario 3D de la historia de F-2041 con three.js.
// Materiales físicos (PBR), iluminación de estudio (HDRI), sombras suaves, física de muelle
// en el papel y postproducción (viñeta, grano y grado de color). Se carga tras pintar el hero.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Color,
  Fog,
  Group,
  Mesh,
  Object3D,
  PlaneGeometry,
  BoxGeometry,
  CylinderGeometry,
  TorusGeometry,
  LatheGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShadowMaterial,
  CanvasTexture,
  Texture,
  TextureLoader,
  RepeatWrapping,
  SRGBColorSpace,
  DirectionalLight,
  HemisphereLight,
  Vector2,
  Vector3,
  Quaternion,
  Euler,
  Box3,
  InstancedMesh,
  InstancedBufferAttribute,
  Matrix4,
  PMREMGenerator,
  EquirectangularReflectionMapping,
  NeutralToneMapping,
  VSMShadowMap,
  PCFSoftShadowMap,
  HalfFloatType,
  WebGLRenderTarget,
  FrontSide,
  BackSide,
  DoubleSide,
  type Material,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildAtlas, ATLAS_COLS, KIND } from './atlas';
import { SHEET_RATIO } from './constants';
import { buildScript, flags, DESK, type LabelSpec, type Anchor } from './script';
import { CH } from './chapters';
import { smooth, window01, clamp } from './keys';
import {
  paper,
  drawInvoice,
  drawSurveyBack,
  drawExcel,
  drawLetter,
  drawSlip,
  drawTax,
  drawSupplier,
  drawLedger,
  drawPrevious,
  paperFibreNormal,
  drawKraft,
  drawPageEdge,
  drawLedgerCover,
  drawFlag,
  type Paper,
} from './textures';
import { world } from './state';
import { SURVEY_URL } from '../../config';
import es from '../../content/es';

const FOV = 30;
const PAPER_BG = new Color('#f5f6f3');
const INK_BG = new Color('#14201b');
const SHEET_W = 1.6;
const SHEET_H = SHEET_W * SHEET_RATIO;
/** Altura del suelo de estudio donde caen las sombras cuando no hay mesa. */
const FLOOR = -1.75;
/** 1 unidad ≈ 13 cm (una hoja A4 mide 1,6 de ancho). */
const METER = 7.6;
const AGED = new Color('#e9d6a8');
const WHITE = new Color('#ffffff');

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- papel que se curva

type PaperUniforms = { uTime: { value: number }; uBend: { value: number }; uSeed: { value: number }; uSize: { value: Vector2 } };

const WAVE = /* glsl */ `
uniform float uTime;
uniform float uBend;
uniform float uSeed;
uniform vec2 uSize;
float paperWave(vec2 q) {
  float t = uTime;
  float w = 0.10 * sin(q.x * 2.6 + t * 2.1 + uSeed * 6.283)
          + 0.07 * sin(q.y * 2.2 + t * 1.6 + uSeed * 3.1)
          + 0.16 * q.x * q.x * sin(t * 1.3 + uSeed * 9.0)
          + 0.10 * q.y * q.y * cos(t * 1.1 + uSeed * 5.0);
  return w * uBend;
}
`;

/** Inyecta la curvatura del papel en un material estándar de three. */
function bendable(mat: Material, u: PaperUniforms) {
  mat.onBeforeCompile = (sh: WebGLProgramParametersWithUniforms) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${WAVE}`)
      .replace(
        '#include <beginnormal_vertex>',
        `vec2 pq = position.xy * 2.0;
        float pe = 0.02;
        float phx = (paperWave(pq + vec2(pe, 0.0)) - paperWave(pq - vec2(pe, 0.0))) / (2.0 * pe) / (uSize.x * 0.5);
        float phy = (paperWave(pq + vec2(0.0, pe)) - paperWave(pq - vec2(0.0, pe))) / (2.0 * pe) / (uSize.y * 0.5);
        vec3 objectNormal = normalize(vec3(-phx, -phy, 1.0));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.xy * uSize, paperWave(pq));');
  };
  mat.customProgramCacheKey = () => 'paper';
}

// ---------------------------------------------------------------- escenario

export async function startStage(canvas: HTMLCanvasElement, labelsRoot: HTMLElement | null) {
  const mobile = world.mobile;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = mobile ? PCFSoftShadowMap : VSMShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  scene.background = PAPER_BG.clone();
  scene.fog = new Fog(PAPER_BG.clone(), 30, 60);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  const S = buildScript();

  // Iluminación de estudio: primero una sala procedural; después, el HDRI real.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  new HDRLoader().load('/3d/studio.hdr', (hdr) => {
    hdr.mapping = EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
  });

  const key = new DirectionalLight('#fffcf6', 2.4);
  key.position.set(-3.5, 7.5, 5);
  key.target.position.set(0, -0.6, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  const sc = key.shadow.camera;
  sc.left = -7;
  sc.right = 7;
  sc.top = 7;
  sc.bottom = -7;
  sc.near = 1;
  sc.far = 25;
  key.shadow.radius = mobile ? 4 : 12;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  scene.add(new HemisphereLight('#ffffff', '#c9cfc8', 0.35));

  // Suelo de estudio que solo recoge sombras.
  const floor = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- Texturas base ----------
  const fibre = new CanvasTexture(paperFibreNormal(256));
  fibre.wrapS = fibre.wrapT = RepeatWrapping;
  fibre.repeat.set(3, 4);
  const texLoader = new TextureLoader();
  const loadTex = (url: string, color = false, repeat = 1) => {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = maxAniso;
    if (color) t.colorSpace = SRGBColorSpace;
    return t;
  };
  const oak = {
    map: loadTex('/3d/tex/oak_veneer_01_diff.webp', true, 2.5),
    normalMap: loadTex('/3d/tex/oak_veneer_01_nor.webp', false, 2.5),
    roughnessMap: loadTex('/3d/tex/oak_veneer_01_rough.webp', false, 2.5),
  };
  const leather = {
    map: loadTex('/3d/tex/fabric_leather_02_diff.webp', true, 1.5),
    normalMap: loadTex('/3d/tex/fabric_leather_02_nor.webp', false, 1.5),
    roughnessMap: loadTex('/3d/tex/fabric_leather_02_rough.webp', false, 1.5),
  };

  const canvasTex = (p: Paper | HTMLCanvasElement) => {
    const t = new CanvasTexture('canvas' in p ? p.canvas : p);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const time = { value: 0 };

  // ---------- Hojas de papel ----------
  type Sheet = {
    group: Group;
    front: Mesh;
    back: Mesh;
    mat: MeshPhysicalMaterial;
    backMat: MeshPhysicalMaterial;
    u: PaperUniforms;
    paper: Paper;
    tex: CanvasTexture;
    backPaper?: Paper;
    backTex?: CanvasTexture;
    w: number;
    h: number;
    /** Muelle: posición y rotación actuales y su velocidad. */
    spring: { p: Vector3; v: Vector3; r: Vector3; rv: Vector3; init: boolean };
    flutter: number;
  };
  const texPx = mobile ? 768 : 1200;
  const sheetGeo = new PlaneGeometry(1, 1, mobile ? 18 : 28, mobile ? 24 : 38);
  const sheets: Record<string, Sheet> = {};
  const makeSheet = (name: string, front: Paper, w: number, h: number, back?: Paper, parent: Object3D = scene): Sheet => {
    const u: PaperUniforms = { uTime: time, uBend: { value: 0 }, uSeed: { value: Math.random() }, uSize: { value: new Vector2(w, h) } };
    const tex = canvasTex(front);
    const mat = new MeshPhysicalMaterial({
      map: tex,
      roughness: 0.82,
      sheen: 0.35,
      sheenRoughness: 0.85,
      sheenColor: new Color('#ffffff'),
      normalMap: fibre,
      normalScale: new Vector2(0.12, 0.12),
      side: FrontSide,
    });
    bendable(mat, u);
    let backTex: CanvasTexture | undefined;
    if (back) {
      backTex = canvasTex(back);
      backTex.wrapS = RepeatWrapping;
      backTex.repeat.x = -1;
      backTex.offset.x = 1;
    }
    const backMat = new MeshPhysicalMaterial({
      map: backTex ?? null,
      color: backTex ? '#ffffff' : '#eceee9',
      roughness: 0.86,
      sheen: 0.3,
      sheenRoughness: 0.9,
      normalMap: fibre,
      normalScale: new Vector2(0.12, 0.12),
      side: BackSide,
    });
    bendable(backMat, u);
    const group = new Group();
    const fm = new Mesh(sheetGeo, mat);
    const bm = new Mesh(sheetGeo, backMat);
    fm.castShadow = bm.castShadow = true;
    fm.receiveShadow = bm.receiveShadow = true;
    group.add(fm, bm);
    group.rotation.order = 'XYZ';
    parent.add(group);
    const s: Sheet = {
      group,
      front: fm,
      back: bm,
      mat,
      backMat,
      u,
      paper: front,
      tex,
      backPaper: back,
      backTex,
      w,
      h,
      spring: { p: new Vector3(), v: new Vector3(), r: new Vector3(), rv: new Vector3(), init: false },
      flutter: 0,
    };
    sheets[name] = s;
    return s;
  };

  const A4 = (): Paper => paper(340, 481, texPx);
  const inv = makeSheet('inv', A4(), SHEET_W, SHEET_H, A4());
  const excel = makeSheet('excel', A4(), SHEET_W, SHEET_H);
  const tax = makeSheet('tax', A4(), SHEET_W, SHEET_H);
  const sup = makeSheet('sup', A4(), SHEET_W, SHEET_H);
  await nextFrame();
  const p1 = makeSheet('p1', A4(), SHEET_W, SHEET_H);
  const p2 = makeSheet('p2', A4(), SHEET_W, SHEET_H);
  drawPrevious(p1.paper, 40);
  drawPrevious(p2.paper, 39);
  const letters = [0, 1, 2].map((i) => {
    const pp = paper(340, 240, texPx * 0.6);
    drawLetter(pp, i);
    return makeSheet(`letter${i}`, pp, 1.0, 1.0 * (240 / 340));
  });
  const slipP = paper(340, 150, texPx * 0.7);
  drawSlip(slipP);
  const slip = makeSheet('slip', slipP, 1.5, 1.5 * (150 / 340));
  [p1, p2, slip, ...letters].forEach((s) => (s.tex.needsUpdate = true));
  await nextFrame();

  // ---------- Sobre de papel kraft ----------
  const envW = 1.8;
  const envH = envW * (220 / 340);
  const envGroup = new Group();
  envGroup.rotation.order = 'XYZ';
  scene.add(envGroup);
  const kraftFront = paper(340, 220, texPx * 0.7);
  drawKraft(kraftFront, true);
  const kraftPlain = paper(340, 220, 256);
  drawKraft(kraftPlain, false);
  const kraftMat = (p: Paper, side: typeof FrontSide | typeof DoubleSide = FrontSide) =>
    new MeshPhysicalMaterial({ map: canvasTex(p), roughness: 0.9, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new Color('#fff3dc'), side, normalMap: fibre, normalScale: new Vector2(0.25, 0.25) });
  const envFront = new Mesh(new PlaneGeometry(envW, envH), kraftMat(kraftFront));
  envFront.position.z = 0.012;
  const envBack = new Mesh(new PlaneGeometry(envW, envH), kraftMat(kraftPlain, DoubleSide));
  envBack.position.z = -0.012;
  envFront.castShadow = envBack.castShadow = true;
  envGroup.add(envFront, envBack);
  const flapPivot = new Group();
  flapPivot.position.set(0, envH / 2, -0.012);
  envGroup.add(flapPivot);
  const flapGeo = new BufferGeometry();
  flapGeo.setAttribute('position', new Float32BufferAttribute([-envW / 2, 0, 0, envW / 2, 0, 0, 0, -envH * 0.62, 0], 3));
  flapGeo.setAttribute('uv', new Float32BufferAttribute([0, 1, 1, 1, 0.5, 0.2], 2));
  flapGeo.computeVertexNormals();
  const flap = new Mesh(flapGeo, kraftMat(kraftPlain, DoubleSide));
  flap.castShadow = true;
  flapPivot.add(flap);

  // ---------- Sello de caucho (torneado en madera barnizada, virola de latón) ----------
  const wood = new MeshPhysicalMaterial({ ...oak, color: '#9a6b45', roughness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.22 });
  const darkWood = new MeshPhysicalMaterial({ ...oak, color: '#5a3a26', roughness: 0.5, clearcoat: 0.9, clearcoatRoughness: 0.18 });
  const brass = new MeshPhysicalMaterial({ color: '#c9a25a', metalness: 1, roughness: 0.28, clearcoat: 0.4 });
  const rubberMat = new MeshPhysicalMaterial({ color: '#8f2a22', roughness: 0.92 });
  const stampGroup = new Group();
  scene.add(stampGroup);
  const profile = [
    [0.0, 0.0],
    [0.12, 0.0],
    [0.125, 0.03],
    [0.09, 0.08],
    [0.072, 0.18],
    [0.07, 0.27],
    [0.085, 0.33],
    [0.118, 0.39],
    [0.128, 0.44],
    [0.118, 0.49],
    [0.085, 0.525],
    [0.04, 0.542],
    [0.0, 0.546],
  ].map(([x, y]) => new Vector2(x, y));
  const handle = new Mesh(new LatheGeometry(profile, 48), wood);
  handle.position.y = 0.2;
  const ferrule = new Mesh(new CylinderGeometry(0.128, 0.13, 0.05, 48), brass);
  ferrule.position.y = 0.205;
  const block = new Mesh(new RoundedBoxGeometry(0.72, 0.16, 0.44, 4, 0.03), darkWood);
  block.position.y = 0.1;
  const rubber = new Mesh(new RoundedBoxGeometry(0.68, 0.05, 0.4, 3, 0.012), rubberMat);
  rubber.position.y = 0.022;
  const labelP = paper(200, 120, 256);
  const labelMesh = new Mesh(new PlaneGeometry(0.5, 0.3), new MeshStandardMaterial({ map: canvasTex(labelP), roughness: 0.8 }));
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.y = 0.181;
  [handle, ferrule, block, rubber].forEach((m) => (m.castShadow = true));
  stampGroup.add(handle, ferrule, block, rubber, labelMesh);
  let stampLabel = '';
  const setStampLabel = (txt: string, color: string) => {
    if (txt === stampLabel) return;
    stampLabel = txt;
    const c = labelP.ctx;
    c.fillStyle = '#f4efe2';
    c.fillRect(0, 0, 200, 120);
    c.strokeStyle = color;
    c.lineWidth = 4;
    c.strokeRect(14, 14, 172, 92);
    c.fillStyle = color;
    c.font = '700 26px "Archivo Variable", system-ui';
    c.textAlign = 'center';
    c.fillText(txt.toUpperCase(), 100, 70);
    ((labelMesh.material as MeshStandardMaterial).map as Texture).needsUpdate = true;
  };

  // ---------- Libro mayor (tapas de piel, hojas con canto) ----------
  const pageW = 1.2;
  const pageH = 1.6;
  const bookGroup = new Group();
  bookGroup.rotation.order = 'XYZ';
  scene.add(bookGroup);
  const leatherMat = new MeshPhysicalMaterial({ ...leather, color: '#2c5a43', roughness: 0.7, clearcoat: 0.2, sheen: 0.4, sheenColor: new Color('#6fae8c') });
  const edgeP = paper(64, 256, 128);
  drawPageEdge(edgeP);
  const edgeMat = new MeshStandardMaterial({ map: canvasTex(edgeP), roughness: 0.9 });
  const creamMat = new MeshStandardMaterial({ color: '#f3efe3', roughness: 0.9 });
  const backCover = new Mesh(new RoundedBoxGeometry(pageW + 0.08, pageH + 0.1, 0.04, 3, 0.015), leatherMat);
  backCover.position.set(pageW / 2, 0, -0.085);
  const pages = new Mesh(new BoxGeometry(pageW, pageH, 0.13), [edgeMat, edgeMat, edgeMat, edgeMat, creamMat, creamMat]);
  pages.position.set(pageW / 2 + 0.01, 0, 0);
  backCover.castShadow = pages.castShadow = true;
  bookGroup.add(backCover, pages);
  const ledgerR = paper(340, 453, texPx * 0.8);
  const right = makeSheet('ledger', ledgerR, pageW - 0.05, pageH - 0.05, undefined, bookGroup);
  right.group.position.set(pageW / 2 + 0.01, 0, 0.068);
  const coverPivot = new Group();
  coverPivot.position.set(0, 0, 0.085);
  bookGroup.add(coverPivot);
  const frontCover = new Mesh(new RoundedBoxGeometry(pageW + 0.08, pageH + 0.1, 0.04, 3, 0.015), leatherMat);
  frontCover.position.set(pageW / 2, 0, 0);
  frontCover.castShadow = true;
  coverPivot.add(frontCover);
  const foilP = paper(340, 453, 512);
  drawLedgerCover(foilP);
  const foil = new Mesh(
    new PlaneGeometry(pageW, pageH),
    new MeshPhysicalMaterial({ map: canvasTex(foilP), transparent: true, metalness: 0.9, roughness: 0.3, color: '#ffffff' }),
  );
  foil.position.set(pageW / 2, 0, 0.022);
  coverPivot.add(foil);
  const ledgerL = paper(340, 453, texPx * 0.6);
  const left = makeSheet('ledgerL', ledgerL, pageW - 0.05, pageH - 0.05, undefined, coverPivot);
  left.group.position.set(pageW / 2, 0, -0.022);
  left.group.rotation.y = Math.PI;
  await nextFrame();

  // ---------- Previsión de caja: columnas de cerámica esmaltada ----------
  const cash = [30, 33, 31, 35, 32, 27, 21, 13, 19, 26, 30, 33, 36];
  const barGroup = new Group();
  scene.add(barGroup);
  const barGeo = new RoundedBoxGeometry(0.12, 1, 0.12, 3, 0.02);
  barGeo.translate(0, 0.5, 0);
  const barMats = {
    green: new MeshPhysicalMaterial({ color: '#1f6b4a', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
    bright: new MeshPhysicalMaterial({ color: '#2f9a6a', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }),
    red: new MeshPhysicalMaterial({ color: '#c8372d', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
    ghost: new MeshPhysicalMaterial({ color: '#c9cfca', roughness: 0.5, transparent: true, opacity: 0.75 }),
  };
  const barMeshes = cash.map((_, i) => {
    const b = new Mesh(barGeo, barMats.green);
    b.position.x = (i - 6) * 0.17;
    b.castShadow = true;
    barGroup.add(b);
    return b;
  });

  // ---------- Cadena de Verifactu: eslabones de acero pulido ----------
  const steel = new MeshPhysicalMaterial({ color: '#d7e2dc', metalness: 1, roughness: 0.16, clearcoat: 0.5 });
  const linkGeo = new TorusGeometry(0.11, 0.026, 24, 64);
  linkGeo.scale(1.35, 1, 1);
  const linkMeshes = Array.from({ length: 6 }, () => {
    const m = new Mesh(linkGeo, steel);
    m.castShadow = true;
    scene.add(m);
    return m;
  });

  // ---------- Hoja de ruta: cuatro banderines sobre peanas de cerámica ----------
  const roadGroup = new Group();
  scene.add(roadGroup);
  const ceramic = new MeshPhysicalMaterial({ color: '#f1f2ee', roughness: 0.35, clearcoat: 0.6 });
  const markers = es.roadmap.items.map((item, i) => {
    const g = new Group();
    g.position.set([-0.2, 0.5, -0.4, 0.35][i], FLOOR, [-0.3, -3.4, -6.5, -9.6][i]);
    const base = new Mesh(new CylinderGeometry(0.32, 0.36, 0.08, 48), ceramic);
    base.position.y = 0.04;
    const pole = new Mesh(new CylinderGeometry(0.018, 0.018, 1.5, 16), brass);
    pole.position.y = 0.8;
    base.castShadow = pole.castShadow = true;
    base.receiveShadow = true;
    g.add(base, pole);
    const fp = paper(240, 90, 384);
    drawFlag(fp, item.when, item.title, item.current);
    const flag = makeSheet(`flag${i}`, fp, 0.8, 0.3, undefined, g);
    flag.group.position.set(0.42, 1.38, 0);
    flag.tex.needsUpdate = true;
    roadGroup.add(g);
    return { g, flag };
  });

  // ---------- Mesa de trabajo (roble) y objetos reales ----------
  const deskGroup = new Group();
  scene.add(deskGroup);
  const deskMat = new MeshPhysicalMaterial({ ...oak, color: '#f4ebdf', roughness: 0.62, clearcoat: 0.3, clearcoatRoughness: 0.4, transparent: true });
  // Un tablero real dentro del estudio: a la derecha, con su canto visible (el texto queda sobre el fondo).
  const desk = new Mesh(new RoundedBoxGeometry(7.2, 0.16, 4.6, 5, 0.05), deskMat);
  desk.position.set(1.35, DESK - 0.08, -0.55);
  desk.castShadow = true;
  desk.receiveShadow = true;
  deskGroup.add(desk);
  const propMats: Material[] = [];

  const gltf = new GLTFLoader();
  gltf.setMeshoptDecoder(MeshoptDecoder);
  /** Carga un modelo y lo escala para que su lado mayor mida `size` unidades. */
  const loadModel = (url: string, size: number, onLoad: (o: Object3D) => void) =>
    gltf.load(url, (g) => {
      const o = g.scene;
      const box = new Box3().setFromObject(o);
      const dim = box.getSize(new Vector3());
      o.scale.setScalar(size / Math.max(dim.x, dim.y, dim.z));
      const box2 = new Box3().setFromObject(o);
      o.position.y -= box2.min.y;
      o.traverse((c) => {
        const m = c as Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      onLoad(o);
    });
  const holder = (x: number, z: number, ry: number) => {
    const h = new Group();
    h.position.set(x, DESK, z);
    h.rotation.y = ry;
    deskGroup.add(h);
    return h;
  };
  const addProp = (o: Object3D, x: number, z: number, ry: number) => {
    o.traverse((c) => {
      const m = (c as Mesh).material as Material | Material[] | undefined;
      if (m) propMats.push(...(Array.isArray(m) ? m : [m]));
    });
    holder(x, z, ry).add(o);
  };
  loadModel('/3d/desk_lamp_arm_01.glb', 0.5 * METER, (o) => addProp(o, 4.2, -2.2, -2.3));
  loadModel('/3d/potted_plant_04.glb', 0.22 * METER, (o) => addProp(o, -1.6, -2.15, 0.4));
  loadModel('/3d/vintage_stapler.glb', 0.16 * METER, (o) => addProp(o, 3.6, 0.75, -0.5));
  const glass = new Group();
  scene.add(glass);
  loadModel('/3d/magnifying_glass_01.glb', 0.22 * METER, (o) => {
    const box = new Box3().setFromObject(o);
    o.position.sub(box.getCenter(new Vector3()));
    o.traverse((m) => {
      const mat = (m as Mesh).material as MeshPhysicalMaterial | undefined;
      if (mat && mobile && mat.transmission > 0) {
        mat.transmission = 0;
        mat.transparent = true;
        mat.opacity = 0.25;
      }
    });
    glass.add(o);
  });
  await nextFrame();

  // ---------- Multitud de facturas (instancias con atlas) ----------
  const atlas = await buildAtlas(1024);
  const N = mobile ? 30 : 70;
  const atlasTex = canvasTex(atlas.canvas);
  const crowdMat = new MeshStandardMaterial({ map: atlasTex, roughness: 0.85, side: DoubleSide, alphaTest: 0.5 });
  const crowdGeo = new PlaneGeometry(SHEET_W, SHEET_H);
  const aCell = new InstancedBufferAttribute(new Float32Array(N), 1);
  const aClean = new InstancedBufferAttribute(new Float32Array(N), 1);
  const kinds = [KIND.invoiceA, KIND.invoiceB, KIND.reminder, KIND.invoiceB, KIND.sheet, KIND.supplier, KIND.bank];
  for (let i = 0; i < N; i++) aCell.setX(i, kinds[i % kinds.length] * 2);
  crowdGeo.setAttribute('aCell', aCell);
  crowdGeo.setAttribute('aClean', aClean);
  crowdMat.onBeforeCompile = (sh) => {
    sh.uniforms.uCell = { value: new Vector2(atlas.cellW, atlas.cellH) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCell;\nattribute float aClean;\nvarying float vCell;\nvarying float vClean;\nvarying vec2 vSheetUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCell = aCell; vClean = aClean; vSheetUv = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <map_pars_fragment>',
        `#include <map_pars_fragment>
        uniform vec2 uCell;
        varying float vCell;
        varying float vClean;
        varying vec2 vSheetUv;
        vec4 atlasCell(float idx, vec2 uv) {
          vec2 c = vec2(mod(idx, ${ATLAS_COLS.toFixed(1)}), floor(idx / ${ATLAS_COLS.toFixed(1)} + 0.001));
          uv = clamp(uv, 0.004, 0.996);
          return texture2D(map, vec2((c.x + uv.x) * uCell.x, 1.0 - (c.y + 1.0 - uv.y) * uCell.y));
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `vec4 sampledDiffuseColor = mix(atlasCell(vCell, vSheetUv), atlasCell(vCell + 1.0, vSheetUv), step(0.5, vClean));
        diffuseColor *= sampledDiffuseColor;`,
      );
  };
  const crowd = new InstancedMesh(crowdGeo, crowdMat, N);
  crowd.castShadow = true;
  crowd.receiveShadow = true;
  crowd.frustumCulled = false;
  scene.add(crowd);

  // ---------- Postproducción: grado de color, viñeta y grano de película ----------
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: mobile ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uGray: { value: 0 }, uTime: { value: 0 }, uDark: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uGray; uniform float uTime; uniform float uDark; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        c.rgb = mix(c.rgb, vec3(l) * vec3(0.98, 0.99, 1.0), uGray);
        vec2 d = vUv - 0.5;
        c.rgb *= 1.0 - dot(d, d) * mix(0.32, 0.6, uDark);
        c.rgb += (hash(vUv * 1000.0 + uTime) - 0.5) * 0.022;
        gl_FragColor = c;
      }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ---------- Etiquetas (DOM ancladas a puntos de los objetos) ----------
  type LabelEl = { spec: LabelSpec; el: HTMLElement; box: HTMLElement; line: HTMLElement; text: string };
  const labelEls: LabelEl[] = [];
  if (labelsRoot) {
    labelsRoot.textContent = '';
    for (const spec of S.labels) {
      if (spec.desktop && mobile) continue;
      const el = document.createElement('div');
      el.className = `wl wl-${spec.style ?? 'pill'}${spec.tone ? ` wl-${spec.tone}` : ''}`;
      const line = document.createElement('span');
      line.className = 'wl-line';
      const dot = document.createElement('span');
      dot.className = 'wl-dot';
      const box = document.createElement('span');
      box.className = 'wl-box';
      el.append(line, dot, box);
      labelsRoot.append(el);
      labelEls.push({ spec, el, box, line, text: '' });
    }
  }

  // Enlace invisible sobre la hoja de la encuesta (el botón accesible está en el texto).
  const surveyLink = document.createElement('a');
  surveyLink.href = SURVEY_URL;
  surveyLink.target = '_blank';
  surveyLink.rel = 'noopener';
  surveyLink.className = 'world-survey-link';
  surveyLink.tabIndex = -1;
  surveyLink.setAttribute('aria-hidden', 'true');
  document.body.append(surveyLink);

  // ---------- Tamaño y encuadre ----------
  let zoom = 1;
  let vw = 1;
  let vh = 1;
  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    composer.setSize(vw, vh);
    camera.aspect = vw / vh;
    const narrow = vw < 1024;
    const shift = mobile ? [0, 0.4] : narrow ? [0.3, 0] : [0.42, 0];
    zoom = mobile ? Math.max(1.6, 0.95 / camera.aspect) : narrow ? 1.25 : 1;
    // Desplazamiento de lente: la acción ocurre a la derecha (escritorio) o arriba (móvil).
    camera.setViewOffset(vw, vh, (-shift[0] * vw) / 2, (shift[1] * vh) / 2, vw, vh);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Utilidades de posición ----------
  const v3 = new Vector3();
  const toScreen = (v: Vector3) => {
    v3.copy(v).project(camera);
    return [(v3.x * 0.5 + 0.5) * vw, (-v3.y * 0.5 + 0.5) * vh, v3.z];
  };
  const worldPoint = (s: Sheet, u: number, vTop: number, out = new Vector3()) =>
    out.set((u - 0.5) * s.w, (0.5 - vTop) * s.h, 0).applyMatrix4(s.front.matrixWorld);
  const quad = (s: Sheet) =>
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([u, v]) => toScreen(worldPoint(s, u, v)));
  const inside = (pts: number[][], x: number, y: number) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi) c = !c;
    }
    return c;
  };

  // ---------- Interacción ----------
  const drag = { active: false, lastX: 0, vel: 0, ry: 0 };
  let hovering = false;
  let invQuad: number[][] = [];
  const onMove = (e: PointerEvent) => {
    world.pointer.x = (e.clientX / vw) * 2 - 1;
    world.pointer.y = -((e.clientY / vh) * 2 - 1);
    world.pointer.active = e.pointerType === 'mouse';
    if (drag.active) {
      const dx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      drag.ry += dx * 0.012;
      drag.vel = dx * 0.012;
    }
    hovering = invQuad.length > 0 && inside(invQuad, e.clientX, e.clientY);
  };
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
    if (!invQuad.length || !inside(invQuad, e.clientX, e.clientY)) return;
    if (world.T < 0.75) {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.vel = 0;
      document.documentElement.classList.add('world-grabbing');
    } else if (world.T >= CH.tesoreria + 0.15 && world.T < CH.tesoreria + 0.56) {
      world.user.stamped = true;
      world.user.stampAt = performance.now();
    }
  };
  const onUp = () => {
    drag.active = false;
    document.documentElement.classList.remove('world-grabbing');
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // ---------- Texturas que cambian con la historia ----------
  const texKeys: Record<string, string> = {};
  let lastExcel = -1;
  const redraw = (T: number, blink: boolean) => {
    const f = flags(T, world.user);
    const jobs: [string, string, () => void][] = [
      [
        'inv',
        `${f.overdue}${f.paid}${f.qr}${f.invRead}`,
        () => {
          drawInvoice(inv.paper, { overdue: f.overdue, paid: f.paid, qr: f.qr, read: f.invRead });
          inv.tex.needsUpdate = true;
        },
      ],
      [
        'back',
        `${f.surveyTicks}`,
        () => {
          drawSurveyBack(inv.backPaper!, f.surveyTicks);
          inv.backTex!.needsUpdate = true;
        },
      ],
      [
        'tax',
        `${f.filled}${f.draft}`,
        () => {
          drawTax(tax.paper, f.filled, f.draft);
          tax.tex.needsUpdate = true;
        },
      ],
      [
        'sup',
        `${f.supRead}${f.approved}`,
        () => {
          drawSupplier(sup.paper, f.supRead, f.approved);
          sup.tex.needsUpdate = true;
        },
      ],
      [
        'ledger',
        `${f.entry}`,
        () => {
          drawLedger(right.paper, 'right', f.entry);
          right.tex.needsUpdate = true;
        },
      ],
    ];
    let budget = 2;
    for (const [name, k, run] of jobs) {
      if (budget > 0 && texKeys[name] !== k) {
        texKeys[name] = k;
        run();
        budget--;
      }
    }
    const typed = Math.round(S.excel.at('typed', T) * 200) / 200;
    const ex = typed * 1000 + (blink ? 1 : 0);
    if (ex !== lastExcel && S.excel.at('vis', T) > 0.01) {
      lastExcel = ex;
      drawExcel(excel.paper, typed, blink && typed < 1);
      excel.tex.needsUpdate = true;
    }
  };
  drawLedger(left.paper, 'left', false);
  left.tex.needsUpdate = true;

  // ---------- Aplicar la pose de una hoja (con muelle) ----------
  const tmpTarget = new Vector3();
  const tmpRot = new Vector3();
  const applySheet = (s: Sheet, v: Record<string, number>, dt: number, extra = { rx: 0, ry: 0, rz: 0, z: 0 }) => {
    const visible = v.vis > 0.005;
    s.group.visible = visible;
    if (!visible) {
      s.spring.init = false;
      return;
    }
    tmpTarget.set(v.x, v.y, v.z + extra.z);
    tmpRot.set(v.rx + extra.rx, v.ry + extra.ry, v.rz + extra.rz);
    const sp = s.spring;
    if (!sp.init || dt <= 0) {
      sp.p.copy(tmpTarget);
      sp.r.copy(tmpRot);
      sp.v.set(0, 0, 0);
      sp.rv.set(0, 0, 0);
      sp.init = true;
    } else {
      // Muelle con un poco de rebote: el papel "llega" y se asienta.
      const k = 140;
      const c = 17;
      const step = (p: Vector3, vel: Vector3, tgt: Vector3) => {
        vel.x += ((tgt.x - p.x) * k - vel.x * c) * dt;
        vel.y += ((tgt.y - p.y) * k - vel.y * c) * dt;
        vel.z += ((tgt.z - p.z) * k - vel.z * c) * dt;
        p.addScaledVector(vel, dt);
      };
      step(sp.p, sp.v, tmpTarget);
      step(sp.r, sp.rv, tmpRot);
    }
    // Ondea más cuanto más rápido se mueve.
    const speed = sp.v.length();
    s.flutter += (Math.min(1, speed * 0.25) - s.flutter) * Math.min(1, dt * 6);
    s.group.position.copy(sp.p);
    s.group.rotation.set(sp.r.x, sp.r.y, sp.r.z);
    s.group.scale.setScalar((0.35 + 0.65 * v.vis) * v.s);
    s.u.uBend.value = (v.bend ?? 0.04) + s.flutter * 0.45;
    const fade = v.vis < 0.999;
    for (const m of [s.mat, s.backMat]) {
      m.transparent = fade;
      m.opacity = Math.min(1, v.vis * 1.5);
      m.depthWrite = !fade;
    }
  };

  // ---------- Pose de la multitud ----------
  const m4 = new Matrix4();
  const q4 = new Quaternion();
  const e4 = new Euler();
  const pos4 = new Vector3();
  const scl4 = new Vector3();
  const crowdPose = (i: number, t: number, c: Record<string, number>) => {
    let x = (rnd(i, 1) - 0.5) * 13 + Math.sin(t * 0.08 + i) * 0.4;
    let y = (rnd(i, 2) - 0.5) * 7 + Math.cos(t * 0.07 + i * 2) * 0.3;
    let z = -6 - rnd(i, 3) * 9;
    let rx = (rnd(i, 4) - 0.5) * 1.6;
    let ry = (rnd(i, 6) - 0.5) * 2;
    let rz = (rnd(i, 8) - 0.5) * 1.5;
    let s = 1;
    const pw = clamp(c.pile * 1.5 - rnd(i, 9) * 0.5);
    if (pw > 0) {
      const a = rnd(i, 10) * Math.PI * 2;
      const r = 0.55 + rnd(i, 11) * 1.7;
      const e = pw * pw * (3 - 2 * pw);
      x += (Math.cos(a) * r * 1.2 - x) * e;
      y += (DESK + 0.006 + i * 0.0025 - y) * e + Math.sin(Math.PI * pw) * 1.4;
      z += (Math.sin(a) * r * 0.75 + 0.05 - z) * e;
      rx += (-Math.PI / 2 - rx) * e;
      ry += (0 - ry) * e;
      rz += ((rnd(i, 12) - 0.5) * 1.4 - rz) * e;
      s += (0.74 - s) * e;
    }
    const sw = clamp(c.stream * 1.4 - rnd(i, 13) * 0.4);
    if (sw > 0) {
      const u = (rnd(i, 14) + t * 0.05) % 1;
      const e = sw * sw * (3 - 2 * sw);
      x += ((u * 2 - 1) * 4.2 - x) * e;
      y += ((rnd(i, 15) - 0.5) * 1.6 - y) * e;
      z += (-1.4 - rnd(i, 16) * 1.6 - z) * e;
      rx += (-0.15 - rx) * e;
      ry += (0.35 - ry) * e;
      rz += ((rnd(i, 17) - 0.5) * 0.2 - rz) * e;
      s += (0.42 - s) * e;
    }
    return { x, y, z, rx, ry, rz, s };
  };

  // ---------- Bucle ----------
  let elapsed = 0;
  let flutterClock = 0;
  let lastNow = performance.now();
  let raf = 0;
  let fadeIn = 0;
  let lastCss = '';
  let shake = 0;
  let lastPress = 0;
  const bg = PAPER_BG.clone();
  const camPos = new Vector3();
  const camTarget = new Vector3();
  const up = new Vector3(0, 1, 0);
  const nrm = new Vector3();
  const axis = new Vector3();
  const p0 = new Vector3();
  const p1v = new Vector3();
  const qtmp = new Quaternion();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - lastNow) / 1000, 0), 1 / 20);
    lastNow = now;
    if (document.hidden) return;
    elapsed += dt;

    world.T += (world.target - world.T) * (1 - Math.exp(-dt * 5));
    if (!Number.isFinite(world.T) || world.T < 0) world.T = Math.max(0, world.target || 0);
    const T = world.T;

    const fx = S.fx.eval(T);
    flutterClock += dt * (1 - fx.freeze);
    time.value = flutterClock;
    redraw(T, Math.floor(elapsed * 2.2) % 2 === 0);

    // Cámara (con un pequeño temblor cuando el sello golpea)
    const c = S.cam.eval(T);
    const px = world.pointer.active && T < CH.cobros ? world.pointer.x : 0;
    const py = world.pointer.active && T < CH.cobros ? world.pointer.y : 0;
    camTarget.set(c.tx, c.ty, c.tz);
    camPos.set(c.x + px * 0.25, c.y + py * 0.15, c.z).sub(camTarget).multiplyScalar(zoom).add(camTarget);
    shake *= Math.exp(-dt * 9);
    camPos.x += Math.sin(elapsed * 61) * 0.018 * shake;
    camPos.y += Math.cos(elapsed * 53) * 0.018 * shake;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    // Protagonista
    const iv = S.inv.eval(T);
    if (!drag.active) {
      drag.ry += drag.vel;
      drag.vel *= Math.exp(-dt * 3);
      const home = Math.round(drag.ry / (Math.PI * 2)) * Math.PI * 2;
      if (Math.abs(drag.vel) < 0.002) drag.ry += (home - drag.ry) * (1 - Math.exp(-dt * (T < 0.75 ? 1.2 : 6)));
    }
    const tilt = T < 0.6 ? 1 - T / 0.6 : 0;
    const tamper = world.user.tamperAt ? Math.max(0, 1 - (now - world.user.tamperAt) / 700) : 0;
    const hoverSurvey = hovering && T > CH.survey + 0.35 && T < CH.end ? 1 : 0;
    world.hoverLift += (hoverSurvey - world.hoverLift) * (1 - Math.exp(-dt * 8));
    applySheet(inv, iv, dt, {
      rx: -py * 0.25 * tilt + Math.sin(elapsed * 0.9) * 0.03 * tilt,
      ry: drag.ry + px * 0.35 * tilt,
      rz: Math.sin(now * 0.06) * 0.05 * tamper,
      z: world.hoverLift * 0.25,
    });
    inv.group.position.x += Math.sin(now * 0.07) * 0.06 * tamper;
    inv.mat.color.copy(WHITE).lerp(AGED, iv.age);
    const glow = Math.max(world.hoverLift, tamper * 0.8, hovering && T < 0.75 ? 0.5 : 0);
    inv.mat.emissive.set('#1f6b4a').multiplyScalar(glow * 0.12);
    document.documentElement.classList.toggle('world-can-grab', hovering && (T < 0.75 || T > CH.survey + 0.35));

    applySheet(excel, S.excel.eval(T), dt);
    letters.forEach((l, i) => applySheet(l, S.letters[i].eval(T), dt));
    applySheet(slip, S.slip.eval(T), dt);
    applySheet(tax, S.tax.eval(T), dt);
    const sv = S.sup.eval(T);
    applySheet(sup, sv, dt);
    applySheet(p1, S.p1.eval(T), dt);
    applySheet(p2, S.p2.eval(T), dt);

    // Mesa: presente mientras dura "Hoy, sin Automatta"
    const deskVis = smooth(0.35, 0.9, T) * (1 - smooth(CH.read, CH.read + 0.3, T));
    deskGroup.visible = deskVis > 0.01;
    if (deskGroup.visible) {
      deskMat.opacity = deskVis;
      deskMat.depthWrite = deskVis > 0.98;
      deskGroup.position.y = (1 - deskVis) * -0.6;
      for (const m of propMats) {
        m.transparent = deskVis < 0.99;
        m.opacity = deskVis;
      }
    }

    // Sobre
    const ev = S.env.eval(T);
    envGroup.visible = ev.vis > 0.005;
    if (envGroup.visible) {
      envGroup.position.set(ev.x, ev.y, ev.z);
      envGroup.rotation.set(ev.rx, ev.ry, ev.rz);
      envGroup.scale.setScalar((0.35 + 0.65 * ev.vis) * ev.s);
      flapPivot.rotation.x = -Math.PI * ev.flap * 0.94;
    }

    // Libro mayor
    const bv = S.book.eval(T);
    bookGroup.visible = bv.vis > 0.005;
    if (bookGroup.visible) {
      bookGroup.position.set(bv.x - pageW / 2 + pageW * (1 - bv.open) * 0.5, bv.y, bv.z);
      bookGroup.rotation.set(bv.rx, bv.ry, 0);
      bookGroup.scale.setScalar((0.35 + 0.65 * bv.vis) * bv.s);
      coverPivot.rotation.y = -Math.PI * bv.open;
      left.group.visible = bv.open > 0.5;
    }

    // Columnas de caja: fantasmas que tiemblan, o la previsión real
    const bars = S.bars.eval(T);
    barGroup.visible = bars.vis > 0.005;
    if (barGroup.visible) {
      barGroup.position.set(bars.x, bars.y, bars.z);
      barMeshes.forEach((b, i) => {
        const ghost = 0.55 + 0.45 * Math.sin(flutterClock * 1.7 + i * 1.3) * Math.sin(flutterClock * 0.9 + i);
        const real = cash[i] / 36 + (i === 0 ? bars.lift * 0.12 : 0);
        const appear = clamp(bars.vis * 1.6 - i * 0.04);
        b.scale.y = Math.max(0.02, (ghost * (1 - bars.known) + real * bars.known) * 1.6 * appear);
        b.material = bars.known > 0.5 ? (i === 7 ? barMats.red : i === 0 && bars.lift > 0.5 ? barMats.bright : barMats.green) : barMats.ghost;
      });
    }

    // Eslabones de la cadena entre F-2039 → F-2040 → F-2041
    const lk = S.links.eval(T).vis;
    linkMeshes.forEach((m, i) => {
      m.visible = lk > 0.01;
      if (!m.visible) return;
      const [a, b] = i < 3 ? [p2, p1] : [p1, inv];
      worldPoint(a, 1, 0.5, p0);
      worldPoint(b, 0, 0.5, p1v);
      const k = (i % 3) + 1;
      m.position.lerpVectors(p0, p1v, k / 4);
      m.rotation.set(k % 2 ? 0 : Math.PI / 2, 0.25, 0);
      m.scale.setScalar(Math.max(0.001, clamp(lk * 3 - (i % 3) * 0.6)));
    });

    // Hoja de ruta
    const rd = S.road.eval(T).vis;
    roadGroup.visible = rd > 0.01;
    if (roadGroup.visible)
      markers.forEach((m, i) => {
        const k = clamp(rd * 2.2 - i * 0.35);
        m.g.scale.setScalar(0.001 + k);
        m.flag.u.uBend.value = 0.3;
      });

    // Sello
    const st = S.stamp.eval(T);
    let press = st.press;
    let svis = st.vis;
    for (const at of [world.user.stampAt && T < CH.tesoreria + 0.56 ? world.user.stampAt : 0, world.user.approveAt && T < CH.proveedores + 0.72 ? world.user.approveAt : 0]) {
      if (!at) continue;
      const k = (now - at) / 650;
      if (k < 1) {
        svis = Math.max(svis, Math.sin(Math.PI * k));
        press = Math.max(press, k < 0.5 ? (k / 0.5) ** 4 : 1 - (k - 0.5) / 0.5);
      }
    }
    if (press > 0.96 && lastPress <= 0.96) shake = 1;
    lastPress = press;
    stampGroup.visible = svis > 0.01;
    if (stampGroup.visible) {
      const userTarget = world.user.approveAt && T > CH.proveedores && T < CH.verifactu ? 2 : null;
      const tgt = [inv, tax, sup][userTarget ?? Math.round(st.target)];
      tgt.group.updateMatrixWorld();
      worldPoint(tgt, st.u, st.v, p0);
      tgt.group.getWorldQuaternion(qtmp);
      nrm.set(0, 0, 1).applyQuaternion(qtmp).normalize();
      // Anticipación: sube un poco antes de bajar de golpe.
      const antic = press < 0.33 ? Math.sin(Math.PI * clamp(press * 3)) * 0.08 : 0;
      stampGroup.position.copy(p0).addScaledVector(nrm, 0.004 + (1 - press) * 0.9 + antic);
      const dot = clamp(up.dot(nrm), -1, 1);
      axis.crossVectors(up, nrm);
      if (axis.length() < 1e-5) axis.set(1, 0, 0);
      stampGroup.quaternion.setFromAxisAngle(axis.normalize(), Math.acos(dot));
      // El caucho se aplasta un poco al golpear.
      const squash = press > 0.9 ? (press - 0.9) * 0.6 : 0;
      const k = 0.55 + 0.45 * svis;
      stampGroup.scale.set(k * (1 + squash), k * (1 - squash), k * (1 + squash));
      const green = st.ink > 0.5 || userTarget !== null;
      rubberMat.color.set(green ? '#1f5a3e' : '#8f2a22');
      const ws = es.world.stamps;
      setStampLabel(userTarget !== null ? ws.approved : green ? (tgt === tax ? ws.draft : tgt === sup ? ws.approved : ws.paid) : ws.overdue, green ? '#1f6b4a' : '#c8372d');
    }

    // Lupa: recorre la hoja que se está leyendo
    const scanning = iv.scan > -0.5 ? inv : sv.scan > -0.5 ? sup : null;
    glass.visible = !!scanning;
    if (scanning) {
      const scanV = scanning === inv ? iv.scan : sv.scan;
      worldPoint(scanning, 0.5 + Math.sin(scanV * 9) * 0.18, clamp(1 - scanV, 0.05, 0.95), p0);
      scanning.group.getWorldQuaternion(qtmp);
      nrm.set(0, 0, 1).applyQuaternion(qtmp).normalize();
      glass.position.copy(p0).addScaledVector(nrm, 0.45);
      glass.quaternion.copy(qtmp);
      glass.rotateZ(-0.6 + Math.sin(scanV * 6) * 0.08);
      glass.scale.setScalar(Math.max(0.001, clamp(Math.min(scanV + 0.1, 1.1 - scanV) * 6)));
    }

    // Multitud
    const cv = { ...S.crowd.eval(T) };
    const size = world.user.size;
    if (size && T > CH.audience && T < CH.roadmap) cv.vis = size === 'medium' ? 1 : 0;
    crowd.visible = cv.vis > 0.01;
    if (crowd.visible) {
      for (let i = 0; i < N; i++) {
        const p = crowdPose(i, flutterClock, cv);
        pos4.set(p.x, p.y, p.z);
        q4.setFromEuler(e4.set(p.rx, p.ry, p.rz, 'XYZ'));
        scl4.setScalar(p.s * (0.4 + 0.6 * cv.vis));
        crowd.setMatrixAt(i, m4.compose(pos4, q4, scl4));
        aClean.setX(i, cv.clean);
      }
      crowd.instanceMatrix.needsUpdate = true;
      aClean.needsUpdate = true;
    }

    // Fondo y niebla: papel de día, tinta de noche (Verifactu)
    bg.lerp(fx.dark > 0.5 ? INK_BG : PAPER_BG, 1 - Math.exp(-dt * 4));
    (scene.background as Color).copy(bg);
    const fog = scene.fog as Fog;
    fog.color.copy(bg);
    fog.near = (30 - fx.fog * 25) * zoom;
    fog.far = (60 - fx.fog * 49) * zoom;
    const dark = (bg.r - PAPER_BG.r) / (INK_BG.r - PAPER_BG.r);
    (floor.material as ShadowMaterial).opacity = 0.16 * (1 - dark);
    scene.environmentIntensity = 0.9 - dark * 0.35;
    key.intensity = 2.2 - dark * 1.2;
    grade.uniforms.uGray.value = fx.gray;
    grade.uniforms.uTime.value = elapsed % 10;
    grade.uniforms.uDark.value = dark;
    fadeIn += (1 - fadeIn) * (1 - Math.exp(-dt * 2.5));
    canvas.style.opacity = String(fadeIn);
    const css = `rgb(${Math.round(bg.r * 255)} ${Math.round(bg.g * 255)} ${Math.round(bg.b * 255)})`;
    if (css !== lastCss) {
      lastCss = css;
      document.documentElement.style.setProperty('--world-bg', css);
    }

    composer.render();

    invQuad = inv.group.visible ? quad(inv) : [];
    updateLabels(T);
    const surveyOn = T > CH.survey + 0.35 && T < CH.end && invQuad.length;
    surveyLink.style.display = surveyOn ? 'block' : 'none';
    if (surveyOn) {
      const xs = invQuad.map((p) => p[0]);
      const ys = invQuad.map((p) => p[1]);
      const l = Math.min(...xs);
      const tp = Math.min(...ys);
      surveyLink.style.transform = `translate(${l}px, ${tp}px)`;
      surveyLink.style.width = `${Math.max(...xs) - l}px`;
      surveyLink.style.height = `${Math.max(...ys) - tp}px`;
    }
  };

  const isShown = (o: Object3D) => {
    let n: Object3D | null = o;
    while (n) {
      if (!n.visible) return false;
      n = n.parent;
    }
    return true;
  };
  const anchorPoint = (a: Anchor, T: number, out: Vector3): boolean => {
    if ('actor' in a) {
      if (a.actor === 'book') {
        if (!bookGroup.visible) return false;
        out.set(pageW * 0.5, pageH * 0.5 + 0.1, 0).applyMatrix4(bookGroup.matrixWorld);
        return true;
      }
      const s = sheets[a.actor];
      if (!s || !isShown(s.group)) return false;
      worldPoint(s, a.uv[0], a.uv[1], out);
      return true;
    }
    if ('world' in a) {
      out.set(a.world[0], a.world[1], a.world[2]);
      return true;
    }
    if ('bar' in a) {
      if (!barGroup.visible) return false;
      if (a.bar < 0) out.set(0, 1.8, 0).applyMatrix4(barGroup.matrixWorld);
      else out.set(0, 1, 0).applyMatrix4(barMeshes[a.bar].matrixWorld);
      return true;
    }
    if ('marker' in a) {
      if (!roadGroup.visible) return false;
      out.set(0, 1.6, 0).applyMatrix4(markers[a.marker].g.matrixWorld);
      return true;
    }
    if ('link' in a) {
      const m = linkMeshes[a.link * 3 + 1];
      if (!m || !m.visible) return false;
      out.setFromMatrixPosition(m.matrixWorld);
      return true;
    }
    if ('from' in a) {
      const k = smooth(a.span[0], a.span[1], T);
      if (!anchorPoint(a.from, T, p0) || !anchorPoint(a.to, T, p1v)) return false;
      out.lerpVectors(p0, p1v, k);
      out.y += Math.sin(Math.PI * k) * 0.5;
      out.z += Math.sin(Math.PI * k) * 0.4;
      return true;
    }
    return false;
  };

  const lp = new Vector3();
  const updateLabels = (T: number) => {
    for (const L of labelEls) {
      const o = window01(L.spec.show[0], L.spec.show[1], T, 0.04);
      if (o <= 0.01 || !anchorPoint(L.spec.at, T, lp)) {
        if (L.el.style.opacity !== '0') L.el.style.opacity = '0';
        continue;
      }
      const [x, y, z] = toScreen(lp);
      if (z > 1) {
        L.el.style.opacity = '0';
        continue;
      }
      const txt = typeof L.spec.text === 'function' ? L.spec.text(T, { size: world.user.size ?? (T > CH.audience + 0.55 ? 'medium' : 'small') }) : L.spec.text;
      if (txt !== L.text) {
        L.text = txt;
        L.box.textContent = txt;
      }
      const k = mobile ? 0.6 : 1;
      let dx = L.spec.dx * k;
      const dy = L.spec.dy * k;
      const bw = L.box.offsetWidth || 160;
      const bx = x + dx;
      if (bx + bw / 2 > vw - 10) dx -= bx + bw / 2 - (vw - 10);
      if (bx - bw / 2 < 10) dx += 10 - (bx - bw / 2);
      L.el.style.opacity = String(o);
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      L.box.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      L.line.style.width = `${Math.max(0, Math.hypot(dx, dy) - 14)}px`;
      L.line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    }
  };

  // Los shaders se compilan en paralelo (sin bloquear la página) antes del primer fotograma.
  resize();
  camera.position.set(0, 0, 6.2);
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    /* si el navegador no lo soporta, se compilan al dibujar */
  }
  world.ready = true;
  document.documentElement.classList.add('world-ready');
  canvas.style.opacity = '0';
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      surveyLink.remove();
      if (labelsRoot) labelsRoot.textContent = '';
      world.ready = false;
      document.documentElement.classList.remove('world-ready', 'world-can-grab', 'world-grabbing');
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
