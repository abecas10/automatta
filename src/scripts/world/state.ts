// Estado compartido entre el scroll (scenes.ts) y el render 3D (renderer.ts).
// El scroll escribe `target`; el render suaviza hacia él y dibuja.

export type WorldState = {
  /** Fase objetivo según el scroll (0 = hero … 10 = fin). */
  target: number;
  /** Fase suavizada que usa el render. */
  phase: number;
  /** Puntero normalizado (-1..1). */
  pointer: { x: number; y: number; active: boolean };
  /** Fondo objetivo: 0 = papel, 1 = tinta. */
  dark: number;
  /** Rectángulo del documento de la encuesta (para que la hoja 3D aterrice encima). */
  surveyEl: HTMLElement | null;
  /** Avance del río de documentos (lo mueve el scroll en "Cómo funciona"). */
  flow: number;
  mobile: boolean;
  ready: boolean;
};

export const world: WorldState = {
  target: 0,
  phase: 0,
  pointer: { x: 0, y: 0, active: false },
  dark: 0,
  surveyEl: null,
  flow: 0,
  mobile: false,
  ready: false,
};
