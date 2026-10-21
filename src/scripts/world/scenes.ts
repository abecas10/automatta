// Con el escenario 3D: convierte el scroll en una posición de la historia (T),
// hace aparecer y desaparecer el texto de cada paso y conecta los botones con los objetos.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { world } from './state';
import { CH } from './chapters';

type Opts = { mobile: boolean };

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function initWorldScenes({ mobile }: Opts) {
  world.mobile = mobile;
  const cleanups: (() => void)[] = [];

  // Cada paso aporta su tramo: T = índice + avance (0 al quedar fijo, 1 al soltarse).
  const tracks: { index: number; stage: HTMLElement | null; st: ScrollTrigger }[] = [];
  document.querySelectorAll<HTMLElement>('[data-ch]').forEach((el) => {
    const index = Number(el.dataset.ch);
    const hero = index === CH.hero;
    tracks.push({
      index,
      stage: el.querySelector<HTMLElement>('.ch-stage'),
      st: ScrollTrigger.create({ trigger: el, start: 'top top', end: hero ? 'bottom top' : 'bottom bottom' }),
    });
  });
  tracks.sort((a, b) => a.st.start - b.st.start);
  const after = document.querySelector('#hoja-de-ruta');
  const endSt = after ? ScrollTrigger.create({ trigger: after, start: 'top bottom', end: 'top 30%' }) : null;

  const update = () => {
    // Depuración: #t=2.5 en la URL congela la historia en ese momento.
    const forced = /^#t=([\d.]+)$/.exec(location.hash);
    let T = 0;
    for (const { index, st } of tracks) if (st.progress > 0) T = index + st.progress;
    if (endSt && endSt.progress > 0) T = CH.end + endSt.progress;
    world.target = forced ? Number(forced[1]) : T;
    // El texto de cada paso entra al llegar y sale antes de que llegue el siguiente.
    for (const { index, stage } of tracks) {
      if (!stage) continue;
      const local = world.target - index;
      const o = smooth(-0.04, 0.08, local) * (1 - smooth(0.88, 0.99, local));
      stage.style.setProperty('--o', o.toFixed(3));
      stage.style.setProperty('--dir', local < 0.5 ? '1' : '-1');
      stage.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    }
  };
  gsap.ticker.add(update);
  cleanups.push(() => gsap.ticker.remove(update));
  void mobile;

  // Botones que actúan sobre los objetos.
  const stampBtn = document.querySelector<HTMLButtonElement>('[data-action="stamp"]');
  const approveBtn = document.querySelector<HTMLButtonElement>('[data-action="approve"]');
  const tamperBtn = document.querySelector<HTMLButtonElement>('[data-action="tamper"]');
  const tamperMsg = document.querySelector<HTMLElement>('[data-tamper-msg]');
  const done = (b: HTMLButtonElement) => {
    b.disabled = true;
    b.textContent = `${b.dataset.done} ✓`;
  };
  stampBtn?.addEventListener('click', () => {
    world.user.stamped = true;
    world.user.stampAt = performance.now();
    done(stampBtn);
  });
  approveBtn?.addEventListener('click', () => {
    world.user.approved = true;
    world.user.approveAt = performance.now();
    done(approveBtn);
  });
  tamperBtn?.addEventListener('click', () => {
    world.user.tamperAt = performance.now();
    if (tamperMsg) tamperMsg.textContent = tamperMsg.dataset.text ?? '';
  });

  // Selector pequeña / mediana: cambia lo que enseña el móvil.
  const sizeBtns = document.querySelectorAll<HTMLButtonElement>('[data-size]');
  const paint = (size: 'small' | 'medium') => sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
  sizeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      world.user.size = b.dataset.size as 'small' | 'medium';
      paint(world.user.size);
    }),
  );
  // Si el usuario no elige, la historia enseña primero la pequeña y luego la mediana.
  const autoSize = () => {
    if (!world.user.size) paint(world.target > CH.audience + 0.55 ? 'medium' : 'small');
  };
  gsap.ticker.add(autoSize);
  cleanups.push(() => gsap.ticker.remove(autoSize));

  return () => cleanups.forEach((c) => c());
}
