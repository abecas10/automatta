import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/** Texto del elemento sin saltos de línea ni espacios dobles (para aria-label). */
export const cleanText = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Revelado genérico al hacer scroll: titulares por palabras y bloques con fade-up. */
export function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const label = cleanText(el);
    SplitText.create(el, {
      type: 'words,lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => {
        el.setAttribute('aria-label', label);
        return gsap.from(self.words, {
          yPercent: 110,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      },
    });
  });

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, overwrite: true },
      ),
  });
}

/** Microinteracciones solo para ratón: inclinación 3D, botones magnéticos y cursor. */
export function initMicro() {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 7);
      ry(px * 9);
      card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.35;
    const zone = el.parentElement ?? el;
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    zone.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height) * 1.2;
      if (dist < radius) {
        x(dx * strength);
        y(dy * strength);
      } else {
        x(0);
        y(0);
      }
    });
    zone.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });

  const dot = document.querySelector<HTMLElement>('.cursor-dot');
  if (dot) {
    const cx = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3.out' });
    const cy = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      dot.style.opacity = '1';
      cx(e.clientX);
      cy(e.clientY);
      const interactive = (e.target as HTMLElement).closest('a, button, [data-tilt]');
      dot.classList.toggle('is-active', !!interactive);
    });
    document.addEventListener('pointerleave', () => (dot.style.opacity = '0'));
  }
}
