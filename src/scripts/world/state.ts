// Estado compartido entre el scroll (scenes.ts) y el escenario 3D (stage.ts).

export type WorldState = {
  /** Posición objetivo en la historia según el scroll (capítulo + avance). */
  target: number;
  /** Posición suavizada que usa el escenario. */
  T: number;
  pointer: { x: number; y: number; active: boolean };
  /** Lo que ha hecho el usuario con los objetos. */
  user: {
    stamped: boolean;
    stampAt: number;
    approved: boolean;
    approveAt: number;
    tamperAt: number;
    size: 'small' | 'medium' | null;
  };
  /** Elevación de la hoja de la encuesta al pasar el ratón por encima. */
  hoverLift: number;
  mobile: boolean;
  ready: boolean;
};

export const world: WorldState = {
  target: 0,
  T: 0,
  pointer: { x: 0, y: 0, active: false },
  user: { stamped: false, stampAt: 0, approved: false, approveAt: 0, tamperAt: 0, size: null },
  hoverLift: 0,
  mobile: false,
  ready: false,
};
