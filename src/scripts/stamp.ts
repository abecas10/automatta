/** Estampa un sello: cae con fuerza, se asienta un poco y queda puesto. */
export function pressStamp(tl: gsap.core.Timeline, el: Element | undefined, at: number | string) {
  if (!el) return tl;
  const rot = parseFloat(getComputedStyle(el as HTMLElement).getPropertyValue('--rot')) || -7;
  return tl
    .fromTo(
      el,
      { opacity: 0, scale: 1.7, rotate: rot - 8 },
      { opacity: 1, scale: 1, rotate: rot, duration: 0.32, ease: 'power4.in' },
      at,
    )
    .to(el, { scale: 0.97, duration: 0.08, ease: 'power1.out' }, '>')
    .to(el, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, '>');
}
