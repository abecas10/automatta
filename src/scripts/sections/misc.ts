import { gsap } from 'gsap';

/** Cuenta atrás de Verifactu: las cifras suben una vez al llegar. */
export function initVerifactu() {
  const units = document.querySelectorAll<HTMLElement>('.vf-unit');
  if (!units.length) return;
  gsap.from(units, {
    y: 28,
    opacity: 0,
    duration: 1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: units[0], start: 'top 85%', once: true },
  });
}

/** Encuesta: la lista del documento se va marcando al llegar. */
export function initSurvey() {
  const doc = document.querySelector<HTMLElement>('[data-survey-doc]');
  if (!doc) return;
  const items = doc.querySelectorAll<HTMLElement>('.sv-item');
  const tl = gsap.timeline({ scrollTrigger: { trigger: doc, start: 'top 70%', once: true }, delay: 0.3 });
  items.forEach((item, i) => tl.add(() => item.classList.add('is-checked'), i * 0.35));
}
