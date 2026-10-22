import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { cleanText } from '../reveal';

type Opts = { mobile: boolean };

export function initHero({ mobile }: Opts) {
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  if (!title) return;

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const label = cleanText(title);
  SplitText.create(title, {
    type: 'words,lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) => {
      title.setAttribute('aria-label', label);
      gsap.set(title, { visibility: 'visible' });
      return gsap.from(self.words, {
        yPercent: 115,
        rotate: 4,
        duration: 1.1,
        stagger: 0.07,
        ease: 'expo.out',
      });
    },
  });
  intro.fromTo(
    '[data-hero-in]',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.09, delay: 0.35 },
  );
  gsap.from('[data-hero-sub]', { y: 16, duration: 1, ease: 'expo.out', delay: 0.3 });

  // Parallax suave de la ilustración al salir del hero.
  if (!mobile) {
    gsap.to('[data-hero-visual] .hero-flow', {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: title.closest('section'), start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  heroFlowLoop();
}

/** Bucle de la ilustración: cada factura viaja al banco, se marca cobrada y se dibuja la caja. */
function heroFlowLoop() {
  const root = document.querySelector<SVGElement>('.hero-flow svg');
  if (!root) return;
  const q = gsap.utils.selector(root);
  const invoices = q('.hf-invoice');
  const coins = q('.hf-coin');
  const toasts = q('.hf-toast');
  const line = root.querySelector<SVGPathElement>('.hf-line')!;
  const len = line.getTotalLength();

  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(q('.hf-area'), { opacity: 0 });
  gsap.set(q('.hf-end, .hf-end-pulse'), { opacity: 0, transformOrigin: '50% 50%' });
  gsap.to(q('.hf-path'), { strokeDashoffset: -20, duration: 1.2, ease: 'none', repeat: -1 });

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.2 });
  invoices.forEach((inv, i) => {
    const at = i * 1.05;
    tl.set(coins[i], { opacity: 1 }, at)
      .to(
        coins[i],
        {
          duration: 0.9,
          ease: 'power2.inOut',
          motionPath: { path: `#hf-path-${i}`, align: `#hf-path-${i}`, alignOrigin: [0.5, 0.5] },
        },
        at,
      )
      .to(coins[i], { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.2 }, at + 0.8)
      .to(inv.querySelector('.hf-status-due'), { opacity: 0, duration: 0.25 }, at + 0.1)
      .to(inv.querySelector('.hf-status-paid'), { opacity: 1, duration: 0.25 }, at + 0.15)
      .fromTo(q('.hf-bank-glow'), { opacity: 0.25 }, { opacity: 1, duration: 0.25, yoyo: true, repeat: 1 }, at + 0.85)
      .fromTo(toasts[i], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, at + 0.9)
      .to(toasts[i], { opacity: 0, y: -14, duration: 0.35 }, at + 1.6);
  });
  tl.to(line, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 1.4)
    .to(q('.hf-area'), { opacity: 1, duration: 1 }, 2.2)
    .to(q('.hf-end'), { opacity: 1, duration: 0.3 }, 3)
    .fromTo(q('.hf-end-pulse'), { opacity: 0.5, scale: 0.6 }, { opacity: 0, scale: 2.2, duration: 1.2, repeat: 2 }, 3)
    // Reinicio suave
    .to(q('.hf-status-paid'), { opacity: 0, duration: 0.4 }, '+=0.6')
    .to(q('.hf-status-due'), { opacity: 1, duration: 0.4 }, '<')
    .to(line, { strokeDashoffset: -len, duration: 0.8, ease: 'power2.in' }, '<')
    .to(q('.hf-area, .hf-end'), { opacity: 0, duration: 0.5 }, '<')
    .set(line, { strokeDashoffset: len });

  // Pausa el bucle cuando no se ve (ahorra batería).
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
  io.observe(root);
}
