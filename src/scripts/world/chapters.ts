// Capítulos de la historia de F-2041. El 3D y el DOM comparten estos índices.
export const CH = {
  hero: 0,
  typing: 1, // hoy: alguien teclea sus datos a mano
  overdue: 2, // hoy: pasan los días y vence
  fog: 3, // hoy: no sabes cómo va la caja
  cause: 4, // una misma causa: todo se congela
  read: 5, // Automatta la lee sola
  cobros: 6, // se envía y se reclama sola
  tesoreria: 7, // llega el cobro, se cuadra y se sella
  cierre: 8, // se archiva en el libro
  impuestos: 9, // su IVA salta al modelo 303
  proveedores: 10, // lo mismo con las facturas que pagas
  verifactu: 11, // queda encadenada e inalterable
  audience: 12, // pequeña o mediana
  roadmap: 13, // hoja de ruta
  survey: 14, // la factura se da la vuelta: es la encuesta
  end: 15,
} as const;
export const CH_COUNT = 16;
