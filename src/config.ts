// Configuración global de la web. Cambia aquí URLs y datos de contacto.

/** Enlace único a la encuesta. Todos los botones salen de aquí. */
export const SURVEY_URL = 'https://forms.gle/d2PetC8MTfynULfC6';

export const CONTACT_EMAIL = 'info.automatta@gmail.com';
export const MAILTO = `mailto:${CONTACT_EMAIL}`;
export const MAILTO_CALL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Llamada de 15 minutos con Automatta',
)}`;

/** Fecha de entrada en vigor de Verifactu para sociedades (hora peninsular). */
export const VERIFACTU_DATE = '2027-01-01T00:00:00+01:00';

/** Dominio público: se define en site.config.mjs (raíz del proyecto). */
export { SITE_URL } from '../site.config.mjs';

export const SITE_NAME = 'Automatta';
