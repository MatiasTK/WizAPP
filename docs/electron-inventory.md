# Inventario Electron para la migración a Tauri 2

Relevamiento de solo lectura hecho el 2026-10-10 sobre `main` (commit `8d21105`). Todavía no hay código de migración.

Tauri no tiene runtime Node: `src/main`, `src/preload` y `src/lib/wikari` (~2.150 líneas de TypeScript) hay que reescribirlos en Rust o reemplazarlos por plugins. El renderer React se conserva casi intacto.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Backend de red | Reescritura en Rust, sin sidecar Node |
| Usuarios Electron ya instalados | Sin continuidad de auto-update; descargan la versión nueva a mano. Sí se importa su `config.json` |
| Plataformas de la primera versión | Solo Windows |
| Alcance | Port 1:1 del comportamiento visible; solo se corrige lo que no tiene sentido portar (candado global del socket, carreras de descubrimiento) |

## Proceso main y preload (~1.065 líneas)

### Ventana y ciclo de vida

- Marco nativo, sin barra de título custom ni transparencia. 900x600 como tamaño inicial y mínimo, fondo `#1e1e1e`, sin menú.
- Arranca oculta (`show: false`) y se muestra cuando el renderer manda `show-window`, después de `document.fonts.ready` y un `requestAnimationFrame`.
- Minimizar oculta la ventana al tray. Cerrar no la oculta: cierra la conexión y la app sale.
- Bloqueo de instancia única; la segunda instancia enfoca la primera.
- Los enlaces `target="_blank"` se abren en el navegador del sistema.
- Tray con tres entradas (mostrar, alternar bombilla, salir); las etiquetas se traducen una sola vez al crearlo.
- El camino `activate` de macOS está roto por construcción (la ventana recreada queda sin manager, tray ni handlers).

### Superficie IPC

- 18 canales fire-and-forget (`send`): ninguno devuelve éxito o error.
- 4 consultas (`invoke`): `get-bulbs`, `check-for-updates`, `get-language`, `get-version`.
- 2 pushes de main al renderer: `on-update-bulb` (`MultiBulbState` completo) y `on-show-toast` (`ToastMessage` con una clave i18n).
- El contrato está en `src/preload/electronAPI.ts` (24 miembros). `window.electron` se expone pero nadie lo usa.
- Los listeners no devuelven función de baja.

### BulbManager (`src/main/bulbManager.ts`, 581 líneas)

- Una clase, unos 20 métodos cortos, sin timers ni polling. El único `setTimeout` es la espera entre reintentos.
- El estado se actualiza de forma optimista después de cada comando; los cambios hechos desde la app de WiZ no se reflejan hasta redescubrir.
- `@needsViewUpdate`: ejecuta el método, emite el estado y, ante cualquier error, reconecta la bombilla **activa** (aunque el fallo haya sido en otra) y traga el error sin toast.
- Descubrimiento en dos fases: unicast secuencial a las IPs guardadas (3 intentos, 5 s entre ellos, 5 s de espera por IP) y broadcast solo si ninguna respondió. El fallo total emite un toast fijo con acción `retry-discovery`.
- Sin guardas de concurrencia: `retryDiscovery`, `deleteProfile`, `addBulbByIp` y `reconnectBulb` pueden pisar un descubrimiento en curso. Hoy lo esconde el hilo único de Node.
- `saveConfig` reconstruye la lista desde las bombillas conectadas: una bombilla offline tras un éxito parcial o una reconexión fallida se borra del `config.json`.
- Las listas globales de colores y favoritos se duplican dentro de cada `BulbState`.

### Persistencia

