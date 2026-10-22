import { gsap } from 'gsap';

type Opts = { mobile: boolean };

export function initProblem({ mobile }: Opts) {
  const inbox = document.querySelector<HTMLElement>('[data-inbox]');
  const sheet = document.querySelector<HTMLElement>('[data-sheet]');
  const fog = document.querySelector<HTMLElement>('[data-fog]');

  // Bandeja: los emails caen y se amontonan; el contador sube.
  if (inbox) {
    const items = inbox.querySelectorAll<HTMLElement>('.inbox-item');
    const count = inbox.querySelector<HTMLElement>('[data-inbox-count]')!;
    const counter = { n: 0 };
    const tl = gsap.timeline({
      scrollTrigger: { trigger: inbox, start: 'top 85%', end: mobile ? 'top 30%' : 'bottom 45%', scrub: 0.6 },
    });
    tl.from(items, {
      y: -60,
      rotate: () => gsap.utils.random(-6, 6),
      opacity: 0,
      stagger: 0.25,
      ease: 'back.out(1.6)',
      duration: 0.6,
    }).to(
      counter,
      {
        n: items.length * 8,
        duration: tl.duration(),
        ease: 'power1.in',
        onUpdate: () => {
          const n = String(Math.max(1, Math.round(counter.n)));
          count.textContent = n;
          count.setAttribute('aria-label', count.getAttribute('aria-label')!.replace(/^\d+/, n));
        },
      },
      0,
    );
    tl.to(items, { x: (i) => (i % 2 ? 4 : -4), rotate: (i) => (i % 2 ? 1.5 : -1.5), stagger: 0.05, duration: 0.3 });
  }

  // Excel: las celdas se van llenando de rojo.
  if (sheet) {
    const bad = sheet.querySelectorAll<HTMLElement>('[data-bad]');
    gsap
      .timeline({ scrollTrigger: { trigger: sheet, start: 'top 80%', end: mobile ? 'top 30%' : 'bottom 45%', scrub: 0.6 } })
      .fromTo(
        bad,
        { backgroundColor: 'rgba(200,55,45,0)', color: 'rgba(200,55,45,0)' },
        { backgroundColor: 'rgba(200,55,45,0.12)', color: 'rgba(200,55,45,1)', stagger: { each: 0.12, from: 'random' }, duration: 0.3 },
      );
  }

  // Niebla: las previsiones bailan y el "?" aparece.
  if (fog) {
    const guesses = fog.querySelectorAll('.fog-guess');
    gsap.fromTo(guesses, { strokeDashoffset: 0 }, { strokeDashoffset: -44, duration: 2, ease: 'none', repeat: -1 });
    gsap.to(guesses, {
      scaleY: (i) => (i ? 1.25 : 0.8),
      transformOrigin: '50% 50%',
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    gsap.fromTo(
      fog.querySelector('.fog-q'),
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, ease: 'elastic.out(1, 0.5)', duration: 1.2, scrollTrigger: { trigger: fog, start: 'top 70%', once: true } },
    );
  }
}
