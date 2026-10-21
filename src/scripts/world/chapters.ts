// Pasos de la historia "de papel a tu móvil". El HTML y el 3D comparten estos índices.
export const CH = {
  hero: 0,
  meet: 1, // F-2041 cae sobre la mesa
  typing: 2, // alguien la teclea a mano
  overdue: 3, // vence y nadie reclama
  fog: 4, // no ves tu caja
  cause: 5, // una misma causa: todo se congela
  automatta: 6, // el móvil se levanta y se enciende
  read: 7, // los datos vuelan del papel a la pantalla
  cobros: 8, // recordatorios día 3, 20 y 40
  tesoreria: 9, // llega la transferencia y el sello marca COBRADA
  cierre: 10, // el papel entra en el móvil: apunte enlazado
  impuestos: 11, // el 303 se rellena solo
  proveedores: 12, // una factura de proveedor se lee y se aprueba
  verifactu: 13, // registrada y encadenada (de noche)
  audience: 14, // pequeña o mediana
  survey: 15, // la pantalla es la encuesta
  end: 16,
} as const;
export const CH_COUNT = 17;
