// Constantes compartidas del mundo 3D (módulo ligero: lo importa el bundle inicial).

/** Actos, en el orden en que aparecen al bajar. */
export const ACT = {
  cloud: 0, // hero: papeles sueltos
  storm: 1, // el problema: tormenta de papel
  freeze: 2, // "una misma causa": todo se congela
  grid: 3, // Automatta: cada hoja en su sitio, sellada en verde
  floor: 4, // el orden se tumba y deja paso al panel
  river: 5, // cómo funciona: cinta de documentos que cruzan el escáner
  tower: 6, // Verifactu: una pila sellada
  piles2: 7, // para quién: pequeña y mediana
  piles4: 8, // hoja de ruta: cuatro pilas que crecen
  survey: 9, // la encuesta: una sola hoja llega hasta ti
  gone: 10,
} as const;
export const ACT_COUNT = 11;

/** Tipos de documento. En el atlas, la celda es kind * 2 (+1 la versión en orden). */
export const KIND = {
  invoiceA: 0,
  invoiceB: 1,
  reminder: 2,
  sheet: 3,
  bank: 4,
  supplier: 5,
  ticket: 6,
  tax: 7,
  survey: 8,
} as const;
export const KIND_COUNT = 9;

export const ATLAS_COLS = 6;
/** Relación alto/ancho de una hoja A4. */
export const SHEET_RATIO = 1.414;
