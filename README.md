# Automatta · web informativa

Web de una sola página para presentar Automatta y llevar a las pymes a la encuesta de 5 minutos.

- **Astro** + **Tailwind CSS** + **TypeScript** (web estática, sin backend)
- **GSAP** (ScrollTrigger, SplitText, DrawSVG) + **Lenis** para las animaciones y el scroll suave
- **OGL** (WebGL, ~25 KB) para el mundo 3D de documentos que acompaña todo el scroll
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

## El mundo 3D

Toda la página es un solo recorrido: un mundo 3D de documentos de papel (facturas,
recordatorios, Excels, extractos, tickets, el modelo 303) fijo detrás del contenido.
Al bajar, cuenta la historia en actos:

| Sección | Qué hacen los papeles |
| --- | --- |
| Hero | Nube de papeles sueltos (reaccionan al ratón) |
| El problema | Tormenta de papel que pasa a tu lado; en "cero visibilidad" entra niebla |
| Una misma causa | Todo se congela en el aire |
| Con Automatta | Cada hoja vuela a su sitio y pasa de rojo a verde, como un sello; luego se tumban bajo el panel |
| Cómo funciona | Una cinta de documentos cruza un escáner y sale en orden |
| Verifactu | Todo cae en una sola pila sellada; la página se hace de noche |
| Para quién | Dos pilas: pequeña y mediana |
| Hoja de ruta | Cuatro pilas que crecen, una por hito |
| La encuesta | Las demás caen y una hoja viene hasta ti y se convierte en la encuesta |

Archivos (`src/scripts/world/`):

- `constants.ts`: actos y tipos de documento.
- `atlas.ts`: dibuja las texturas de los documentos en un canvas (sin imágenes que descargar). Los textos están en `es.ts`, clave `world`.
- `layouts.ts`: dónde está cada hoja en cada acto y cómo se pasa de uno a otro.
- `scenes.ts`: ata el scroll a los actos y coreografía el texto de las escenas fijadas.
- `renderer.ts`: OGL, shaders del papel y bucle de dibujo. Se descarga después de pintar el hero.

Sin WebGL, con "Reducir movimiento" o con ahorro de datos, la web se ve sin 3D, con sus ilustraciones de siempre.

## Accesibilidad y movimiento

Con la preferencia del sistema **"Reducir movimiento"** activada, la web muestra todo el contenido sin animaciones y la sección del panel se ve como una secuencia estática. Todo el texto está en el HTML desde el principio; las animaciones solo lo revelan. Si el JavaScript fallara, a los 4 segundos se muestra todo igualmente.
