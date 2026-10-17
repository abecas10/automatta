// Todo el texto de la web en español.
// Para añadir catalán: copia este archivo a `ca.ts`, traduce los valores
// y mantén exactamente las mismas claves.

const es = {
  meta: {
    title: 'Automatta · Tu departamento financiero, en piloto automático',
    description:
      'Automatta pone en piloto automático la administración de pymes de 1 a 70 empleados: facturas, cobros, banco e impuestos. Ayúdanos a construirlo con una encuesta de 5 minutos.',
    ogAlt: 'Automatta: tu departamento financiero, en piloto automático.',
    orgDescription:
      'Startup de Barcelona que automatiza la administración financiera de las pymes: facturas de proveedores y clientes, cobros, tesorería, cierre contable e impuestos.',
  },

  nav: {
    links: [
      { href: '#problema', label: 'El problema' },
      { href: '#como-funciona', label: 'Cómo funciona' },
      { href: '#para-quien', label: 'Para quién' },
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
    // Cada línea se muestra en su propia fila; la última va en verde.
    titleLines: ['Tu departamento financiero,', 'en piloto automático.'],
    subtitle:
      'Automatta registra tus facturas, reclama a quien no paga, cuadra el banco y te prepara los impuestos. Dejas de pagar por trabajo de robot y sabes cómo va tu negocio hoy.',
    primary: 'Ayúdanos con 5 minutos',
    secondary: 'Ver cómo funciona',
    note: 'Encuesta de 5 minutos · respuestas confidenciales',
    illustrationLabel:
      'Ilustración: tus facturas se registran solas, los cobros entran en el banco y se dibuja la previsión de caja a 90 días.',
    company: 'Taller Puig SL',
    forecastTitle: 'Previsión de caja',
    forecastRange: 'próximos 90 días',
    forecastLabels: ['Hoy', '30 días', '60 días', '90 días'],
  },

  problem: {
    eyebrow: 'El problema',
    title: 'Así se vive hoy en muchas pymes.',
    intro: 'Tres problemas que se repiten en casi todas las empresas, sean pequeñas o medianas.',
    cards: [
      {
        title: 'Pagar a personas por teclear datos',
        text: 'Las facturas llegan en PDF y alguien las copia una a una en el programa de contabilidad. En una empresa pequeña lo hace una gestoría a la que pagas cada mes; en una mediana, un equipo que se pasa horas tecleando.',
      },
      {
        title: 'Los cobros tardíos ahogan la caja',
        text: 'Vendes a 60 o 90 días y las facturas vencidas se reclaman cuando alguien se acuerda. El dinero de lo que ya has vendido está fuera de tu empresa justo cuando lo necesitas para nóminas y proveedores.',
      },
      {
        title: 'Cero visibilidad en tiempo real',
        text: '“¿Llegaremos a las nóminas de este mes?” En una mediana hay que montar un Excel; en una pequeña dependes de que la gestoría te pase los números, a menudo un trimestre tarde.',
      },
    ],
    conclusion: 'Tres problemas, una misma causa: procesos manuales.',
    conclusionText:
      'La mayor parte de ese trabajo es copiar datos de un sitio a otro y acordarse de fechas. Eso lo hace mejor un programa.',
    conclusionLink: 'Mira cómo se ordena',
    inbox: {
      title: 'Bandeja de entrada',
      unread: 'correos sin leer',
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
      title: 'facturas_proveedores_FINAL_v7.xlsx',
      columns: ['Factura', 'Importe', 'IVA', 'Cuenta'],
    },
    fog: {
      title: 'Caja',
      question: '¿Llegamos a las nóminas?',
    },
  },

  transformation: {
    eyebrow: 'Con Automatta',
    title: 'Del caos a saber dónde estás.',
    steps: [
      'Los cobros se reclaman solos.',
      'Los datos se registran y se cuadran solos.',
      'Y ves tus números en tiempo real.',
    ],
    tag: 'Así funcionará · datos de ejemplo',
    tagShort: 'Datos de ejemplo',
    dashboard: {
      title: 'Panel de Automatta',
      kpis: [
        { label: 'Pendiente de cobro', value: '9.000 €' },
        { label: 'Cobrado esta semana', value: '6.500 €' },
        { label: 'Caja en 90 días', value: '35.000 €' },
      ],
      listTitle: 'Facturas de esta semana',
      rows: [
        { client: 'Talleres Ejemplo SL', amount: '4.000 €', status: 'Cobrada' },
        { client: 'Distribuciones Muestra SA', amount: '6.000 €', status: 'Recordatorio enviado' },
        { client: 'Ingeniería Ficticia SL', amount: '2.500 €', status: 'Conciliada' },
        { client: 'Logística Demo SL', amount: '3.000 €', status: 'Llamar hoy' },
      ],
      chartTitle: 'Previsión de caja · 90 días',
      chartLabels: ['Hoy', '30 d', '60 d', '90 d'],
    },
    reducedNote: 'Antes: PDFs, emails, Excel y sorpresas. Después: un panel con todo en orden.',
  },

  how: {
    eyebrow: 'Cómo funciona',
    title: 'Cinco módulos, un solo sistema.',
    intro:
      'Automatta hace el trabajo repetitivo y te pasa solo las excepciones. Lo que necesita criterio (decidir, negociar, los casos raros) lo sigue haciendo una persona.',
    tag: 'Así funcionará · datos de ejemplo',
    startHere: 'Por aquí empezamos',
    excluded: 'Las nóminas y los contratos laborales no están incluidos por ahora.',
    pieces: [
      {
        id: 'proveedores',
        number: '01',
        kicker: 'Cuentas a pagar',
        title: 'Facturas de proveedores',
        text: 'Las facturas llegan a un buzón y se leen solas: proveedor, importe, IVA y vencimiento. Se comprueban contra el pedido y el albarán, el responsable las aprueba desde el móvil con un clic y, el día de pago, se preparan todas las transferencias de golpe.',
        points: ['Cada factura se lee sola', 'Comprobada con pedido y albarán', 'Aprobación con un clic desde el móvil'],
        start: false,
      },
      {
        id: 'cobros',
        number: '02',
        kicker: 'Cuentas a cobrar',
        title: 'Facturas a clientes y cobros',
        text: 'La factura se crea y se envía sola, con el formato que pide Verifactu. Si el cliente no paga, Automatta le reclama de forma escalonada: un recordatorio amable, después uno firme con la factura adjunta y, si sigue sin pagar, te avisa para que le llames. Cuando el dinero llega al banco, marca la factura como cobrada.',
        points: ['Facturas creadas y enviadas solas', 'Reclamación escalonada', 'Cobrada en cuanto llega el dinero'],
        start: true,
      },
      {
        id: 'tesoreria',
        number: '03',
        kicker: 'Bancos y caja',
        title: 'Tesorería',
        text: 'Se conecta a todos tus bancos de forma segura (open banking, la normativa europea PSD2, siempre con tu permiso), clasifica los movimientos y cuadra cada cobro con su factura. Dibuja tu previsión de caja a 90 días y te avisa con semanas de antelación si la curva baja demasiado.',
        points: ['Todos tus bancos en un sitio', 'Cada cobro cuadrado con su factura', 'Previsión de caja a 90 días'],
        start: false,
      },
      {
        id: 'cierre',
        number: '04',
        kicker: 'Contabilidad',
        title: 'Cierre del mes y números en vivo',
        text: 'Los apuntes que se repiten cada mes se generan solos y, en vez del Excel, tienes un panel siempre al día con ventas, gastos y beneficio. Cada apunte queda enlazado a su factura.',
        points: ['Apuntes recurrentes automáticos', 'Ventas, gastos y beneficio al día', 'Cada apunte enlazado a su factura'],
        start: false,
      },
      {
        id: 'impuestos',
        number: '05',
        kicker: 'Tickets e IVA',
        title: 'Gastos e impuestos',
        text: 'Haces una foto al ticket con el móvil y se registra solo. Como todas las facturas ya han entrado con su IVA, los borradores de los impuestos trimestrales (como el modelo 303 del IVA) se preparan solos: solo hay que revisar y presentar.',
        points: ['Foto al ticket y listo', 'Borradores de impuestos trimestrales', 'Tú revisas y presentas'],
        start: false,
      },
    ],
    demoPayables: {
      inbox: 'facturas@tuempresa.es',
      file: 'factura_proveedor.pdf',
      fields: [
        { label: 'Proveedor', value: 'Maderas Ejemplo SL' },
        { label: 'Importe', value: '1.210 €' },
        { label: 'IVA', value: '21 % · 210 €' },
        { label: 'Vence', value: 'en 30 días' },
      ],
      checks: ['Pedido', 'Albarán'],
      approve: 'Aprobar',
      approved: 'Aprobada',
      transfer: 'Transferencia lista para el día de pago',
    },
    demoCobros: {
      invoice: 'Factura F-2041',
      client: 'Talleres Ejemplo SL',
      amount: '4.000 €',
      // Estado de la factura en cada momento
      states: ['Vencida', 'Recordatorio amable', 'Recordatorio firme', 'Cobrada'],
      // Escalada
      steps: [
        { day: 'Día 3', label: 'Recordatorio amable' },
        { day: 'Día 20', label: 'Firme + factura' },
        { day: 'Día 40', label: 'Te avisamos para llamar' },
      ],
      mail: 'Recordatorio para Talleres Ejemplo SL',
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
      title: 'Caja prevista · 90 días',
      labels: ['Hoy', '30 días', '60 días', '90 días'],
      alert: 'Dentro de 7 semanas: caja ajustada',
    },
    demoClose: {
      title: 'Este mes · en vivo',
      kpis: [
        { label: 'Ventas', value: '42.000 €' },
        { label: 'Gastos', value: '31.000 €' },
        { label: 'Beneficio', value: '11.000 €' },
      ],
      recurringTitle: 'Apuntes del mes',
      recurring: ['Alquiler del local', 'Seguro', 'Software de diseño'],
      linked: 'Enlazado a su factura',
      months: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
    },
    demoTaxes: {
      ticket: 'Ticket · Gasolinera',
      ticketAmount: '60 €',
      registered: 'Gasto registrado',
      formTitle: 'Modelo 303 · 1.er trimestre',
      draft: 'Borrador listo',
      rows: [
        { label: 'IVA de tus ventas', value: '8.400 €' },
        { label: 'IVA de tus gastos', value: '5.200 €' },
        { label: 'A ingresar', value: '3.200 €' },
      ],
      cta: 'Revisar y presentar',
    },
  },

  verifactu: {
    eyebrow: 'Verifactu y por qué ahora',
    title: 'Verifactu llega el 1 de enero de 2027.',
    text: 'Verifactu es el sistema de facturación verificable de Hacienda: cada factura queda registrada y no se puede alterar. Será obligatorio para las sociedades a partir del 1 de enero de 2027, y Automatta será compatible.',
    why: 'La administración es el último rincón de las pymes sin automatizar, y la ley obliga a todas a cambiar su forma de facturar: primero Verifactu y, en los próximos años, la factura electrónica obligatoria entre empresas.',
    quote: 'Si tienes que cambiar igualmente, cambia a algo que lo haga todo.',
    countdownLabel: 'Tiempo hasta el 1 de enero de 2027',
    units: { days: 'días', hours: 'horas', minutes: 'minutos', seconds: 'segundos' },
    arrived: 'Verifactu ya es obligatorio para las sociedades.',
    badge: 'Automatta será compatible con Verifactu.',
  },

  audience: {
    eyebrow: 'Para quién es',
    title: 'Para pymes de 1 a 70 empleados.',
    text: 'Lo que cambia es quién hace hoy el trabajo. Empezamos por Cataluña.',
    exampleTag: 'Ejemplo',
    segments: [
      {
        range: '1–29 empleados',
        name: 'Empresas pequeñas',
        headline: 'Deja de pagar a la gestoría por teclear tus facturas.',
        text: 'Hoy pagas a una gestoría y no sabes cómo va tu negocio hasta que te pasa los números. Automatta se encarga de la contabilidad, la facturación compatible con Verifactu y los impuestos trimestrales y anuales, y tú ves tus números en tiempo real.',
        example: {
          name: 'Taller Puig SL · 6 empleados',
          text: 'Paga una gestoría cada mes y se entera de cómo van sus números semanas después.',
        },
      },
      {
        range: '30–70 empleados',
        name: 'Empresas medianas',
        headline: 'Tu equipo deja de hacer trabajo de robot.',
        text: 'Tu equipo de administración se pasa horas copiando datos. Automatta les quita el trabajo repetitivo para que se dediquen a lo que necesita criterio, y la empresa puede crecer sin tener que contratar más gente para administración.',
        example: {
          name: 'Muebles García SL · 50 empleados',
          text: 'Marta y Jorge pasan cada mes horas tecleando unas 200 facturas.',
        },
      },
    ],
    sectorsTitle: 'Sectores',
    sectors: [
      'Industria',
      'Comercio',
      'Distribución',
      'Hostelería',
      'Talleres',
      'Clínicas',
      'Despachos profesionales',
      'Construcción',
      'Logística',
      'Tecnología',
    ],
  },

  roadmap: {
    eyebrow: 'Hoja de ruta',
    title: 'Paso a paso, y con las empresas.',
    here: 'Estamos aquí',
    items: [
      {
        when: '2026',
        title: 'Escuchar y validar',
        text: 'Encuesta y entrevistas con dueños de pymes. Constitución de la empresa.',
        current: true,
      },
      {
        when: '2026–2027',
        title: 'Construir',
        text: 'Primera versión con facturación Verifactu y cobros automáticos, junto a las primeras empresas.',
        current: false,
      },
      {
        when: '2027',
        title: 'Lanzar en Cataluña',
        text: 'De la mano de asociaciones de pymes. Y sumar contabilidad, impuestos y tesorería.',
        current: false,
      },
      {
        when: 'Después',
        title: 'Toda España',
        text: 'Nóminas y empresas más grandes.',
        current: false,
      },
    ],
  },

  survey: {
    eyebrow: 'La encuesta',
    title: 'Lo estamos construyendo contigo.',
    text: 'Antes de lanzar nada, queremos escuchar a empresas como la tuya. Cuéntanos cómo llevas hoy facturas, cobros e impuestos, y qué te quita tiempo.',
    program: {
      title: 'Buscamos a nuestras primeras 5-10 empresas: usarán Automatta gratis durante 2 años.',
      text: 'A cambio, nos ayudan a darle forma: una sesión de feedback al mes y, si les va bien, contarlo como caso de éxito.',
    },
    bullets: [
      { title: '5 minutos', text: 'Preguntas cortas, sin rodeos.' },
      { title: 'Confidencial', text: 'Tus respuestas solo se usan para este estudio.' },
      { title: 'Te llevas el informe', text: 'Si nos dejas tu contacto, te enviamos los resultados.' },
      { title: 'Prioridad', text: 'Para ser una de las primeras empresas, gratis durante 2 años.' },
    ],
    cta: 'Responder la encuesta',
    altPrefix: '¿Prefieres contárnoslo en 15 minutos?',
    altLink: 'Escríbenos',
  },

  team: {
    eyebrow: 'Quiénes somos',
    title: 'Dos personas de Barcelona con una idea clara.',
    text: 'Queremos llegar a las pymes a través de quien ya tiene su confianza y quitarles de encima el papeleo, lo haga hoy una gestoría o su propio equipo. Para que se dediquen a su negocio.',
    founders: [
      { name: 'Alex Llagostera', role: 'Fundador y Co-CEO', initials: 'AL' },
      { name: 'Alex Castella', role: 'Cofundador y Co-CEO', initials: 'AC' },
    ],
    place: 'Barcelona',
  },

  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que nos suelen preguntar.',
    items: [
      {
        q: '¿Ya puedo usar Automatta?',
        a: 'Todavía no. Estamos escuchando a empresas y construyendo la primera versión. Las primeras 5-10 empresas la usarán gratis durante 2 años. Si respondes la encuesta y nos dejas tu contacto, tendrás prioridad.',
      },
      {
        q: '¿Cuánto costará?',
        a: 'Lo estamos definiendo, y precisamente lo preguntamos en la encuesta. La idea es una cuota mensual según el tamaño de tu empresa, por menos de lo que hoy te cuesta la gestoría o el trabajo manual.',
      },
      {
        q: '¿Sustituye a mi gestoría?',
        a: 'Si tu empresa es pequeña, la idea es que sí en la parte contable y fiscal: facturación, contabilidad e impuestos. Las nóminas y los contratos laborales no están incluidos por ahora, así que para eso seguirías necesitando a alguien.',
      },
      {
        q: 'Tengo un equipo de administración, ¿lo sustituye?',
        a: 'No. Les quita el trabajo repetitivo (teclear facturas, cuadrar el banco, perseguir cobros) para que se centren en lo que necesita criterio.',
      },
      {
        q: '¿Qué es Verifactu?',
        a: 'Es el sistema de facturación verificable de Hacienda: cada factura queda registrada y no se puede alterar. Será obligatorio para las sociedades a partir del 1 de enero de 2027. Automatta será compatible con Verifactu.',
      },
      {
        q: '¿Es seguro conectar mis bancos?',
        a: 'Nos conectaremos mediante open banking, la normativa europea (PSD2) que permite a software autorizado leer tus movimientos, siempre con tu permiso.',
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
    tagline: 'Tu departamento financiero, en piloto automático.',
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
