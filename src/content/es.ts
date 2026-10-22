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

  // La experiencia 3D: la vida de una factura concreta (F-2041). Datos de ejemplo.
  story: {
    hint: 'Vamos a seguir una factura de verdad, F-2041, de papel a tu móvil.',
    drag: 'Arrastra el móvil para girarlo',
    today: 'Hoy, sin Automatta',
    withAutomatta: 'Con Automatta',
    // Un titular y una frase por paso: es lo que se lee junto al objeto 3D.
    steps: {
      meet: { kicker: 'El problema', title: 'Esta es F-2041.', caption: 'Una factura de 4.000 € de un taller a su cliente. Vamos a seguirla.' },
      typing: { kicker: 'Hoy, sin Automatta · 1/3', title: 'Alguien la teclea a mano.', caption: 'Dato a dato, en el programa de contabilidad. Lo pagas a la gestoría o a tu equipo.' },
      overdue: { kicker: 'Hoy, sin Automatta · 2/3', title: 'Vence. Y nadie reclama.', caption: 'Vendes a 60 o 90 días y el dinero de lo vendido sigue fuera cuando llegan las nóminas.' },
      fog: { kicker: 'Hoy, sin Automatta · 3/3', title: 'Y no ves tu caja.', caption: 'Montas un Excel o esperas a que la gestoría te pase los números, a menudo un trimestre tarde.' },
      cause: { kicker: 'Una misma causa', title: 'Procesos manuales.', caption: 'Copiar datos de un sitio a otro y acordarse de fechas. Eso lo hace mejor un programa.' },
      automatta: { kicker: 'Con Automatta', title: 'Tu departamento financiero, en el bolsillo.', caption: 'Hace el trabajo repetitivo y te pasa solo lo que necesita criterio.' },
      read: { kicker: 'Facturas a clientes y proveedores', title: 'Cada factura se lee sola.', caption: 'Quién, cuánto, qué IVA y cuándo vence. Sin teclear nada.' },
      cobros: { kicker: 'Cuentas a cobrar · por aquí empezamos', title: 'Reclama por ti.', caption: 'Un recordatorio amable el día 3, uno firme el día 20 y, si hace falta, te avisa para que llames.' },
      tesoreria: { kicker: 'Bancos y caja', title: 'El cobro se cuadra solo.', caption: 'Llega la transferencia, se cuadra con F-2041 y ves tu caja de los próximos 90 días.' },
      cierre: { kicker: 'Contabilidad', title: 'Tus números, al día.', caption: 'Cada factura queda como apunte enlazado. Ventas, gastos y beneficio en vivo.' },
      impuestos: { kicker: 'Gastos e impuestos', title: 'El IVA se prepara solo.', caption: 'Como todas las facturas entran con su IVA, el borrador del modelo 303 está listo para revisar.' },
      proveedores: { kicker: 'Cuentas a pagar', title: 'Las que pagas, también.', caption: 'Se leen, se comprueban con el pedido y el albarán y las apruebas con un toque.' },
      verifactu: { kicker: 'Verifactu y por qué ahora', title: 'Verifactu llega el 1 de enero de 2027.', caption: 'Cada factura queda registrada y encadenada. Automatta será compatible.' },
      audience: { kicker: 'Para quién es', title: 'Para pymes de 1 a 70 empleados.', caption: 'Lo que cambia es quién hace hoy el trabajo. Empezamos por Cataluña.' },
      survey: { kicker: 'Lo estamos construyendo contigo', title: 'Ahora te toca a ti.', caption: 'Buscamos a nuestras primeras 5-10 empresas: usarán Automatta gratis durante 2 años.' },
    },
    labels: {
      typing: 'Alguien copia cada dato a mano',
      typo: '#N/A: un dato mal tecleado',
      day: 'Día',
      unpaid: 'sin cobrar',
      pile: 'Más facturas sin cobrar',
      fog: '¿Llegamos a las nóminas?',
      fields: ['Talleres Ejemplo SL', '4.000,00 €', '694,21 €', '14 oct'],
      supplierFields: ['Maderas Ejemplo SL', '1.210,00 €', '210,00 €'],
      stamp: 'Cobrada y cuadrada con el banco',
      tapPhone: 'Toca el móvil para abrir la encuesta',
    },
    actions: {
      stamp: 'Sella F-2041 como cobrada',
      stamped: 'Cobrada',
      approve: 'Aprobar la factura',
      approved: 'Aprobada',
      tamper: 'Intenta cambiar el importe',
      tamperNo: 'No se puede. Con Verifactu, una factura emitida queda registrada y no se puede alterar.',
      sizeLegend: '¿Cómo es tu empresa?',
      sizeSmall: 'Pequeña (1–29)',
      sizeMedium: 'Mediana (30–70)',
    },
    // Lo que se ve en la pantalla del móvil (datos de ejemplo).
    screen: {
      time: '9:41',
      date: 'lunes, 19 de octubre',
      app: 'Automatta',
      now: 'ahora',
      notifTitle: 'F-2041 cobrada',
      notifText: 'Talleres Ejemplo SL ha pagado 4.000,00 €. Ya está cuadrada con el banco.',
      newInvoice: 'Factura nueva',
      readFrom: 'Leída sola desde tu correo',
      fieldNames: ['Cliente', 'Total', 'IVA', 'Vence'],
      collections: 'Cobro de F-2041',
      overdue: 'Vencida',
      reminders: [
        ['Día 3', 'Recordatorio amable', 'Enviado'],
        ['Día 20', 'Firme, con la factura', 'Enviado'],
        ['Día 40', 'Llamar al cliente', 'Te avisamos'],
      ],
      bank: 'Banco · hoy',
      transfer: 'Transferencia recibida',
      matched: 'Cuadrada con F-2041',
      cash: 'Caja a 90 días',
      tight: 'Semana 8: caja ajustada',
      month: 'Este mes',
      kpis: [
        ['Ventas', 42000],
        ['Gastos', 31000],
        ['Beneficio', 11000],
      ],
      entry: 'Apunte enlazado a F-2041',
      taxTitle: 'Modelo 303',
      taxSub: 'IVA · primer trimestre',
      taxBoxes: [
        ['01', 'IVA de tus ventas', '8.400,00'],
        ['02', 'IVA de tus gastos', '5.200,00'],
        ['03', 'A ingresar', '3.200,00'],
      ],
      draft: 'Borrador listo para revisar',
      supplierTitle: 'Factura de proveedor',
      supplierChecks: ['Pedido', 'Albarán'],
      approve: 'Aprobar',
      approved: 'Aprobada',
      payday: 'Transferencia lista para el día de pago',
      verifactuTitle: 'Registro Verifactu',
      chain: ['F-2039', 'F-2040', 'F-2041'],
      locked: 'Registrada. No se puede modificar.',
      tamperNo: 'Una factura emitida no se puede alterar',
      smallTitle: 'Taller Puig SL',
      smallSub: '6 empleados',
      smallLine: 'Cada factura, sola',
      mediumTitle: 'Muebles García SL',
      mediumSub: '50 empleados',
      mediumLine: 'Unas 200 facturas al mes, solas',
      surveyTitle: 'Encuesta Automatta',
      surveyCta: 'Responder la encuesta',
    },
  },

  // Documentos del mundo 3D (texturas dibujadas en el navegador). Datos ficticios.
  world: {
    label:
      'Ilustración en 3D: decenas de documentos (facturas, recordatorios, extractos del banco, tickets e impuestos) que pasan del desorden al orden mientras bajas por la página.',
    invoiceA: { kind: 'Factura', number: 'F-2041', issuer: 'Taller Puig SL', client: 'Talleres Ejemplo SL', concept: 'Reparación de maquinaria', base: '3.305,79', vat: '694,21', total: '4.000,00 €', due: 'Venció el 14 oct' },
    invoiceB: { kind: 'Factura', number: 'F-2038', issuer: 'Taller Puig SL', client: 'Distribuciones Muestra SA', concept: 'Mantenimiento anual', base: '4.958,68', vat: '1.041,32', total: '6.000,00 €', due: 'Venció el 2 oct', note: '¿Le llamamos?' },
    reminder: { from: 'De: administración', to: 'Para: Talleres Ejemplo SL', subject: 'Recordatorio: factura vencida', manual: 'Enviado a mano, 23:47', auto: 'Enviado solo, día 3' },
    sheet: { file: 'facturas_FINAL_v7.xlsx', ledger: 'Libro mayor, octubre', cols: ['Factura', 'Importe', 'IVA', 'Cuenta'] },
    bank: { title: 'Extracto bancario', account: 'Cuenta ···· 4821', rows: [['Transf. Talleres Ejemplo', '+4.000,00'], ['Recibo de luz', '−212,40'], ['Transf. Distrib. Muestra', '+6.000,00'], ['Cuota software', '−49,00'], ['Transf. Ing. Ficticia', '+2.500,00']] },
    supplier: { kind: 'Factura de proveedor', issuer: 'Maderas Ejemplo SL', total: '1.210,00 €', fields: ['Proveedor', 'Importe', 'IVA', 'Vence'], note: '¿Quién la pasa?' },
    ticket: { shop: 'Gasolinera Ejemplo', lines: ['Gasóleo', 'IVA 21 %'], total: '60,00 €', registered: 'Gasto registrado' },
    tax: { title: 'Modelo 303', subtitle: 'IVA, primer trimestre', boxes: [['IVA de tus ventas', '8.400,00'], ['IVA de tus gastos', '5.200,00'], ['A ingresar', '3.200,00']], deadline: 'Plazo: 20 de abril' },
    stamps: { overdue: 'Vencida', paid: 'Cobrada', approved: 'Aprobada', matched: 'Conciliado', draft: 'Borrador listo' },
  },

  common: {
    newTab: '(se abre en una pestaña nueva)',
    illustrationTag: 'Así funcionará',
  },
} as const;

export default es;
export type Content = typeof es;
