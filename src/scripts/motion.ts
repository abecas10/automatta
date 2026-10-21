// Punto de entrada de todo el JS de la página.
// - La interfaz (menú, acordeón, cuenta atrás) funciona siempre.
// - Las animaciones solo se activan si el usuario no pide movimiento reducido.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

import { initUi } from './ui';
import { initReveals } from './reveal';
import { initHero } from './sections/hero';
import { initProblem } from './sections/problem';
import { initHow } from './sections/how';
import { initVerifactu } from './sections/misc';
import { canUseWorld } from './world/support';
import { initWorldScenes } from './world/scenes';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

initUi();

const root = document.documentElement;
const mm = gsap.matchMedia();
// Mundo 3D: se decide una vez. Sin WebGL o con movimiento reducido, la web es la de siempre.
const useWorld = canUseWorld();
root.classList.remove('world-pending');

mm.add(
  {
    motion: '(prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px)',
  },
  (ctx) => {
    const { motion, mobile } = ctx.conditions as Record<string, boolean>;
    if (!motion) {
      root.classList.remove('js-motion');
      return;
    }
    root.classList.add('js-motion');
    if (useWorld) root.classList.add('has-world');
    clearTimeout((window as unknown as { __motionFallback?: number }).__motionFallback);

    // Scroll suave con Lenis, sincronizado con ScrollTrigger.
    const lenis = new Lenis({ duration: 1.0, anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    const opts = { mobile: !!mobile };
    initHero(opts, useWorld);
    let stopScenes: (() => void) | undefined;
    let stopWorld: (() => void) | undefined;
    let disposed = false;

    // El resto de secciones está por debajo del primer pantallazo: se preparan cuando
    // el navegador queda libre, para no bloquear la carga inicial.
    // Se preparan en trozos, cada uno en un momento libre del navegador,
    // para no bloquear el hilo principal con una sola tarea larga.
    const tasks: (() => void)[] = [
      () => {
        if (!useWorld) return;
        stopScenes = initWorldScenes(opts);
      },
      () => initReveals(),
      () => {
        // Sin 3D: animaciones de las ilustraciones de siempre.
        if (useWorld) return;
        initProblem(opts);
        initHow(opts);
      },
      () => initVerifactu(),
      () => ScrollTrigger.refresh(),
    ];
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 120));
    const runNext = () => {
      const task = tasks.shift();
      if (!task || disposed) return;
      // ctx.add mantiene estas animaciones dentro del contexto (se revierten con matchMedia).
      ctx.add(task);
      idle(runNext, { timeout: 600 });
    };
    idle(runNext, { timeout: 1200 });

    // El render 3D se descarga y arranca después, sin competir con el primer pintado.
    if (useWorld) {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-world-canvas]');
      const labels = document.querySelector<HTMLElement>('[data-world-labels]');
      const boot = () =>
        import('./world/stage')
          .then(({ startStage }) => (canvas && !disposed ? startStage(canvas, labels) : undefined))
          .then((handle) => {
            if (!handle) return;
            if (disposed) handle.stop();
            else stopWorld = handle.stop;
          })
          .catch(() => root.classList.add('world-failed'));
      // Arranca con la primera interacción (scroll, ratón, toque) o a los 4 s de cargar la página.
      let booted = false;
      const go = () => {
        if (booted) return;
        booted = true;
        ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach((ev) => window.removeEventListener(ev, go));
        idle(boot, { timeout: 800 });
      };
      ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, go, { passive: true, once: true }));
      const afterLoad = () => setTimeout(go, 4000);
      if (document.readyState === 'complete') afterLoad();
      else window.addEventListener('load', afterLoad, { once: true });
    }

    // Recalcula posiciones cuando las fuentes terminan de cargar.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      disposed = true;
      stopScenes?.();
      stopWorld?.();
      root.classList.remove('has-world');
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  },
);
