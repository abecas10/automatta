// Todo el texto de la web en español.
// Para añadir catalán: copia este archivo a `ca.ts`, traduce los valores
// y mantén exactamente las mismas claves.

const es = {
  meta: {
    title: 'Automatta · Cobra antes y sabe tu caja',
    description:
      'Automatta automatiza los cobros y la tesorería de las pymes: reclama facturas, cuadra el banco y te dice cuánta caja tendrás. Ayúdanos con una encuesta de 5 minutos.',
    ogAlt: 'Automatta: cobra antes, sabe tu caja, sin Excel.',
  },

  nav: {
    links: [
      { href: '#problema', label: 'El problema' },
      { href: '#como-funciona', label: 'Cómo funciona' },
      { href: '#verifactu', label: 'Verifactu' },
      { href: '#equipo', label: 'Quiénes somos' },
      { href: '#faq', label: 'Preguntas' },
    ],
    cta: 'Responder la encuesta',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    skip: 'Saltar al contenido',
  },

  hero: {
    eyebrow: 'Startup de Barcelona · en fase de investigación',
    title: 'Cobra antes. Sabe tu caja. Sin Excel.',
    subtitle:
      'Automatta reclama tus facturas, cuadra el banco y te dice cuánta caja tendrás en las próximas semanas.',
    primary: 'Ayúdanos con 5 minutos',
    secondary: 'Ver cómo funciona',
    note: 'Encuesta de 5 minutos · respuestas confidenciales',
    illustrationLabel:
      'Ilustración: tus facturas se convierten en cobros que entran en el banco y en una previsión de caja.',
  },

  problem: {
    eyebrow: 'El problema',
    title: 'Así se vive hoy en muchas pymes.',
    intro:
      'Vendes a 60 o 90 días. Y luego empieza el otro trabajo: perseguir, cuadrar y adivinar.',
    cards: [
      {
        title: 'Reclamar facturas',
        text: 'Cada semana se van horas en emails y llamadas para recordar a los clientes que te deben dinero.',
      },
      {
        title: 'Cuadrar el banco a mano',
        text: 'Movimiento a movimiento, en Excel, buscando qué cobro corresponde a qué factura.',
      },
      {
        title: 'No saber tu caja',
        text: 'Nadie sabe con seguridad cuánta caja habrá dentro de 4 u 8 semanas. Las sorpresas llegan tarde.',
      },
    ],
    inbox: {
      title: 'Bandeja de entrada',
      subject: 'Recordatorio: factura vencida',
      items: [
        'Talleres Ejemplo SL',
        'Distribuciones Muestra SA',
        'Ingeniería Ficticia SL',
        'Logística Demo SL',
        'Construcciones Prueba SA',
        'Servicios Modelo SL',
      ],
    },
    sheet: {
      title: 'cobros_FINAL_v7.xlsx',
    },
  },

  transformation: {
    eyebrow: 'Con Automatta',
    title: 'Del caos a saber dónde estás.',
    steps: [
      'Los recordatorios salen solos.',
      'Cada cobro encaja con su factura.',
      'Y ves tu caja de las próximas semanas.',
    ],
    tag: 'Así funcionará',
    dashboard: {
      title: 'Panel de Automatta',
      kpis: [
        { label: 'Pendiente de cobro', value: '48.000 €' },
        { label: 'Cobrado esta semana', value: '12.000 €' },
        { label: 'Caja en 8 semanas', value: '35.000 €' },
      ],
      listTitle: 'Facturas',
      rows: [
        { client: 'Talleres Ejemplo SL', amount: '4.000 €', status: 'Cobrada' },
        { client: 'Distribuciones Muestra SA', amount: '6.000 €', status: 'Recordatorio enviado' },
        { client: 'Ingeniería Ficticia SL', amount: '2.500 €', status: 'Conciliada' },
        { client: 'Logística Demo SL', amount: '3.000 €', status: 'Llamar hoy' },
      ],
      chartTitle: 'Previsión de caja · 8 semanas',
    },
    reducedNote: 'Antes: emails, Excel y sorpresas. Después: un panel con todo en orden.',
  },

  how: {
    eyebrow: 'Cómo funciona',
    title: 'Tres piezas que trabajan por ti.',
    intro: 'Se conectan entre sí. Tú solo miras el resultado.',
    tag: 'Así funcionará · datos de ejemplo',
    pieces: [
      {
        id: 'cobros',
        number: '01',
        title: 'Cobros automáticos',
        text: 'Detecta las facturas vencidas o a punto de vencer y envía recordatorios a tus clientes, con el tono adecuado en cada momento. Y te avisa de los casos que necesitan una llamada.',
        points: ['Recordatorios automáticos', 'Tono adaptado a cada momento', 'Aviso cuando toca llamar'],
      },
      {
        id: 'conciliacion',
        number: '02',
        title: 'Conciliación bancaria',
        text: 'Se conecta a tu banco y cuadra cada cobro con su factura. Sin que nadie tenga que hacerlo a mano.',
        points: ['Conexión con tu banco', 'Cada cobro con su factura', 'Adiós al Excel de cuadre'],
      },
      {
        id: 'prevision',
        number: '03',
        title: 'Previsión de caja',
        text: 'Te dice cuánta caja tendrás en las próximas semanas a partir de lo que tienes pendiente de cobrar y pagar. Para que no haya sustos.',
        points: ['Próximas 8 semanas', 'Cobros y pagos pendientes', 'Avisos antes del problema'],
      },
    ],
    demoCobros: {
      invoice: 'Factura F-2041',
      client: 'Talleres Ejemplo SL',
      amount: '4.000 €',
      states: ['Vencida', 'Recordatorio enviado', 'Cobrada'],
    },
    demoRecon: {
      bankTitle: 'Banco',
      invoicesTitle: 'Facturas',
      pairs: [
        { bank: 'Transf. Talleres Ejemplo', invoice: 'F-2041 · Talleres Ejemplo SL', amount: '4.000 €' },
        { bank: 'Transf. Distrib. Muestra', invoice: 'F-2038 · Distribuciones Muestra SA', amount: '6.000 €' },
        { bank: 'Transf. Ing. Ficticia', invoice: 'F-2033 · Ingeniería Ficticia SL', amount: '2.500 €' },
      ],
      done: 'Todo cuadrado',
    },
    demoForecast: {
      title: 'Caja prevista',
      weeks: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      alert: 'Semana 6: caja ajustada',
    },
  },

  verifactu: {
    eyebrow: 'Verifactu',
    title: 'Verifactu llega el\u00a01\u00a0de\u00a0enero de\u00a02027.',
    text: 'Verifactu es el sistema de facturación verificable de Hacienda, obligatorio para las sociedades a partir del 1 de enero de 2027. Automatta será compatible con Verifactu, para que no tengas que preocuparte de eso también.',
    countdownLabel: 'Tiempo hasta el 1 de enero de 2027',
    units: { days: 'días', hours: 'horas', minutes: 'minutos', seconds: 'segundos' },
    arrived: 'Verifactu ya es obligatorio para las sociedades.',
    badge: 'Automatta será compatible con Verifactu.',
  },

  audience: {
    eyebrow: 'Para quién es',
    title: 'Pymes que facturan a otras empresas.',
    text: 'De 5 a 50 empleados. Empezamos por Barcelona y Catalunya.',
    facts: [
      { value: '5–50', label: 'empleados' },
      { value: 'B2B', label: 'facturas a empresas' },
      { value: 'BCN', label: 'Barcelona y Catalunya' },
    ],
    sectors: [
      'Industria',
      'Distribución',
      'Servicios profesionales',
      'Ingeniería',
      'Construcción',
      'Tecnología',
      'Logística',
    ],
  },

  survey: {
    eyebrow: 'La encuesta',
    title: 'Lo estamos construyendo contigo.',
    text: 'Antes de lanzar nada, queremos escuchar a empresas como la tuya. Cuéntanos cómo cobras hoy y qué te quita tiempo.',
    bullets: [
      { title: '5 minutos', text: 'Preguntas cortas, sin rodeos.' },
      { title: 'Confidencial', text: 'Tus respuestas solo se usan para este estudio.' },
      { title: 'Te llevas el informe', text: 'Si nos dejas tu contacto, te enviamos los resultados.' },
      { title: 'Acceso prioritario', text: 'Y entras primero en el piloto gratuito.' },
    ],
    cta: 'Responder la encuesta',
    altPrefix: '¿Prefieres contárnoslo en 15 minutos?',
    altLink: 'Escríbenos',
  },

  team: {
    eyebrow: 'Quiénes somos',
    title: 'Dos personas de Barcelona con una idea clara.',
    text: 'Vemos a muchas pymes de aquí perder tiempo y dinero cobrando. Queremos que cobrar sea lo fácil, y que dediquen sus horas a lo que de verdad hacen bien.',
    founders: [
      { name: 'Alex Castella', role: 'Cofundador', initials: 'AC' },
      { name: 'Alex Llagostera', role: 'Cofundador', initials: 'AL' },
    ],
    place: 'Barcelona',
  },

  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que nos suelen preguntar.',
    items: [
      {
        q: '¿Ya puedo usar Automatta?',
        a: 'Todavía no. Estamos en fase de investigación y preparando un piloto gratuito. Si respondes la encuesta y nos dejas tu contacto, tendrás acceso prioritario.',
      },
      {
        q: '¿Cuánto costará?',
        a: 'Aún lo estamos definiendo. Precisamente es una de las cosas que preguntamos en la encuesta.',
      },
      {
        q: '¿Sustituye a mi gestoría?',
        a: 'No, la complementa. Tu gestoría sigue con lo suyo; Automatta te quita el trabajo de cobrar y de controlar la caja.',
      },
      {
        q: '¿Qué es Verifactu?',
        a: 'Es el sistema de facturación verificable de Hacienda. Será obligatorio para las sociedades a partir del 1 de enero de 2027. Automatta será compatible con Verifactu.',
      },
      {
        q: '¿Mis datos están seguros?',
        a: 'Las respuestas de la encuesta son confidenciales y solo las usamos para este estudio.',
      },
    ],
  },

  finalCta: {
    title: 'Nos ayudas con 5 minutos y te contamos lo que aprendamos.',
    cta: 'Ayúdanos con 5 minutos',
  },

  footer: {
    tagline: 'Cobros y tesorería automáticos para pymes.',
    made: 'Hecho en Barcelona',
    contact: 'Contacto',
    legal: 'Aviso legal',
    privacy: 'Privacidad',
  },

  notFound: {
    title: 'Esta página no existe.',
    text: 'Igual que una factura que nadie encuentra. Volvamos a terreno conocido.',
    cta: 'Volver al inicio',
  },

  common: {
    newTab: '(se abre en una pestaña nueva)',
    illustrationTag: 'Así funcionará',
  },
} as const;

export default es;
export type Content = typeof es;
