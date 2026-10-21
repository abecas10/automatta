// Motor de fotogramas clave para la historia.
// Cada actor tiene pistas por propiedad; su valor es una función pura de T (posición del scroll),
// así que la escena se puede recorrer hacia delante y hacia atrás sin estados raros.

export type Ease = (t: number) => number;

export const E = {
  lin: (t: number) => t,
  io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  /** Golpe: baja acelerando (para el sello). */
  slam: (t: number) => t * t * t * t,
};

type Key = { t: number; v: number; e: Ease };

export class Actor<P extends string = string> {
  private tracks = new Map<P, Key[]>();
  readonly v: Record<P, number>;
  constructor(readonly defaults: Record<P, number>) {
    this.v = { ...defaults };
  }

  private track(p: P) {
    let k = this.tracks.get(p);
    if (!k) this.tracks.set(p, (k = []));
    return k;
  }

  /** Valor de una propiedad en T (con las claves añadidas hasta ahora). */
  at(p: P, T: number): number {
    const keys = this.tracks.get(p);
    if (!keys || !keys.length) return this.defaults[p];
    if (T <= keys[0].t) return keys[0].v;
    const last = keys[keys.length - 1];
    if (T >= last.t) return last.v;
    let i = 1;
    while (keys[i].t < T) i++;
    const a = keys[i - 1];
    const b = keys[i];
    const span = b.t - a.t;
    const f = span <= 0 ? 1 : b.e((T - a.t) / span);
    return a.v + (b.v - a.v) * f;
  }

  /** Fija valores en T (sin transición previa: se mantienen hasta la siguiente clave). */
  set(t: number, props: Partial<Record<P, number>>) {
    for (const p in props) {
      const keys = this.track(p as P);
      const prev = this.at(p as P, t);
      keys.push({ t: t - 1e-4, v: prev, e: E.lin }, { t, v: props[p] as number, e: E.lin });
      keys.sort((a, b) => a.t - b.t);
    }
    return this;
  }

  /** Movimiento de t0 a t1 hacia los valores dados (parte del valor que tenga en t0). */
  to(t0: number, t1: number, props: Partial<Record<P, number>>, e: Ease = E.io) {
    for (const p in props) {
      const keys = this.track(p as P);
      const from = this.at(p as P, t0);
      keys.push({ t: t0, v: from, e: E.lin }, { t: t1, v: props[p] as number, e });
      keys.sort((a, b) => a.t - b.t);
    }
    return this;
  }

  /** Evalúa todas las propiedades en T. */
  eval(T: number) {
    for (const p in this.defaults) this.v[p] = this.at(p, T);
    return this.v;
  }
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 fuera de [a, b], 1 dentro, con bordes suaves de ancho `f`. */
export const window01 = (a: number, b: number, T: number, f = 0.05) => smooth(a, a + f, T) * (1 - smooth(b - f, b, T));
