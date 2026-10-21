# Automatta · web informativa

Web de una sola página para presentar Automatta y llevar a las pymes a la encuesta de 5 minutos.

- **Astro** + **Tailwind CSS** + **TypeScript** (web estática, sin backend)
- **GSAP** (ScrollTrigger, SplitText, DrawSVG) + **Lenis** para las animaciones y el scroll suave
- **three.js** para la experiencia 3D (materiales PBR, HDRI de estudio, sombras suaves y postproducción), que se descarga después de pintar el hero
- Una sola fuente autoalojada con `@fontsource` (Archivo Variable, con eje de anchura). Sin cookies ni analítica.

## Arrancarla en local

Necesitas [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:4321. Los cambios se ven al momento.

Otros comandos:

| Comando           | Qué hace                                                     |
| ----------------- | ------------------------------------------------------------ |
| `npm run build`   | Genera la web final en la carpeta `dist/`                    |
| `npm run preview` | Sirve la versión final en local para revisarla               |
| `npm run check`   | Revisa errores de TypeScript                                 |
| `npm run assets`  | Regenera `og.png`, `logo.png` y `apple-touch-icon.png`       |

> `npm run assets` usa Playwright. La primera vez, ejecuta `npx playwright install chromium`.

## Cambiar textos

**Todo el texto de la web está en un único archivo: [`src/content/es.ts`](src/content/es.ts).**
Ábrelo, cambia el texto que quieras entre comillas, guarda y listo. No toques los nombres que hay antes de los dos puntos (`title:`, `text:`…).

Para añadir catalán más adelante: copia `es.ts` como `ca.ts`, traduce los textos y mantén las mismas claves.

Otros datos están en [`src/config.ts`](src/config.ts):

- `SURVEY_URL`: el enlace de la encuesta. **Todos** los botones de la encuesta salen de aquí.
- `CONTACT_EMAIL`: el correo de contacto.
- `VERIFACTU_DATE`: la fecha de la cuenta atrás.

El **dominio** se cambia en un solo sitio: [`site.config.mjs`](site.config.mjs). De ahí salen el canonical, Open Graph, el sitemap, `robots.txt` y los datos estructurados.

Textos legales: `src/pages/aviso-legal.astro` y `src/pages/privacidad.astro`. Busca `[PENDIENTE` para ver qué falta.

### Fotos de los fundadores

1. Guarda las fotos en `src/assets/` (por ejemplo `alex-castella.jpg`, cuadradas, mínimo 400×400).
2. En `src/components/sections/Team.astro`, impórtalas y pásalas al avatar:

```astro
---
import fotoAC from '../../assets/alex-castella.jpg';
---
<Avatar ... photo={fotoAC} />
```

Astro las optimiza automáticamente.

## Publicarla gratis en Vercel (desde GitHub)

1. **Sube el proyecto a GitHub.** Crea un repositorio vacío en https://github.com/new (por ejemplo `automatta-web`) y, desde esta carpeta:
   ```bash
   git add .
   git commit -m "Primera versión de la web"
   git remote add origin https://github.com/TU_USUARIO/automatta-web.git
   git push -u origin main
   ```
2. **Entra en https://vercel.com** y regístrate con tu cuenta de GitHub (plan Hobby, gratuito).
3. Pulsa **Add New… → Project** y elige el repositorio `automatta-web`.
4. Vercel detecta Astro solo. Deja todo como está (Build command `npm run build`, Output `dist`) y pulsa **Deploy**.
5. En un minuto tendrás la web en una dirección tipo `automatta-web.vercel.app`.
6. A partir de ahí, **cada `git push` a `main` publica la web automáticamente.**

### Dominio propio

En Vercel: **Project → Settings → Domains → Add** y sigue las instrucciones para apuntar el DNS. Después cambia `SITE_URL` en `site.config.mjs`, haz commit y push.

### Analítica sin cookies (opcional)

En Vercel: **Project → Analytics → Enable**. Luego `npm install @vercel/analytics` y añade el componente donde indica el comentario en `src/layouts/Base.astro`. No usa cookies, así que no hace falta banner.

### Alternativas

- **Netlify:** importa el repo desde https://app.netlify.com. Ya hay un `netlify.toml` preparado.
- **Cloudflare Pages:** Workers & Pages → Create → Pages → conecta el repo. Framework preset *Astro*, build `npm run build`, salida `dist`.

## Estructura

```
src/
  config.ts                 URL de la encuesta, email, fechas, dominio
  content/es.ts             Todos los textos
  layouts/                  Base (SEO, fuentes, scripts) y Legal
  components/
    Navbar, Logo, Button, Avatar
    illustrations/HeroDesk  Escritorio animado del hero (factura, banco, caja)
    SectionHead, Stamp      Cabecera de sección y sello de caucho
    sections/               Una sección de la landing por archivo
  scripts/
    motion.ts               Punto de entrada: Lenis + GSAP + movimiento reducido
    world/                  Mundo 3D (ver abajo)
    ui.ts                   Menú, acordeón y cuenta atrás (funcionan siempre)
    reveal.ts               Revelados al hacer scroll y microinteracciones
    sections/               Animación de cada sección
  pages/                    index, aviso-legal, privacidad, 404
public/                     favicon, og.png, logo
site.config.mjs             Dominio público (único sitio donde cambiarlo)
vercel.json                 URLs limpias (/privacidad en vez de /privacidad.html)
scripts/generate-assets.mjs Genera la imagen para redes y los iconos
```

## La experiencia 3D: de papel a tu móvil

La portada se recorre como una sola historia con dos protagonistas: **F-2041**, una factura de papel
(cómo se trabaja hoy), y **un móvil** (Automatta). Cada paso ocupa la pantalla con el titular arriba,
el objeto en medio y una frase abajo: el objeto hace exactamente lo que dice el texto.

| Paso | Qué se ve |
| --- | --- |
| Hero | El móvil con la notificación "F-2041 cobrada" (se puede girar) |
| Esta es F-2041 | La factura cae sobre una mesa de roble |
| La teclea a mano | Un Excel se rellena letra a letra, con un #N/A |
| Vence | Del día 1 al 90, amarillea, un sello la marca VENCIDA y crece la pila de facturas sin cobrar |
| No ves tu caja | Niebla y columnas de caja que nadie sabe leer |
| Procesos manuales | Todo se congela en blanco y negro |
| Con Automatta | El móvil se levanta y se enciende |
| Se lee sola | Los datos vuelan del papel a la pantalla |
| Cobros | Recordatorios del día 3, 20 y 40 en la pantalla |
| Tesorería | Llega la transferencia y el sello marca COBRADA (o lo pulsas tú) |
| Cierre | El papel entra en el móvil; ventas, gastos y beneficio en vivo |
| Impuestos | El modelo 303 se rellena solo |
| Proveedores | Una factura de proveedor se lee y la apruebas |
| Verifactu | De noche: facturas encadenadas y cuenta atrás; "intenta cambiar el importe" |
| Para quién | Pequeña o mediana: una factura o unas 200 al mes |
| Encuesta | La pantalla es la encuesta: tocar el móvil la abre |

Archivos (`src/scripts/world/`):

- `chapters.ts`: índices de los pasos (compartidos por el HTML y el 3D).
- `script.ts`: **el guion**: encuadres de cámara, movimientos, etiquetas y qué muestra la pantalla en cada momento.
- `screen.ts`: la interfaz del móvil, dibujada en canvas (textos en `es.ts`, clave `story.screen`).
- `stage.ts`: three.js. Móvil modelado a medida, papel con fibra y abarquillado, pila de facturas, sello, mesa de roble, luz de estudio, sombras, muelles y postproducción.
- `keys.ts`: motor de fotogramas clave. `scenes.ts`: scroll → historia y botones. `textures.ts`: la factura y el Excel.

Truco para revisar encuadres: añade `#t=9.5` a la URL para congelar la historia en ese punto.

Sin WebGL, con "Reducir movimiento" o con ahorro de datos, cada paso se ve con su texto completo y su ilustración estática.

### Recursos 3D (CC0, de [Poly Haven](https://polyhaven.com))

En `public/3d/`, optimizados con `gltf-transform` (texturas WebP, geometría meshopt):
suculenta (`potted_plant_04`), madera de roble (`oak_veneer_01`), piel (`fabric_leather_02`) y el HDRI de estudio
`studio_small_09` (reducido con `scripts/shrink-hdr.py`). Licencia CC0: uso libre, sin atribución obligatoria.
Los originales se descargan en `assets-src/` (no se suben al repositorio).
- `scenes.ts`: convierte el scroll en la posición de la historia y conecta los botones.

Truco para revisar encuadres: añade `#t=7.5` a la URL para congelar la historia en ese punto.

Sin WebGL, con "Reducir movimiento" o con ahorro de datos, cada capítulo se ve con su ilustración estática.

## Accesibilidad y movimiento

Con la preferencia del sistema **"Reducir movimiento"** activada, la web muestra todo el contenido sin animaciones y la sección del panel se ve como una secuencia estática. Todo el texto está en el HTML desde el principio; las animaciones solo lo revelan. Si el JavaScript fallara, a los 4 segundos se muestra todo igualmente.
