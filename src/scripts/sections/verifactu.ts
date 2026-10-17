import { gsap } from 'gsap';

export function initVerifactu() {
  const units = document.querySelectorAll<HTMLElement>('.vf-unit');
  if (!units.length) return;
  gsap.from(units, {
    y: 40,
    rotateX: -60,
    opacity: 0,
    transformPerspective: 600,
    transformOrigin: '50% 100%',
    duration: 1,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: units[0], start: 'top 85%', once: true },
  });
}
