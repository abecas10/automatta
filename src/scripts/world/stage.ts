// Escenario 3D "de papel a tu móvil" con three.js.
// Protagonistas: la factura F-2041 (papel) y un móvil modelado a medida (Automatta).
// Materiales físicos, HDRI de estudio, sombras suaves, muelles y postproducción.
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
  LatheGeometry,
  ExtrudeGeometry,
  ShapeGeometry,
  Shape,
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
  Box3,
  PMREMGenerator,
  EquirectangularReflectionMapping,
  NeutralToneMapping,
  VSMShadowMap,
  PCFSoftShadowMap,
  HalfFloatType,
  WebGLRenderTarget,
  FrontSide,
  BackSide,
  type BufferGeometry,
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

import { SHEET_RATIO } from './constants';
import { buildScript, paperFlags, screenAt, DESK, type LabelSpec, type Anchor } from './script';
import { CH } from './chapters';
import { smooth, window01, clamp } from './keys';
import { paper, drawInvoice, drawExcel, drawSupplier, paperFibreNormal, drawPageEdge, type Paper } from './textures';
import { drawScreen, SW, SH, type ScreenState } from './screen';
import { world } from './state';
import { SURVEY_URL } from '../../config';
import es from '../../content/es';

const FOV = 30;
const PAPER_BG = new Color('#f5f6f3');
const INK_BG = new Color('#14201b');
/** Hoja A4 (en unidades de escena; el móvil mide 0,545 × 1,12, a escala real). */
const SHEET_W = 1.6;
const SHEET_H = SHEET_W * SHEET_RATIO;
const PHONE = { w: 0.545, h: 1.12, d: 0.058, r: 0.08 };
const METER = 7.6;
const AGED = new Color('#ecdcb4');
const WHITE = new Color('#ffffff');

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

// ---------------------------------------------------------------- papel

type PaperUniforms = { uTime: { value: number }; uBend: { value: number }; uCurl: { value: number }; uSeed: { value: number }; uSize: { value: Vector2 } };

const WAVE = /* glsl */ `
uniform float uTime;
uniform float uBend;
uniform float uCurl;
uniform float uSeed;
uniform vec2 uSize;
// Ondulación cuando vuela + un leve abarquillado de bordes cuando reposa (como el papel real).
float paperWave(vec2 q) {
  float t = uTime;
  float w = 0.10 * sin(q.x * 2.6 + t * 2.1 + uSeed * 6.283)
          + 0.07 * sin(q.y * 2.2 + t * 1.6 + uSeed * 3.1)
          + 0.16 * q.x * q.x * sin(t * 1.3 + uSeed * 9.0)
          + 0.10 * q.y * q.y * cos(t * 1.1 + uSeed * 5.0);
  float curl = (pow(abs(q.x), 3.0) * 0.6 + pow(abs(q.y), 4.0) * 0.25) * 0.018;
  return w * uBend + curl * uCurl;
}
`;

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

/** Rectángulo redondeado centrado (para el cuerpo y la pantalla del móvil). */
function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/** Normaliza las UV de una ShapeGeometry a 0..1. */
function normalizeUv(g: BufferGeometry, w: number, h: number) {
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}

// ---------------------------------------------------------------- escenario

