// Con el escenario 3D: convierte el scroll en una posición de la historia (T)
// y conecta los botones del texto con los objetos.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { world } from './state';
import { CH } from './chapters';

type Opts = { mobile: boolean };

export function initWorldScenes({ mobile }: Opts) {
  world.mobile = mobile;
  const cleanups: (() => void)[] = [];

  // Cada capítulo aporta su tramo: T = índice + avance.
  const tracks: { index: number; st: ScrollTrigger }[] = [];
  document.querySelectorAll<HTMLElement>('[data-ch]').forEach((el) => {
    const index = Number(el.dataset.ch);
    const hero = index === CH.hero;
    tracks.push({
      index,
      st: ScrollTrigger.create({ trigger: el, start: hero ? 'top top' : 'top 65%', end: hero ? 'bottom 65%' : 'bottom 65%' }),
    });
  });
  tracks.sort((a, b) => a.st.start - b.st.start);
  // Tras la encuesta, la historia termina al llegar al equipo.
  const team = document.querySelector('#equipo');
  const endSt = team ? ScrollTrigger.create({ trigger: team, start: 'top bottom', end: 'top 40%' }) : null;

  // Depuración: #t=2.5 en la URL congela la historia en ese momento (para revisar encuadres).
  const update = () => {
    const forced = /^#t=([\d.]+)$/.exec(location.hash);
    if (forced) {
      world.target = Number(forced[1]);
      return;
    }
    let T = 0;
    for (const { index, st } of tracks) if (st.progress > 0) T = index + st.progress;
    if (endSt && endSt.progress > 0) T = CH.end + endSt.progress;
    world.target = T;
  };
  gsap.ticker.add(update);
  cleanups.push(() => gsap.ticker.remove(update));

  // En móvil, el texto de cada capítulo es una tarjeta pegada abajo: su "top" depende de su alto.
  if (mobile) {
    const fit = () =>
      document.querySelectorAll<HTMLElement>('.ch-copy').forEach((c) => {
        const h = c.offsetHeight;
        c.style.setProperty('--copy-top', `${Math.max(window.innerHeight * 0.14, window.innerHeight - h - 12)}px`);
      });
    fit();
    window.addEventListener('resize', fit);
    ScrollTrigger.addEventListener('refreshInit', fit);
    cleanups.push(() => window.removeEventListener('resize', fit));
  }

  // Botones que actúan sobre los objetos.
  const stampBtn = document.querySelector<HTMLButtonElement>('[data-action="stamp"]');
  const approveBtn = document.querySelector<HTMLButtonElement>('[data-action="approve"]');
  const tamperBtn = document.querySelector<HTMLButtonElement>('[data-action="tamper"]');
  const tamperMsg = document.querySelector<HTMLElement>('[data-tamper-msg]');
  const done = (b: HTMLButtonElement) => {
    b.disabled = true;
    b.textContent = `${b.dataset.done} ✓`;
  };
  const onStamp = () => {
    world.user.stamped = true;
    world.user.stampAt = performance.now();
    if (stampBtn) done(stampBtn);
  };
  const onApprove = () => {
    world.user.approved = true;
    world.user.approveAt = performance.now();
    if (approveBtn) done(approveBtn);
  };
  const onTamper = () => {
    world.user.tamperAt = performance.now();
    if (tamperMsg) tamperMsg.textContent = tamperMsg.dataset.text ?? '';
  };
  stampBtn?.addEventListener('click', onStamp);
  approveBtn?.addEventListener('click', onApprove);
  tamperBtn?.addEventListener('click', onTamper);

  // Selector pequeña / mediana: cambia la escena y el texto que se muestra.
  const sizeBtns = document.querySelectorAll<HTMLButtonElement>('[data-size]');
  const segments = document.querySelectorAll<HTMLElement>('[data-segment]');
  const setSize = (size: 'small' | 'medium') => {
    world.user.size = size;
    sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
    segments.forEach((s) => (s.hidden = s.dataset.segment !== size));
  };
  segments.forEach((s) => (s.hidden = s.dataset.segment !== 'small'));
  sizeBtns.forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size as 'small' | 'medium')));
  // Si el usuario no elige, la historia enseña las dos: primero la pequeña y luego la mediana.
  const audience = document.querySelector('#para-quien [data-ch]');
  if (audience) {
    ScrollTrigger.create({
      trigger: audience,
      start: 'top 65%',
      end: 'bottom 65%',
      onUpdate: (self) => {
        if (world.user.size === null || world.user.size === undefined) {
          const auto = self.progress > 0.55 ? 'medium' : 'small';
          sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === auto)));
          segments.forEach((s) => (s.hidden = s.dataset.segment !== auto));
        }
      },
    });
  }

  return () => cleanups.forEach((c) => c());
}
