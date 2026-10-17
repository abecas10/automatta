// Comportamiento de interfaz que no depende de animaciones.

export function initUi() {
  initNavbar();
  initMenu();
  initFaq();
  initCountdown();
}

function initNavbar() {
  const nav = document.querySelector<HTMLElement>('[data-navbar]');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMenu() {
  const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  if (!button || !panel) return;
  const label = button.querySelector('[data-menu-label]');

  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? button.dataset.close! : button.dataset.open!;
    panel.toggleAttribute('data-open', open);
    panel.inert = !open;
    document.documentElement.classList.toggle('menu-open', open);
    const lenis = (window as unknown as { lenis?: { stop(): void; start(): void } }).lenis;
    if (open) {
      lenis?.stop();
      panel.querySelector<HTMLElement>('a')?.focus();
    } else {
      lenis?.start();
    }
  };

  panel.inert = true;
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

function initFaq() {
  document.querySelectorAll<HTMLButtonElement>('[data-faq-button]').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls')!);
    if (!panel) return;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      panel.closest('[data-faq-item]')?.toggleAttribute('data-open', open);
    });
  });
}

function initCountdown() {
  const el = document.querySelector<HTMLElement>('[data-countdown]');
  if (!el) return;
  const target = new Date(el.dataset.target!).getTime();
  const parts = {
    days: el.querySelector('[data-unit="days"]'),
    hours: el.querySelector('[data-unit="hours"]'),
    minutes: el.querySelector('[data-unit="minutes"]'),
    seconds: el.querySelector('[data-unit="seconds"]'),
  };
  const pad = (n: number) => String(n).padStart(2, '0');

  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const s = Math.floor(diff / 1000);
    const values = {
      days: String(Math.floor(s / 86400)),
      hours: pad(Math.floor((s % 86400) / 3600)),
      minutes: pad(Math.floor((s % 3600) / 60)),
      seconds: pad(s % 60),
    };
    for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
      const node = parts[key];
      if (node && node.textContent !== values[key]) {
        node.textContent = values[key];
        node.classList.remove('tick');
        void (node as HTMLElement).offsetWidth; // reinicia la animación CSS
        node.classList.add('tick');
      }
    }
    if (diff === 0) el.setAttribute('data-arrived', '');
  };
  tick();
  setInterval(tick, 1000);
}
