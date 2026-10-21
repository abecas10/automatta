# Automatta · web informativa

Web de una sola página para presentar Automatta y llevar a las pymes a la encuesta de 5 minutos.

- **Astro** + **Tailwind CSS** + **TypeScript** (web estática, sin backend)
- **GSAP** (ScrollTrigger, SplitText, DrawSVG) + **Lenis** para las animaciones y el scroll suave
- **OGL** (WebGL) para la experiencia 3D, que se descarga después de pintar el hero
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

## La experiencia 3D: la vida de F-2041

La página sigue a una factura concreta, **F-2041** (Taller Puig SL → Talleres Ejemplo SL, 4.000 €),
y cada capítulo es algo que le pasa. Los objetos 3D se explican con etiquetas ancladas a ellos
y el usuario puede interactuar:

| Capítulo | Qué pasa | Qué puede hacer el usuario |
| --- | --- | --- |
| Hero | F-2041 flota delante | Arrastrarla para girarla |
| Hoy 1/3 | Alguien teclea sus datos en un Excel, con errores | |
| Hoy 2/3 | Pasan los días, amarillea, un sello la marca VENCIDA y otras facturas la entierran | |
| Hoy 3/3 | Una previsión de caja que nadie sabe leer, en la niebla | |
| Una misma causa | Todo se congela y pierde el color | |
| Con Automatta | Se endereza, un escáner la lee y cada dato se etiqueta | |
| Cobros | Entra en un sobre, se envía; salen los recordatorios del día 3, 20 y 40 | |
| Tesorería | Llega la transferencia, se cuadra y se sella COBRADA; sube la caja a 90 días | Estampar el sello |
| Cierre | Se archiva sola en el libro mayor | |
| Impuestos | Su IVA salta a la casilla 01 del modelo 303 | |
| Proveedores | Llega una factura de proveedor, se lee y se aprueba | Aprobarla |
| Verifactu | De noche, queda encadenada a F-2039 y F-2040 | Intentar cambiar el importe (no se puede) |
| Para quién | Sola (pequeña) o entre 200 facturas al mes (mediana) | Elegir el tamaño |
| Hoja de ruta | Un camino con los cuatro hitos | |
| Encuesta | Se da la vuelta: su dorso es la encuesta | Hacer clic en la hoja |

Archivos (`src/scripts/world/`):

- `chapters.ts`: índices de los capítulos (compartidos por el HTML y el 3D).
- `script.ts`: **el guion**. Fotogramas clave de cada personaje y las etiquetas. Para retocar la historia, se toca aquí.
- `keys.ts`: motor de fotogramas clave (todo es función del scroll, así que se puede ir hacia atrás).
- `textures.ts` y `atlas.ts`: los documentos, dibujados en canvas. Los textos están en `es.ts` (claves `story` y `world`).
- `stage.ts`: OGL, shaders del papel, objetos (sello, sobre, libro, barras, cadena, camino) e interacción.
- `scenes.ts`: convierte el scroll en la posición de la historia y conecta los botones.

Truco para revisar encuadres: añade `#t=7.5` a la URL para congelar la historia en ese punto.

Sin WebGL, con "Reducir movimiento" o con ahorro de datos, cada capítulo se ve con su ilustración estática.

## Accesibilidad y movimiento

Con la preferencia del sistema **"Reducir movimiento"** activada, la web muestra todo el contenido sin animaciones y la sección del panel se ve como una secuencia estática. Todo el texto está en el HTML desde el principio; las animaciones solo lo revelan. Si el JavaScript fallara, a los 4 segundos se muestra todo igualmente.
