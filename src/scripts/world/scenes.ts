// Con el mundo 3D activo: ata el scroll a los actos y coreografía el texto de cada escena.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { world } from './state';
import { ACT } from './constants';

type Opts = { mobile: boolean };
type Segment = { st: ScrollTrigger; map: (p: number) => number };

const formatEuro = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

export function initWorldScenes({ mobile }: Opts) {
  world.mobile = mobile;
  const segments: Segment[] = [];
  const lerp = (a: number, b: number) => (p: number) => a + (b - a) * p;
  const add = (st: ScrollTrigger | undefined, map: (p: number) => number) => st && segments.push({ st, map });
  const range = (trigger: string, start: string, end: string, a: number, b: number) =>
    document.querySelector(trigger) && add(ScrollTrigger.create({ trigger, start, end }), lerp(a, b));

  // 0 → 1 · El hero se convierte en tormenta al entrar en "El problema".
  range('#problema', 'top bottom', 'top top', ACT.cloud, ACT.storm);

  // 1 → 2 · El problema, fijado: tres escenas dentro de la tormenta y, al final, se congela.
  const track = document.querySelector<HTMLElement>('[data-problem-track]');
  if (track) {
    const scenes = gsap.utils.toArray<HTMLElement>('[data-pscene]', track);
    gsap.set(scenes.slice(1), { autoAlpha: 0, y: 40 });
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: track, start: 'top top', end: `+=${scenes.length * 85}%`, pin: true, scrub: 0.6, anticipatePin: 1 },
    });
    // Cada escena entra rápido, se queda casi todo su tramo y sale rápido.
    scenes.forEach((s, i) => {
      if (i > 0) tl.to(s, { autoAlpha: 1, y: 0, duration: 0.18 }, i - 0.05);
      if (i < scenes.length - 1) tl.to(s, { autoAlpha: 0, y: -40, duration: 0.18 }, i + 0.82);
    });
    tl.to({}, { duration: 0.4 });
    add(tl.scrollTrigger, lerp(ACT.storm, ACT.freeze));
  }

  // 2 → 4 · Automatta: las hojas se ordenan y se sellan; luego se tumban y aparece el panel.
  const tf = document.querySelector<HTMLElement>('[data-transform]');
  if (tf) {
    const pin = tf.querySelector<HTMLElement>('.tf-pin')!;
    const steps = gsap.utils.toArray<HTMLElement>('.tf-step', tf);
    const dash = tf.querySelector<HTMLElement>('[data-tf-dash]')!;
    const kpis = gsap.utils.toArray<HTMLElement>('[data-value]', dash);
    const rows = gsap.utils.toArray<HTMLElement>('[data-tf-row]', dash);
    const line = dash.querySelector('.tf-line');
    const area = dash.querySelector('.tf-area');
    const setStep = (n: number) =>
      steps.forEach((s, i) => {
        s.classList.toggle('is-active', i === n);
        s.classList.toggle('is-done', i < n);
      });
    gsap.set(dash, { autoAlpha: 0, y: 40 });
    gsap.set(rows, { autoAlpha: 0 });
    if (line) gsap.set(line, { drawSVG: '0%' });
    if (area) gsap.set(area, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: tf,
        start: 'top top',
        end: mobile ? '+=220%' : '+=280%',
        pin,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => setStep(self.progress < 0.3 ? 0 : self.progress < 0.62 ? 1 : 2),
        onLeaveBack: () => setStep(-1),
      },
    });
    tl.to({}, { duration: 6 });
    tl.to(dash, { autoAlpha: 1, y: 0, duration: 1 }, 6.2)
      .to(rows, { autoAlpha: 1, stagger: 0.15, duration: 0.4 }, 6.6);
    kpis.forEach((el, i) => {
      const target = Number(el.dataset.value!.replace(/\D/g, ''));
      const counter = { n: 0 };
      tl.fromTo(counter, { n: 0 }, { n: target, duration: 1, onUpdate: () => (el.textContent = formatEuro(counter.n)) }, 6.6 + i * 0.2);
    });
    if (line) tl.to(line, { drawSVG: '100%', duration: 1.4, ease: 'none' }, 7.2);
    if (area) tl.to(area, { opacity: 1, duration: 0.6 }, 8);
    tl.to({}, { duration: 0.6 });
    // 0 – 0.55: se ordenan; 0.55 – 0.75: se tumban; después, el panel.
    add(tl.scrollTrigger, (p) => (p < 0.55 ? ACT.freeze + p / 0.55 : ACT.grid + Math.min(1, (p - 0.55) / 0.2)));
  }

  // 4 → 5 · Cómo funciona: el orden se convierte en una cinta que pasa por el escáner.
  range('#como-funciona', 'top 85%', 'top 15%', ACT.floor, ACT.river);
  const how = document.querySelector('#como-funciona');
  if (how)
    ScrollTrigger.create({
      trigger: how,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => (world.flow = self.progress * 2.2),
    });

  // 5 → 6 · Verifactu: todo cae en una sola pila sellada, de noche.
  range('#verifactu', 'top 80%', 'top 15%', ACT.river, ACT.tower);
  const vf = document.querySelector('#verifactu');
  if (vf)
    ScrollTrigger.create({
      trigger: vf,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => (world.dark = self.isActive ? 1 : 0),
    });

  // 6 → 7 → 8 · Para quién (dos pilas) y hoja de ruta (cuatro pilas que crecen).
  range('#para-quien', 'top 75%', 'top 15%', ACT.tower, ACT.piles2);
  range('#hoja-de-ruta', 'top 75%', 'top 20%', ACT.piles2, ACT.piles4);

  // 8 → 9 · La encuesta: una hoja viene hasta ti y se convierte en el documento real.
  const surveyDoc = document.querySelector<HTMLElement>('[data-survey-doc] .doc');
  if (surveyDoc) {
    world.surveyEl = surveyDoc;
    surveyDoc.removeAttribute('data-reveal');
    gsap.set(surveyDoc, { autoAlpha: 0 });
    let shown = false;
    add(
      ScrollTrigger.create({
        trigger: '#encuesta',
        start: 'top 85%',
        end: 'top 15%',
        onUpdate: (self) => {
          const show = self.progress > 0.97;
          if (show !== shown) {
            shown = show;
            // Se espera a que la hoja 3D haya aterrizado antes de mostrar la de verdad.
            gsap.to(surveyDoc, { autoAlpha: show ? 1 : 0, duration: show ? 0.5 : 0.2, delay: show ? 0.35 : 0, overwrite: true });
          }
        },
      }),
      lerp(ACT.piles4, ACT.survey),
    );
  }
  range('#equipo', 'top bottom', 'top 30%', ACT.survey, ACT.gone);

  // Fase objetivo: la del último tramo que ya ha empezado.
  const update = () => {
    let target: number = ACT.cloud;
    for (const s of segments) if (s.st.progress > 0) target = s.map(s.st.progress);
    world.target = target;
  };
  gsap.ticker.add(update);
  return () => gsap.ticker.remove(update);
}
