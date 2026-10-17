// Punto de entrada de todo el JS de la página.
// - La interfaz (menú, acordeón, cuenta atrás) funciona siempre.
// - Las animaciones solo se activan si el usuario no pide movimiento reducido.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

import { initUi } from './ui';
import { initReveals, initMicro } from './reveal';
import { initHero } from './sections/hero';
import { initProblem } from './sections/problem';
import { initTransformation } from './sections/transformation';
import { initHow, initRoadmap } from './sections/how';
import { initVerifactu } from './sections/verifactu';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin, DrawSVGPlugin);

initUi();

const root = document.documentElement;
const mm = gsap.matchMedia();

mm.add(
  {
    motion: '(prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px)',
    fine: '(hover: hover) and (pointer: fine)',
  },
  (ctx) => {
    const { motion, mobile, fine } = ctx.conditions as Record<string, boolean>;
    if (!motion) {
      root.classList.remove('js-motion');
      return;
    }
    root.classList.add('js-motion');
    clearTimeout((window as unknown as { __motionFallback?: number }).__motionFallback);

    // Scroll suave con Lenis, sincronizado con ScrollTrigger.
    const lenis = new Lenis({ duration: 1.1, anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    const opts = { mobile: !!mobile, fine: !!fine };
    initHero(opts);
    initReveals();
    initProblem(opts);
    initTransformation(opts);
    initHow(opts);
    initRoadmap();
    initVerifactu();
    if (fine) initMicro();

    // Recalcula posiciones cuando las fuentes terminan de cargar.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  },
);
