import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/** Texto del elemento sin saltos de línea ni espacios dobles (para aria-label). */
export const cleanText = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

const isHeading = (el: Element) => /^H[1-6]$/.test(el.tagName);

/**
 * Revelados contenidos al hacer scroll:
 * - [data-rise]: titulares que suben línea a línea dentro de una máscara (una sola vez).
 * - [data-reveal]: documentos y ventanas que aparecen con un leve desplazamiento.
 * El texto corriente no se anima.
 */
export function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    const label = cleanText(el);
    const heading = isHeading(el);
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      // aria-label solo está permitido en titulares; en párrafos se deja el texto tal cual.
      aria: heading ? 'auto' : 'none',
      onSplit: (self) => {
        if (heading) el.setAttribute('aria-label', label);
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, {
          yPercent: 100,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1, overwrite: true }),
  });
}