- `<userData>/config.json`, calculado al importar el módulo, antes de `app.setName`. En esta máquina es `%APPDATA%\Wiz App\`.
- Lectura y escritura síncronas, escritura no atómica y sin `try/catch`, en casi cada mutación.
- Validación mínima (tres arrays), sin campo de versión. Un config inválido se reemplaza en silencio.
- Tauri deriva el directorio de datos del `identifier`, así que el config actual no se encuentra sin una importación explícita.

### Logger, updater, idioma

- `electron-log` v5 a `wiz-app.log`. Las excepciones no capturadas solo se loguean.
- `electron-updater` con proveedor GitHub: `checkForUpdatesAndNotify()` al arrancar; todos los eventos son solo log. La comprobación manual desde la ayuda agrega dos listeners en cada llamada.
- Idioma: `app.getLocale()` recortado a `en`/`es`, fallback `en`, sin preferencia de usuario. Main solo usa i18n para las tres etiquetas del tray.

### Equivalentes en Tauri

| Hoy | En Tauri |
|---|---|
| Ventana, tray, menú, IPC | Core de Tauri (ventana, tray, comandos, eventos) |
| Instancia única | `tauri-plugin-single-instance` |
| `shell.openExternal` / `openPath` | `tauri-plugin-opener` |
| `electron-log` | `tauri-plugin-log` |
| `electron-updater` | `tauri-plugin-updater` (manifiesto y firma nuevos) |
| `fs`, `path`, `crypto.randomUUID` | `std::fs` + `serde_json`, API de rutas, crate `uuid` |
| `dgram`, `os.networkInterfaces` | Reescritura en Rust; no hay plugin |
| `@electron-toolkit/*`, i18n en main | Ya no hacen falta |

## Capa de red UDP (`src/lib/wikari`, ~1.090 líneas)

### Protocolo

- Un objeto JSON UTF-8 por datagrama, sin id de petición. Destino: UDP 38899.
- Superficie realmente usada por la app: `discover` (unicast y broadcast de `getPilot`), `getPilot`, `setPilot` (state, dimming, sceneId, r/g/b) y `getSystemConfig` vía `sendRaw`.
- `toggle` hace dos idas y vueltas (`getPilot` y luego `setPilot`).
- La suscripción (`registration` / `syncPilot`) existe pero la app no la usa. El bind fijo a 38900 solo existe por ella y es prescindible.
- Timeouts: 2000 ms por respuesta; descubrimiento 5000 ms (lo fija la app).

### Sockets

- `Bulb.client` es un socket estático compartido, enlazado a `0.0.0.0:38900`. Si el puerto está ocupado, la librería queda bloqueada para siempre.
- Candado global de una petición en vuelo para todas las bombillas, sin cola.
- Las respuestas se emparejan por IP de origen y `method`.
- `closeConnection()` cierra el socket para todas las bombillas y nada lo recrea; por eso solo se llama al salir.
- Sin reintentos en la librería; los reintentos viven en `BulbManager`.

### Bugs a no portar

- Un timeout rechaza pero no libera el candado: después de una petición vencida, todas las siguientes fallan hasta reiniciar, incluido el camino de reconexión.
- Un error de parseo o de envío deja listeners colgados.
- `scene` y `brightness` devuelven el error de rango en vez de lanzarlo, y el manager lo toma como éxito.

### Descubrimiento

- Cada llamada crea un socket efímero propio con `setBroadcast(true)`.
- Broadcast dirigido por cada interfaz IPv4 no interna (`ip | ~netmask`), con fallback a `255.255.255.255`. Incluye adaptadores virtuales (Hyper-V, WSL, VPN).
- Espera siempre el `waitMs` completo, también en unicast. Deduplica por IP.

### Emulador (`scripts/wiz_emulator.py`)

- Tres bombillas en `127.0.0.1`, `.2` y `.3`, puerto 38899. Responde al puerto de origen, así que funciona con un cliente en cualquier puerto.
- Sirve sin cambios para probar un cliente Rust: unicast, `getPilot`, `setPilot`, `getSystemConfig` y respuestas de error.
- No cubre broadcast, pushes, timeouts, pérdida de paquetes ni color/temperatura.

### Otros

- La librería es **GPL-3.0-only**; relevante si el cliente Rust resulta una traducción derivada.
- Único cambio de comportamiento respecto de upstream: el descubrimiento por interfaz agregado en `8d21105`.

## Renderer

### Acoplamiento a Electron

- 25 llamadas a `window.api` en 6 archivos: 19 en `src/renderer/src/context/BulbStore.tsx` y 6 sueltas en `main.tsx`, `pages/Home.tsx` y los modales `AddDeviceModal`, `EditNameModal` y `HelpModal`.
- Único paquete Electron importado: `electron-log/renderer` en `BulbStore.tsx`.
- `getLanguage` condiciona el montaje de React: si falla, la app no renderiza.
- Las dos suscripciones a pushes se registran a nivel de módulo y nunca se dan de baja.
- Sin Node, sin lectura de disco, sin `file://`. Traducciones empaquetadas por import estático. Hash router compatible con Tauri.
- `HelpModal.tsx` tiene "3.0.0 (Windows)" escrito a mano; `getVersion` no se usa.

### Supuestos de motor web

- Riesgo bajo. No hay `backdrop-filter`, container queries, `:has`, view transitions, canvas ni EyeDropper.
- Tailwind v4 compila a `color-mix`, `@property` y `oklch`, que exigen motores recientes (irrelevante en WebView2, importante en WKWebView y WebKitGTK).
- Widgets nativos a probar fuera de Chromium: `<input type="color">` (abierto con `.click()` programático) y `<select>`.
- Scrollbar y slider usan pseudo-elementos `-webkit-*`.
- Animaciones solo CSS; drag and drop con `@dnd-kit` (pointer events). Fuente Inter empaquetada.

### Seguridad

- CSP comentado en `src/renderer/index.html`.
- `index.html` carga `<script src="http://localhost:8097">` (react-devtools) también en el build de producción.

## Build y release

### Dependencias

- **A quitar:** `electron`, `electron-builder`, `electron-vite`, `electron-updater`, `electron-log`, `@electron-toolkit/*`, `react-devtools`, el `postinstall` y los mirrors de `.npmrc`.
- **Se conservan:** React 19, react-router 7, zustand, i18next, react-icons, `@dnd-kit/*`, Inter, Tailwind v4, Vite 7 y sus tres plugins, TypeScript, eslint, prettier.
- **A reemplazar:** los presets de tsconfig y eslint de electron-toolkit.

### Configuración de build

- `electron.vite.config.mts` define tres targets (main, preload, renderer). Un Vite plano debe conservar `root: src/renderer`, los plugins `react`, `tsConfigPaths` y `tailwindcss`, y los alias de `tsconfig.web.json`.
- `@/types/*` significa cosas distintas en main y en renderer.

### Empaquetado

- `appId: com.wiz.app`, `productName: WiZ APP`. NSIS en Windows, dmg en macOS, AppImage/snap/deb en Linux. Sin firma de código.
- Tres identidades en uso: `com.wiz.app` (appId), `com.wiz-app` (AppUserModelId) y `Wiz App` / `WiZ APP` (carpeta de datos).
- El instalador NSIS de Tauri usa otra clave de desinstalación: se instala al lado de la versión Electron, no la reemplaza.
- Íconos de 256 px como máximo; `tauri icon` pide una fuente de 1024 px o más.
- Tauri no genera snap.

### Auto-update

- Hoy: `latest.yml` con sha512 y blockmaps en GitHub releases, sin firma.
- Tauri: `latest.json` con firma minisign obligatoria (clave pública en `tauri.conf.json`, privada como secreto de CI).
- El updater de Electron no entiende el formato de Tauri.

### CI (`.github/workflows/release.yml`)

- Un job en Ubuntu, macOS y Windows; pnpm 10, Node 20; solo `GITHUB_TOKEN`; release en draft.
- Para Tauri: toolchain Rust y caché de cargo, `tauri-apps/tauri-action`, secretos de firma, `permissions: contents: write`.

### `wizapp-tauri/`

- No trackeado y sin fuente: solo salida de build de un prototipo borrado. No es reutilizable.
- Los artefactos muestran su diseño: módulos `commands`, `manager`, `models`, `tray` y `wiz`; 21 comandos en snake_case; los mismos nombres de evento; identifier `com.wiz.app`; clave del updater nunca configurada.

## Riesgos, de mayor a menor dificultad de migración

| # | Riesgo | Por qué | Estado |
|---|---|---|---|
| 1 | Reescritura en Rust de la capa UDP y `BulbManager` | Es el grueso del trabajo y obliga a diseñar la concurrencia que hoy no existe | En alcance |
| 2 | Continuidad para usuarios Electron instalados | Formato de update incompatible e instalación lado a lado | Descartado: sin puente de actualización |
| 3 | Comportamiento de red por plataforma | Nuevo aviso de firewall en Windows, broadcast con adaptadores virtuales, permiso de red local en macOS; el emulador no lo cubre | En alcance solo Windows |
| 4 | Migración de `config.json` | Tauri busca en otro directorio; sin importación se pierden bombillas, colores y favoritos | En alcance |
| 5 | Pipeline de release nuevo | Toolchain Rust, claves de firma, baja de snap | En alcance solo Windows |
| 6 | Diferencias de motor web | Selector de color, `<select>`, piso de versiones de Tailwind v4, arranque con ventana oculta | Bajo en WebView2; el resto diferido |
| 7 | Adaptador IPC | Mecánico: 24 miembros, 25 sitios; `invoke` puede rechazar y `listen` devuelve función de baja | En alcance |
| 8 | Ventana, tray, instancia única, enlaces externos | Todo tiene plugin; las etiquetas del tray necesitan traducción en Rust | En alcance |
| 9 | Limpieza de tooling | Vite plano, tsconfig, eslint, `index.html` | En alcance |

Transversal: la licencia GPL-3.0-only de wikari.

## Pendientes del lado del usuario

- Generar el par de claves del updater y cargar los secretos en GitHub.
- Conseguir un ícono fuente de 1024 px o más.
- Confirmar el borrado de `wizapp-tauri/`.
- Revisar la licencia del repo frente a la de wikari.