export async function startStage(canvas: HTMLCanvasElement, labelsRoot: HTMLElement | null) {
  const mobile = world.mobile;
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = mobile ? PCFSoftShadowMap : VSMShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  scene.background = PAPER_BG.clone();
  scene.fog = new Fog(PAPER_BG.clone(), 30, 60);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 80);
  const S = buildScript();

  // Luz de estudio: sala procedural al instante; después, el HDRI real.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  new HDRLoader().load('/3d/studio.hdr', (hdr) => {
    hdr.mapping = EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
  });
  const key = new DirectionalLight('#fffcf6', 2.3);
  key.position.set(-3, 7.5, 4.5);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
  key.shadow.radius = mobile ? 4 : 10;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0003;
  scene.add(key, key.target, new HemisphereLight('#ffffff', '#cfd4cd', 0.35));

  const floor = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ opacity: 0.15 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = DESK - 0.002;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- Texturas ----------
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
    map: loadTex('/3d/tex/oak_veneer_01_diff.webp', true, 2),
    normalMap: loadTex('/3d/tex/oak_veneer_01_nor.webp', false, 2),
    roughnessMap: loadTex('/3d/tex/oak_veneer_01_rough.webp', false, 2),
  };
  const canvasTex = (c: HTMLCanvasElement) => {
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const time = { value: 0 };

  // ---------- Hojas ----------
  type Sheet = {
    group: Group;
    front: Mesh;
    mat: MeshPhysicalMaterial;
    backMat: MeshPhysicalMaterial;
    u: PaperUniforms;
    paper: Paper;
    tex: CanvasTexture;
    w: number;
    h: number;
    spring: { p: Vector3; v: Vector3; r: Vector3; rv: Vector3; init: boolean };
    flutter: number;
  };
  const texPx = mobile ? 900 : 1400;
  const sheetGeo = new PlaneGeometry(1, 1, mobile ? 20 : 30, mobile ? 28 : 42);
  const sheets: Record<string, Sheet> = {};
  const makeSheet = (name: string, w: number, h: number): Sheet => {
    const front = paper(340, 481, texPx);
    const u: PaperUniforms = { uTime: time, uBend: { value: 0 }, uCurl: { value: 0 }, uSeed: { value: Math.random() }, uSize: { value: new Vector2(w, h) } };
    const tex = canvasTex(front.canvas);
    const mat = new MeshPhysicalMaterial({
      map: tex,
      roughness: 0.85,
      sheen: 0.4,
      sheenRoughness: 0.8,
      sheenColor: new Color('#ffffff'),
      normalMap: fibre,
      normalScale: new Vector2(0.1, 0.1),
      side: FrontSide,
    });
    bendable(mat, u);
    const backMat = new MeshPhysicalMaterial({ color: '#eef0eb', roughness: 0.9, sheen: 0.3, normalMap: fibre, normalScale: new Vector2(0.1, 0.1), side: BackSide });
    bendable(backMat, u);
    const group = new Group();
    group.rotation.order = 'XYZ';
    const fm = new Mesh(sheetGeo, mat);
    const bm = new Mesh(sheetGeo, backMat);
    fm.castShadow = bm.castShadow = true;
    fm.receiveShadow = true;
    group.add(fm, bm);
    scene.add(group);
    const s: Sheet = {
      group,
      front: fm,
      mat,
      backMat,
      u,
      paper: front,
      tex,
      w,
      h,
      spring: { p: new Vector3(), v: new Vector3(), r: new Vector3(), rv: new Vector3(), init: false },
      flutter: 0,
    };
    sheets[name] = s;
    return s;
  };
  const inv = makeSheet('inv', SHEET_W, SHEET_H);
  const excel = makeSheet('excel', SHEET_W, SHEET_H);
  const sup = makeSheet('sup', SHEET_W, SHEET_H);
  await nextFrame();

  // ---------- Pila de facturas sin cobrar: un bloque de hojas, no planos sueltos ----------
  const edgeP = paper(256, 64, 256);
  drawPageEdge(edgeP);
  const edgeTex = canvasTex(edgeP.canvas);
  edgeTex.wrapS = edgeTex.wrapT = RepeatWrapping;
  const topP = paper(340, 481, texPx * 0.6);
  drawInvoice(topP, { overdue: true, paid: false, qr: false }, { ...es.world.invoiceB, due: es.world.invoiceB.due });
  const stackSide = new MeshStandardMaterial({ map: edgeTex, roughness: 0.9 });
  const stackTop = new MeshPhysicalMaterial({ map: canvasTex(topP.canvas), roughness: 0.85, sheen: 0.3 });
  const stackGeo = new BoxGeometry(SHEET_W * 0.8, 1, SHEET_H * 0.8);
  stackGeo.translate(0, 0.5, 0);
  const stack = new Mesh(stackGeo, [stackSide, stackSide, stackTop, stackSide, stackSide, stackSide]);
  stack.castShadow = stack.receiveShadow = true;
  scene.add(stack);

  // ---------- El móvil ----------
  const phone = new Group();
  phone.rotation.order = 'YXZ';
  scene.add(phone);
  const frameMat = new MeshPhysicalMaterial({ color: '#3a4741', metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const bodyShape = roundedRect(PHONE.w, PHONE.h, PHONE.r);
  const bevel = 0.012;
  const bodyGeo = new ExtrudeGeometry(bodyShape, { depth: PHONE.d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 6, curveSegments: 28 });
  bodyGeo.translate(0, 0, -(PHONE.d - bevel * 2) / 2);
  const body = new Mesh(bodyGeo, frameMat);
  body.castShadow = true;
  phone.add(body);
  // Cristal frontal negro (marco de la pantalla)
  const glassFront = new Mesh(
    new ShapeGeometry(roundedRect(PHONE.w - 0.004, PHONE.h - 0.004, PHONE.r - 0.002), 28),
    new MeshPhysicalMaterial({ color: '#050706', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0 }),
  );
  glassFront.position.z = PHONE.d / 2 + 0.0008;
  phone.add(glassFront);
  // Pantalla (emisiva) con reflejos de cristal encima
  const scrW = PHONE.w - 0.036;
  const scrH = PHONE.h - 0.036;
  const scrGeo = new ShapeGeometry(roundedRect(scrW, scrH, PHONE.r - 0.016), 28);
  normalizeUv(scrGeo, scrW, scrH);
  const scrScale = mobile ? 1.6 : 2.2;
  const scrCanvas = document.createElement('canvas');
  scrCanvas.width = Math.round(SW * scrScale);
  scrCanvas.height = Math.round(SH * scrScale);
  const scrCtx = scrCanvas.getContext('2d')!;
  scrCtx.scale(scrScale, scrScale);
  const scrTex = canvasTex(scrCanvas);
  const screenMat = new MeshPhysicalMaterial({
    color: '#000000',
    emissive: '#ffffff',
    emissiveMap: scrTex,
    emissiveIntensity: 0.92,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  });
  const screen = new Mesh(scrGeo, screenMat);
  screen.position.z = PHONE.d / 2 + 0.0016;
  phone.add(screen);
  // Trasera de cristal esmerilado con el logo y la isla de cámaras
  const backP = paper(200, 410, 512);
  {
    const c = backP.ctx;
    c.fillStyle = '#26332d';
    c.fillRect(0, 0, 200, 410);
    c.strokeStyle = 'rgba(245,246,243,0.22)';
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(100, 215, 18, -0.5, Math.PI * 1.25);
    c.stroke();
  }
  const backGeo = new ShapeGeometry(roundedRect(PHONE.w - 0.006, PHONE.h - 0.006, PHONE.r - 0.003), 28);
  normalizeUv(backGeo, PHONE.w - 0.006, PHONE.h - 0.006);
  const back = new Mesh(backGeo, new MeshPhysicalMaterial({ map: canvasTex(backP.canvas), roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.35 }));
  back.rotation.y = Math.PI;
  back.position.z = -PHONE.d / 2 - 0.0008;
  phone.add(back);
  const island = new Mesh(new RoundedBoxGeometry(0.2, 0.2, 0.014, 4, 0.04), new MeshPhysicalMaterial({ color: '#2b3832', roughness: 0.2, clearcoat: 1 }));
  island.position.set(PHONE.w / 2 - 0.135, PHONE.h / 2 - 0.135, -PHONE.d / 2 - 0.007);
  phone.add(island);
  const lensGlass = new MeshPhysicalMaterial({ color: '#05080a', roughness: 0.02, metalness: 0.3, clearcoat: 1 });
  const lensRing = new MeshPhysicalMaterial({ color: '#9aa39e', metalness: 1, roughness: 0.25 });
  [
    [-0.045, 0.045],
    [-0.045, -0.045],
    [0.045, 0],
  ].forEach(([lx, ly]) => {
    const ring = new Mesh(new CylinderGeometry(0.036, 0.036, 0.012, 32), lensRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(island.position.x + lx, island.position.y + ly, -PHONE.d / 2 - 0.016);
    const glass = new Mesh(new CylinderGeometry(0.027, 0.027, 0.013, 32), lensGlass);
    glass.rotation.x = Math.PI / 2;
    glass.position.copy(ring.position);
    glass.position.z -= 0.001;
    phone.add(ring, glass);
  });
  // Botones laterales
  const btnGeo = new RoundedBoxGeometry(0.008, 0.09, 0.02, 2, 0.004);
  [
    [-1, 0.22],
    [-1, 0.1],
    [1, 0.16],
  ].forEach(([side, y]) => {
    const b = new Mesh(btnGeo, frameMat);
    b.position.set((side * PHONE.w) / 2 + side * 0.003, y, 0);
    phone.add(b);
  });

  // ---------- Sello de caucho ----------
  const wood = new MeshPhysicalMaterial({ ...oak, color: '#9a6b45', roughness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.22 });
  const darkWood = new MeshPhysicalMaterial({ ...oak, color: '#5a3a26', roughness: 0.5, clearcoat: 0.9, clearcoatRoughness: 0.18 });
  const brass = new MeshPhysicalMaterial({ color: '#c9a25a', metalness: 1, roughness: 0.28, clearcoat: 0.4 });
  const rubberMat = new MeshPhysicalMaterial({ color: '#8f2a22', roughness: 0.92 });
  const stampGroup = new Group();
  scene.add(stampGroup);
  const profile = [
    [0, 0],
    [0.12, 0],
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
    [0, 0.546],
  ].map(([x, y]) => new Vector2(x, y));
  const handle = new Mesh(new LatheGeometry(profile, 48), wood);
  handle.position.y = 0.2;
  const ferrule = new Mesh(new CylinderGeometry(0.128, 0.13, 0.05, 48), brass);
  ferrule.position.y = 0.205;
  const block = new Mesh(new RoundedBoxGeometry(0.72, 0.16, 0.44, 4, 0.03), darkWood);
  block.position.y = 0.1;
  const rubber = new Mesh(new RoundedBoxGeometry(0.68, 0.05, 0.4, 3, 0.012), rubberMat);
  rubber.position.y = 0.022;
  [handle, ferrule, block, rubber].forEach((m) => (m.castShadow = true));
  const labelP = paper(200, 120, 256);
  const labelMesh = new Mesh(new PlaneGeometry(0.5, 0.3), new MeshStandardMaterial({ map: canvasTex(labelP.canvas), roughness: 0.8 }));
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.y = 0.181;
  stampGroup.add(handle, ferrule, block, rubber, labelMesh);
  stampGroup.scale.setScalar(0.7);
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
    c.textAlign = 'center';
    let px = 26;
    do {
      c.font = `700 ${px}px "Archivo Variable", system-ui`;
      px -= 1;
    } while (c.measureText(txt.toUpperCase()).width > 150 && px > 10);
    c.fillText(txt.toUpperCase(), 100, 70);
    ((labelMesh.material as MeshStandardMaterial).map as Texture).needsUpdate = true;
  };

  // ---------- Columnas de caja fantasma (niebla) ----------
  const barGroup = new Group();
  scene.add(barGroup);
  const barGeo = new RoundedBoxGeometry(0.12, 1, 0.12, 3, 0.02);
  barGeo.translate(0, 0.5, 0);
  const ghostMat = new MeshPhysicalMaterial({ color: '#c9cfca', roughness: 0.45, clearcoat: 0.6, transparent: true, opacity: 0.8 });
  const barMeshes = Array.from({ length: 13 }, (_, i) => {
    const b = new Mesh(barGeo, ghostMat);
    b.position.x = (i - 6) * 0.17;
    b.castShadow = true;
    barGroup.add(b);
    return b;
  });

  // ---------- Mesa de roble y objetos reales (Poly Haven, CC0) ----------
  const deskGroup = new Group();
  scene.add(deskGroup);
  const deskMat = new MeshPhysicalMaterial({ ...oak, color: '#d6cec2', roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.4, transparent: true });
  const desk = new Mesh(new RoundedBoxGeometry(6.4, 0.16, 4.2, 5, 0.05), deskMat);
  desk.position.set(0.2, DESK - 0.08, -0.35);
  // Roble claro y natural: se le quita parte del tono anaranjado de la textura.
  deskMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float dl = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dl), 0.45) * 1.18;`,
    );
  };
  desk.receiveShadow = true;
  deskGroup.add(desk);
  const propMats: Material[] = [];
  const gltf = new GLTFLoader();
  gltf.setMeshoptDecoder(MeshoptDecoder);
  const loadModel = (url: string, size: number, x: number, z: number, ry: number) =>
    gltf.load(url, (g) => {
      const o = g.scene;
      const dim = new Box3().setFromObject(o).getSize(new Vector3());
      o.scale.setScalar(size / Math.max(dim.x, dim.y, dim.z));
      o.position.y -= new Box3().setFromObject(o).min.y;
      o.traverse((c) => {
        const m = c as Mesh;
        if (m.isMesh) {
          m.castShadow = m.receiveShadow = true;
          const mm = m.material as Material | Material[];
          propMats.push(...(Array.isArray(mm) ? mm : [mm]));
        }
      });
      const h = new Group();
      h.position.set(x, DESK, z);
      h.rotation.y = ry;
      h.add(o);
      deskGroup.add(h);
    });
  loadModel('/3d/potted_plant_04.glb', 0.2 * METER, -2.35, -1.9, 0.4);

  // ---------- Postproducción ----------
  const composer = new EffectComposer(renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: mobile ? 0 : 4 }));
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
        c.rgb = mix(c.rgb, vec3(l), uGray);
        vec2 d = vUv - 0.5;
        c.rgb *= 1.0 - dot(d, d) * mix(0.22, 0.55, uDark);
        c.rgb += (hash(vUv * 1000.0 + uTime) - 0.5) * 0.016;
        gl_FragColor = c;
      }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ---------- Etiquetas ----------
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
    // En pantallas estrechas la cámara se aleja para que quepa la escena entera.
    zoom = mobile ? Math.max(1, Math.min(1.8, 0.82 / camera.aspect)) : Math.max(1, Math.min(2.1, 1.35 / camera.aspect));
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Utilidades ----------
  const v3 = new Vector3();
  const toScreen = (v: Vector3) => {
    v3.copy(v).project(camera);
    return [(v3.x * 0.5 + 0.5) * vw, (-v3.y * 0.5 + 0.5) * vh, v3.z];
  };
  const sheetPoint = (s: Sheet, u: number, vTop: number, out = new Vector3()) =>
    out.set((u - 0.5) * s.w, (0.5 - vTop) * s.h, 0).applyMatrix4(s.front.matrixWorld);
  const phonePoint = (u: number, vTop: number, out = new Vector3()) => out.set((u - 0.5) * scrW, (0.5 - vTop) * scrH, PHONE.d / 2).applyMatrix4(phone.matrixWorld);
  const phoneQuad = () =>
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([u, v]) => toScreen(phonePoint(u, v)));
  const inside = (pts: number[][], x: number, y: number) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi) c = !c;
    }
    return c;
  };

  // ---------- Interacción: girar el móvil en el hero, tocarlo en la encuesta ----------
  const drag = { active: false, lastX: 0, vel: 0, ry: 0 };
  let hovering = false;
  let quadPts: number[][] = [];
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
    hovering = quadPts.length > 0 && inside(quadPts, e.clientX, e.clientY);
  };
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
    if (!quadPts.length || !inside(quadPts, e.clientX, e.clientY)) return;
    if (world.T < 0.45) {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.vel = 0;
      document.documentElement.classList.add('world-grabbing');
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

  // ---------- Texturas que cambian ----------
  const keys: Record<string, string> = {};
  let lastExcel = -1;
  let lastScreen = '';
  const updateTextures = (T: number, blink: boolean, scr: ScreenState) => {
    const f = paperFlags(T, world.user);
    const invKey = `${f.overdue}${f.paid}`;
    if (keys.inv !== invKey) {
      keys.inv = invKey;
      drawInvoice(inv.paper, { overdue: f.overdue, paid: f.paid, qr: false });
      inv.tex.needsUpdate = true;
    }
    const supKey = `${f.supRead}${f.supApproved}`;
    if (keys.sup !== supKey && S.sup.at('vis', T) > 0.01) {
      keys.sup = supKey;
      drawSupplier(sup.paper, f.supRead, f.supApproved);
      sup.tex.needsUpdate = true;
    }
    const typed = Math.round(S.excel.at('typed', T) * 200) / 200;
    const ex = typed * 1000 + (blink ? 1 : 0);
    if (ex !== lastExcel && S.excel.at('vis', T) > 0.01) {
      lastExcel = ex;
      drawExcel(excel.paper, typed, blink && typed < 1);
      excel.tex.needsUpdate = true;
    }
    const sk = JSON.stringify(scr);
    if (sk !== lastScreen) {
      lastScreen = sk;
      drawScreen(scrCtx, scr);
      scrTex.needsUpdate = true;
    }
  };

  // ---------- Pose de una hoja, con muelle ----------
  const tgtP = new Vector3();
  const tgtR = new Vector3();
  const applySheet = (s: Sheet, v: Record<string, number>, dt: number) => {
    s.group.visible = v.vis > 0.005;
    if (!s.group.visible) {
      s.spring.init = false;
      return;
    }
    tgtP.set(v.x, v.y, v.z);
    tgtR.set(v.rx, v.ry, v.rz);
    const sp = s.spring;
    if (!sp.init) {
      sp.p.copy(tgtP);
      sp.r.copy(tgtR);
      sp.v.set(0, 0, 0);
      sp.rv.set(0, 0, 0);
      sp.init = true;
    } else {
      const k = 150;
      const c = 19;
      const step = (p: Vector3, vel: Vector3, tgt: Vector3) => {
        vel.x += ((tgt.x - p.x) * k - vel.x * c) * dt;
        vel.y += ((tgt.y - p.y) * k - vel.y * c) * dt;
        vel.z += ((tgt.z - p.z) * k - vel.z * c) * dt;
        p.addScaledVector(vel, dt);
      };
      step(sp.p, sp.v, tgtP);
      step(sp.r, sp.rv, tgtR);
    }
    // Nunca por debajo de la mesa
    if (sp.p.y < DESK + 0.004) sp.p.y = DESK + 0.004;
    s.flutter += (Math.min(1, sp.v.length() * 0.22) - s.flutter) * Math.min(1, dt * 6);
    s.group.position.copy(sp.p);
    s.group.rotation.set(sp.r.x, sp.r.y, sp.r.z);
    s.group.scale.setScalar(v.s * (0.6 + 0.4 * Math.min(1, v.vis * 1.5)));
    // Apoyada, no ondea (para que no atraviese la mesa); en el aire, sí.
    const resting = sp.p.y < DESK + 0.05 ? 0 : 1;
    s.u.uBend.value = ((v.bend ?? 0) + s.flutter * 0.4) * resting;
    s.u.uCurl.value = v.curl ?? 0;
    const fade = v.vis < 0.999;
    for (const m of [s.mat, s.backMat]) {
      m.transparent = fade;
      m.opacity = Math.min(1, v.vis * 1.4);
      m.depthWrite = !fade;
    }
  };

  // ---------- Bucle ----------
  let elapsed = 0;
  let flutterClock = 0;
  let lastNow = performance.now();
  let raf = 0;
  let fadeIn = 0;
  let lastCss = '';
  let shake = 0;
  let haptic = 0;
  let lastPress = 0;
  let lastApproved = false;
  const bg = PAPER_BG.clone();
  const camPos = new Vector3();
  const camTarget = new Vector3();
  const up = new Vector3(0, 1, 0);
  const nrm = new Vector3();
  const axis = new Vector3();
  const p0 = new Vector3();
  const p1 = new Vector3();
  const qtmp = new Quaternion();
  const phoneSpring = { p: new Vector3(0, 0.95, 0), v: new Vector3(), r: new Vector3(0, -0.32, 0), rv: new Vector3() };

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

    // Cámara
    const c = S.cam.eval(T);
    const heroMouse = world.pointer.active && T < 0.6;
    camTarget.set(c.tx, c.ty, c.tz);
    camPos
      .set(c.x + (heroMouse ? world.pointer.x * 0.25 : 0), c.y + (heroMouse ? world.pointer.y * 0.12 : 0), c.z)
      .sub(camTarget)
      .multiplyScalar(zoom)
      .add(camTarget);
    shake *= Math.exp(-dt * 10);
    camPos.x += Math.sin(elapsed * 61) * 0.012 * shake;
    camPos.y += Math.cos(elapsed * 53) * 0.012 * shake;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    // Móvil (con muelle, giro manual en el hero y "vibración" al aprobar o al intentar alterar)
    const pv = S.phone.eval(T);
    if (!drag.active) {
      drag.ry += drag.vel;
      drag.vel *= Math.exp(-dt * 3);
      const home = Math.round(drag.ry / (Math.PI * 2)) * Math.PI * 2;
      if (Math.abs(drag.vel) < 0.002) drag.ry += (home - drag.ry) * (1 - Math.exp(-dt * (T < 0.45 ? 1.0 : 6)));
    }
    const float = T < 0.5 ? (1 - T / 0.5) * Math.sin(elapsed * 1.1) * 0.025 : 0;
    const k = 120;
    const cd = 16;
    const tp = new Vector3(pv.x, pv.y + float, pv.z);
    const tr = new Vector3(pv.rx + (heroMouse ? -world.pointer.y * 0.12 : 0), pv.ry + drag.ry + (heroMouse ? world.pointer.x * 0.25 : 0), pv.rz);
    for (const [p, v, t] of [
      [phoneSpring.p, phoneSpring.v, tp],
      [phoneSpring.r, phoneSpring.rv, tr],
    ] as const) {
      v.x += ((t.x - p.x) * k - v.x * cd) * dt;
      v.y += ((t.y - p.y) * k - v.y * cd) * dt;
      v.z += ((t.z - p.z) * k - v.z * cd) * dt;
      p.addScaledVector(v, dt);
    }
    if (phoneSpring.p.y < DESK + 0.03) phoneSpring.p.y = DESK + 0.03;
    const approvedNow = T >= CH.proveedores + 0.8 || world.user.approved;
    if (approvedNow && !lastApproved && T > CH.proveedores) haptic = 1;
    lastApproved = approvedNow;
    if (world.user.tamperAt && now - world.user.tamperAt < 50) haptic = 1;
    haptic *= Math.exp(-dt * 5);
    phone.position.copy(phoneSpring.p);
    phone.rotation.set(phoneSpring.r.x, phoneSpring.r.y, phoneSpring.r.z + Math.sin(now * 0.09) * 0.035 * haptic);
    phone.position.x += Math.sin(now * 0.11) * 0.012 * haptic;
    phone.scale.setScalar(pv.s * (0.5 + 0.5 * pv.vis));
    phone.visible = pv.vis > 0.01;
    const hoverSurvey = hovering && T > CH.survey + 0.3 && T < CH.end;
    world.hoverLift += ((hoverSurvey ? 1 : 0) - world.hoverLift) * (1 - Math.exp(-dt * 8));
    phone.position.z += world.hoverLift * 0.12;
    document.documentElement.classList.toggle('world-can-grab', hovering && T < 0.45);
    document.documentElement.classList.toggle('world-can-tap', hoverSurvey);

    const scr = screenAt(T, world.user, elapsed, hoverSurvey);
    updateTextures(T, Math.floor(elapsed * 2.2) % 2 === 0, scr);

    // Hojas
    const iv = S.inv.eval(T);
    applySheet(inv, iv, dt);
    inv.mat.color.copy(WHITE).lerp(AGED, iv.age);
    applySheet(excel, S.excel.eval(T), dt);
    applySheet(sup, S.sup.eval(T), dt);

    // Pila de facturas sin cobrar
    const sk = S.stack.eval(T);
    stack.visible = sk.vis > 0.01 && sk.h > 0.002;
    if (stack.visible) {
      stack.position.set(sk.x, DESK, sk.z);
      stack.rotation.y = sk.ry;
      stack.scale.set(1, sk.h, 1);
    }

    // Mesa
    const dv = S.desk.eval(T).vis;
    deskGroup.visible = dv > 0.01;
    if (deskGroup.visible) {
      deskMat.opacity = dv;
      deskMat.depthWrite = dv > 0.98;
      deskGroup.position.y = (1 - dv) * -0.5;
      for (const m of propMats) {
        m.transparent = dv < 0.99;
        m.opacity = dv;
      }
    }

    // Columnas fantasma
    const bv = S.bars.eval(T);
    barGroup.visible = bv.vis > 0.01;
    if (barGroup.visible) {
      barGroup.position.set(bv.x, bv.y, bv.z);
      barMeshes.forEach((b, i) => {
        const ghost = 0.55 + 0.45 * Math.sin(flutterClock * 1.7 + i * 1.3) * Math.sin(flutterClock * 0.9 + i);
        b.scale.y = Math.max(0.02, ghost * 1.3 * clamp(bv.vis * 1.6 - i * 0.04));
      });
    }

    // Sello: anticipación, golpe, aplastamiento y temblor de cámara
    const st = S.stamp.eval(T);
    let press = st.press;
    let svis = st.vis;
    const userStamp = world.user.stampAt && T >= CH.tesoreria && T < CH.tesoreria + 0.48 ? world.user.stampAt : 0;
    if (userStamp) {
      const kk = (now - userStamp) / 650;
      if (kk < 1) {
        svis = Math.max(svis, Math.sin(Math.PI * kk));
        press = Math.max(press, kk < 0.5 ? (kk / 0.5) ** 4 : 1 - (kk - 0.5) / 0.5);
      }
    }
    if (press > 0.96 && lastPress <= 0.96) shake = 1;
    lastPress = press;
    stampGroup.visible = svis > 0.01;
    if (stampGroup.visible) {
      const tgt = st.target > 0.5 ? sup : inv;
      tgt.group.updateMatrixWorld();
      sheetPoint(tgt, st.u, st.v, p0);
      tgt.group.getWorldQuaternion(qtmp);
      nrm.set(0, 0, 1).applyQuaternion(qtmp).normalize();
      const antic = press < 0.33 ? Math.sin(Math.PI * clamp(press * 3)) * 0.06 : 0;
      stampGroup.position.copy(p0).addScaledVector(nrm, 0.003 + (1 - press) * 0.7 + antic);
      axis.crossVectors(up, nrm);
      if (axis.length() < 1e-5) axis.set(1, 0, 0);
      stampGroup.quaternion.setFromAxisAngle(axis.normalize(), Math.acos(clamp(up.dot(nrm), -1, 1)));
      stampGroup.rotateY(-0.12);
      const squash = press > 0.9 ? (press - 0.9) * 0.6 : 0;
      const sc = 0.7 * (0.6 + 0.4 * svis);
      stampGroup.scale.set(sc * (1 + squash), sc * (1 - squash), sc * (1 + squash));
      const green = st.ink > 0.5 || !!userStamp;
      rubberMat.color.set(green ? '#1f5a3e' : '#8f2a22');
      const ws = es.world.stamps;
      setStampLabel(tgt === sup ? ws.approved : green ? ws.paid : ws.overdue, green ? '#1f6b4a' : '#c8372d');
    }

    // Fondo, niebla y luz (de noche en Verifactu)
    bg.lerp(fx.dark > 0.5 ? INK_BG : PAPER_BG, 1 - Math.exp(-dt * 4));
    (scene.background as Color).copy(bg);
    const fog = scene.fog as Fog;
    fog.color.copy(bg);
    fog.near = (30 - fx.fog * 25.5) * zoom;
    fog.far = (60 - fx.fog * 51) * zoom;
    const dark = (bg.r - PAPER_BG.r) / (INK_BG.r - PAPER_BG.r);
    (floor.material as ShadowMaterial).opacity = 0.15 * (1 - dark);
    scene.environmentIntensity = 0.85 - dark * 0.3;
    key.intensity = 2.3 - dark * 1.3;
    screenMat.emissiveIntensity = 0.92 - dark * 0.15;
    grade.uniforms.uGray.value = fx.gray;
    grade.uniforms.uTime.value = elapsed % 10;
    grade.uniforms.uDark.value = dark;
    fadeIn += (1 - fadeIn) * (1 - Math.exp(-dt * 3));
    canvas.style.opacity = String(fadeIn);
    const css = `rgb(${Math.round(bg.r * 255)} ${Math.round(bg.g * 255)} ${Math.round(bg.b * 255)})`;
    if (css !== lastCss) {
      lastCss = css;
      document.documentElement.style.setProperty('--world-bg', css);
    }

    composer.render();

    phone.updateMatrixWorld();
    quadPts = phone.visible ? phoneQuad() : [];
    updateLabels(T);
    const surveyOn = T > CH.survey + 0.3 && T < CH.end && quadPts.length;
    surveyLink.style.display = surveyOn ? 'block' : 'none';
    if (surveyOn) {
      const xs = quadPts.map((p) => p[0]);
      const ys = quadPts.map((p) => p[1]);
      const l = Math.min(...xs);
      const tp2 = Math.min(...ys);
      surveyLink.style.transform = `translate(${l}px, ${tp2}px)`;
      surveyLink.style.width = `${Math.max(...xs) - l}px`;
      surveyLink.style.height = `${Math.max(...ys) - tp2}px`;
    }
  };

  const isShown = (o: Object3D) => {
    for (let n: Object3D | null = o; n; n = n.parent) if (!n.visible) return false;
    return true;
  };
  const anchorPoint = (a: Anchor, T: number, out: Vector3): boolean => {
    if ('actor' in a) {
      if (a.actor === 'phone') {
        if (!phone.visible) return false;
        phonePoint(a.uv[0], a.uv[1], out);
        return true;
      }
      const s = sheets[a.actor];
      if (!s || !isShown(s.group)) return false;
      sheetPoint(s, a.uv[0], a.uv[1], out);
      return true;
    }
    if ('world' in a) {
      out.set(a.world[0], a.world[1], a.world[2]);
      return true;
    }
    if ('stack' in a) {
      if (!stack.visible) return false;
      out.set(0, 1, 0).applyMatrix4(stack.matrixWorld);
      return true;
    }
    if ('from' in a) {
      const kk = smooth(a.span[0], a.span[1], T);
      if (!anchorPoint(a.from, T, p0) || !anchorPoint(a.to, T, p1)) return false;
      out.lerpVectors(p0, p1, kk);
      out.y += Math.sin(Math.PI * kk) * 0.35;
      out.z += Math.sin(Math.PI * kk) * 0.3;
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
      const txt = typeof L.spec.text === 'function' ? L.spec.text(T) : L.spec.text;
      if (txt !== L.text) {
        L.text = txt;
        L.box.textContent = txt;
      }
      const kk = mobile ? 0.6 : 1;
      let dx = L.spec.dx * kk;
      const dy = L.spec.dy * kk;
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

  // Primer dibujo de la pantalla y compilación de shaders en paralelo, antes del primer fotograma.
  drawScreen(scrCtx, { kind: 'lock' });
  scrTex.needsUpdate = true;
  camera.position.set(0, 0.95, 4.6);
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    /* sin soporte: se compilan al dibujar */
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
      document.documentElement.classList.remove('world-ready', 'world-can-grab', 'world-can-tap', 'world-grabbing');
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
