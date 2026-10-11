# Migración de WiZ APP a Tauri 2

Base: `main` en `8d21105`, inventario en `docs/electron-inventory.md`. Este documento fija qué se construye, en qué orden y cuándo cada parte está terminada.

## 1. Alcance

### En alcance

- Backend en Rust que reemplaza `src/main`, `src/preload` y `src/lib/wikari`. Sin sidecar Node.
- Renderer React conservado, con tres cambios: capa `api.ts` en lugar de `window.api`, tipos generados desde Rust, y UI de bombilla offline.
- Solo Windows (NSIS, instalación por usuario, WebView2).
- Importación única del `config.json` de Electron.
- Updater nuevo con firma minisign y release por GitHub Actions.
- Tests Rust automatizados con bombilla falsa, corriendo en CI.

### Cambios de comportamiento aceptados (no es un port 1:1)

| Antes | Después |
|---|---|
| Un comando fallido borra la bombilla activa de la lista y del config | La bombilla que falló queda visible como offline; el config no se toca |
| El config guarda solo lo conectado | El config es la fuente de verdad; solo cambia por acción explícita |
| Identidad por IP | Identidad por MAC, IP mutable |
| Descubrimiento secuencial, 5 s fijos por IP | Unicast en paralelo, retorno temprano, cancelable |
| El broadcast agrega todo lo que encuentra | Agrega solo con config vacío; si no, solo reubica MACs conocidas |
| Minimizar oculta al tray, la X sale | La X oculta al tray, minimizar es normal, salir solo desde el tray |
| Update silencioso al salir | Toast fijo con "actualizar ahora" |
| Errores tragados | Cada comando devuelve `Result<_, AppError>` |
| Estado solo cambia por comandos propios | Se refresca con `getPilot` al volver del tray |

### Fuera de alcance

- macOS y Linux (el identifier ya se elige pensando en ellos).
- Puente de auto-update desde Electron y desinstalación automática de la versión vieja.
- Firma de código de Windows (SmartScreen queda como hoy).
- Timers de fondo, sondeo periódico, suscripción `syncPilot`.
- Pantalla de ajustes, notificaciones nativas, instalación por máquina, regla de firewall.
- Funciones nuevas de la bombilla (temperatura, velocidad de escena).

## 2. Decisiones de arquitectura

### 2.1 Repositorio y corte

- Rama `tauri` creada desde `main`. En esa rama se borra todo lo de Electron desde el primer módulo; no hay código puente ni doble implementación. `main` sigue siendo Electron 3.0.x hasta el merge.
- Se borran: `src/main/`, `src/preload/`, `src/lib/wikari/`, `src/types/`, `electron.vite.config.mts`, `electron-builder.yml`, `dev-app-update.yml`, `build/`, `tsconfig.node.json`, y `wizapp-tauri/` (no trackeado; requiere tu confirmación).
- El renderer se queda en `src/renderer/` para no reescribir alias. `vite.config.ts` nuevo en la raíz con `root: 'src/renderer'`, `build.outDir: '../../dist'`, puerto 5173 con `strictPort`, y los plugins `react`, `tsConfigPaths`, `tailwindcss`.
- `src/shared/types/*` se reemplaza por tipos generados en `src/renderer/src/bindings/`. `MAX_DEFAULT_COLORS` pasa a `src/renderer/src/constants.ts` y a una constante Rust.
- `src/i18n/` y `resources/locales/{en,es}/translation.json` se conservan y son la única fuente de strings, también para el tray.
- Licencia: el repo ya es `GPL-3.0-only`, igual que wikari. La traducción a Rust no agrega obligaciones.

### 2.2 Estructura de `src-tauri/`

```
src-tauri/
  Cargo.toml  build.rs  tauri.conf.json  rust-toolchain.toml
  capabilities/default.json
  icons/
  src/
    main.rs            # llama a lib::run()
    lib.rs             # Builder: plugins, setup, invoke_handler, eventos de ventana
    error.rs           # AppError
    models.rs          # BulbState, MultiBulbState, ToastMessage, CustomColor, AddBulbOutcome
    config.rs          # AppConfig v2, ConfigStore, importación legacy
    i18n.rs            # idioma del sistema + etiquetas del tray
    tray.rs
    updater.rs
    legacy.rs          # detección de la instalación Electron
    commands.rs        # #[tauri::command], solo traduce a ManagerMsg
    wiz/
      protocol.rs      # Pilot, SystemConfig, sobres de request/response
      client.rs        # BulbClient
      discovery.rs     # discover_unicast, discover_broadcast
      netif.rs         # direcciones de broadcast por interfaz
      testing.rs       # FakeBulb (cfg(test))
    manager/
      mod.rs           # ManagerHandle, ManagerMsg, trait Frontend
      actor.rs         # bucle del actor y estado
      worker.rs        # tarea por bombilla
      discovery.rs     # orquestación de fases, cancelación
```

Crates: `tauri` 2, `tokio`, `tokio-util` (CancellationToken), `serde`, `serde_json`, `thiserror`, `uuid`, `if-addrs`, `sys-locale`, `winreg`, `ts-rs`, y los plugins `single-instance`, `opener`, `log`, `updater`.

### 2.3 Cliente UDP (`wiz/`)

- **Un socket por bombilla**, `UdpSocket` de tokio enlazado a `0.0.0.0:0` y `connect()` a `ip:38899`. Desaparecen el socket estático, el bind a 38900 y el candado global.
- `BulbClient::request<T>(method, params) -> Result<T, WizError>`: envía y lee hasta encontrar un JSON cuyo `method` coincide, descartando respuestas viejas, con plazo de 2000 ms. Un `error` en la respuesta es `WizError::Rejected`.
- Superficie: `get_pilot()`, `set_pilot(PilotPatch)`, `get_system_config()`. `toggle` se compone en el manager como `get_pilot` + `set_pilot { state }` explícito, así un reintento es idempotente.
- Validación de rango (`sceneId` 1 a 32, `dimming` 0 a 100) devuelve `AppError::InvalidArgument`; nunca se devuelve un error como valor de éxito.
- `Pilot` y `SystemConfig` se deserializan de forma laxa: campos opcionales con `#[serde(default)]`, sin `deny_unknown_fields`. Un firmware con campos extra o faltantes no rompe.
- Puerto y tiempos son parámetros (`WizNet { port }`, `Timings { response, discover_wait, retry_delay, attempts }`) para que los tests usen puertos efímeros y milisegundos.
- **Caso borde Windows:** un socket UDP conectado recibe `WSAECONNRESET` (10054) en `recv` si el destino responde ICMP "puerto inalcanzable" (emulador apagado, IP reasignada a una PC). Se trata como `Unreachable`, no como error fatal, y el socket se sigue usando.
- Descubrimiento: socket efímero propio con broadcast habilitado. `discover_unicast(ips)` envía a todas a la vez y termina cuando respondieron todas o vence el plazo. `discover_broadcast()` envía a `ip | !netmask` de cada interfaz IPv4 no loopback (`if-addrs`), con fallback a `255.255.255.255`. Deduplica por IP. La respuesta de `getPilot` ya trae la MAC.

### 2.4 Manager: actor con cola por bombilla

- `ManagerHandle { tx: mpsc::Sender<ManagerMsg> }` vive en el `State` de Tauri. Cada variante de `ManagerMsg` lleva un `oneshot::Sender<Result<T, AppError>>`.
- Una sola tarea (`actor.rs`) es dueña de `ConfigStore`, de la lista ordenada de bombillas y de `active_ip`. **El actor nunca espera red**: reenvía el comando al `worker` de esa bombilla y sigue atendiendo mensajes. El resultado vuelve como `ManagerMsg::WorkerDone`.
- `worker.rs`: una tarea por bombilla con su `BulbClient` y un `mpsc` FIFO. Bombillas distintas corren en paralelo; comandos a la misma bombilla, en orden. Nada se rechaza por solapamiento.
- La salida hacia la UI pasa por `trait Frontend { fn state(&self, s: &MultiBulbState); fn toast(&self, t: ToastMessage); }`. La implementación real emite `on-update-bulb` y `on-show-toast`; la de tests acumula en un `Vec`.

**Política de fallo.** Timeout o `Unreachable`: un reintento; si vuelve a fallar, esa bombilla (no la activa) pasa a `online: false`, se emite estado y el comando devuelve `AppError::BulbOffline`. `Rejected`: la bombilla sigue online y se devuelve `AppError::BulbRejected`. El config no cambia en ningún caso.

**Estado optimista.** Tras un `set_pilot` exitoso se actualizan los campos cacheados (`state`, `dimming`, `sceneId`), como hoy.

**Vuelta a online.** Sin timers. Se sondea con `get_pilot` cuando: llega un comando para esa bombilla (el propio comando es el sondeo), `set_active_bulb` la selecciona, `probe_bulb(ip)` (botón reintentar), o la ventana se muestra desde el tray o por segunda instancia (`ManagerMsg::RefreshAll`, en paralelo, ignorado si hubo otro hace menos de 5 s o hay descubrimiento en curso). `RefreshAll` también actualiza el piloto de las online.

**Bombilla activa offline.** Sigue siendo la activa. `set_active_bulb` acepta una offline. Al borrar la activa, pasa a ser la primera de la lista.

**Descubrimiento (`manager/discovery.rs`).**

1. Al iniciar se emite estado con todas las guardadas en `online: false` e `isDiscovering: true`.
2. Fase 1: unicast paralelo a las IPs guardadas, hasta 3 intentos separados por 5 s, cortando cuando al menos una responde. Por cada respuesta: `get_system_config`, completar la MAC en el config si faltaba, marcar online. Si la MAC que responde no coincide con la guardada para esa IP, esa entrada queda offline (la IP fue reasignada a otra bombilla).
3. Fase 2: broadcast, solo si ninguna quedó online, hasta 3 intentos. Con `config.bulbs` vacío **adopta** todo lo que responde. Con bombillas guardadas solo **reubica**: una MAC conocida con otra IP actualiza `ip` (y `activeBulbIp` si era la activa) conservando el nombre; las MAC desconocidas se ignoran.
4. `discoveryFailed` es verdadero solo si no hay ninguna bombilla conocida al terminar; ahí se emite el toast fijo `toast.discoveryFailed` con acción `retry-discovery`. Con guardadas todas offline no hay toast: se ve la lista gris.

Cada descubrimiento tiene un `CancellationToken` y un número de generación. `retry_discovery` y `delete_profile` cancelan el anterior y arrancan otro; los resultados de una generación vieja se descartan. `add_bulb_by_ip` corre independiente del descubrimiento.

### 2.5 Config (`config.rs`)

Ruta: `app_config_dir()/config.json`, es decir `%APPDATA%\com.matiastk.wizapp\config.json`.

```jsonc
{
  "version": 2,
  "bulbs": [{ "mac": "a8bb50aabbcc", "ip": "192.168.1.40", "name": "Living" }], // mac puede ser null
  "activeBulbIp": "192.168.1.40",
  "customColors": [{ "id": 33, "name": "Rosa", "hex": "#ff66aa" }],
  "favoriteColors": [11, 12, 14, 6]
}
```

- `ConfigStore::save()` escribe a `config.json.tmp` y renombra. Solo escribe el actor.
- Archivo ilegible, de forma inválida o con `version` mayor a 2: se renombra a `config.corrupt-<timestamp>.json`, se arranca con config nuevo y se emite `toast.configReset`. Nunca se pisa en silencio.
- Config nuevo: listas vacías y los cuatro favoritos por defecto (Warm White, Daylight, Night Light, Cozy; los IDs salen de `SCENES` en `src/lib/wikari/src/constants.ts` antes de borrarlo).
- **Importación legacy** (`import_legacy()`): solo si no existe config nuevo. Busca `config.json` en `%APPDATA%\Wiz App\`, luego `WiZ APP\`, luego `wiz_app\`. Valida la forma v1 (tres arrays), convierte `bulbIp`/`bulbName` a `ip`/`name` con `mac: null`, escribe v2 y emite `toast.configImported`. El archivo de Electron no se modifica. No se vuelve a importar: después los dos configs divergen.

### 2.6 Contrato IPC

**Tipos.** `models.rs` y `error.rs` derivan `ts_rs::TS` y exportan a `src/renderer/src/bindings/`. Se regeneran con `cargo test`; CI falla si `git diff` muestra cambios en esa carpeta.

- `BulbState`: los campos actuales de `src/shared/types/bulbState.ts` más `online: boolean`. Una bombilla que nunca respondió en la sesión lleva valores por defecto en los campos de piloto. `customColors` y `favoriteColors` se siguen copiando en cada `BulbState` al serializar (no se guardan duplicados en memoria).
- `MultiBulbState`: sin cambios (`bulbs`, `activeBulb`, `isDiscovering`, `discoveryFailed`).
- `ToastMessage`: sin cambios de forma. `retryAction` admite ahora `retry-discovery`, `install-update` y `open-apps-settings`.
- `AppError`: `#[serde(tag = "code", rename_all = "camelCase")]` con `bulbOffline { ip }`, `bulbRejected { ip }`, `unknownBulb { ip }`, `bulbUnreachable { ip }`, `invalidArgument { field }`, `io`, `updater`.
- `AddBulbOutcome`: `added` | `duplicate`.

**Quién muestra el toast.** Regla única para no duplicar: lo que el renderer invoca devuelve `Result` y el toast lo arma el renderer; Rust solo emite `on-show-toast` para lo que no tiene quien espere (descubrimiento, tray, chequeo de update al arrancar, importación, config corrupto, aviso de instalación vieja).

**Comandos** (`commands.rs`; los argumentos van en camelCase desde JS):

| Comando | Devuelve |
|---|---|
| `get_bulbs` | `MultiBulbState` |
| `toggle_bulb`, `set_brightness(brightness)`, `set_scene(sceneId)`, `set_custom_color(colorId)` | `()` |
| `set_bulb_name(name, ip?)`, `set_active_bulb(ip)`, `toggle_bulb_by_ip(ip)`, `delete_bulb(ip)`, `probe_bulb(ip)` | `()` |
| `add_bulb_by_ip(ip)` | `AddBulbOutcome` |
| `add_custom_color(colorName, colorHex)`, `edit_custom_color(colorId, colorName, colorHex)`, `remove_custom_color(colorId)`, `toggle_favorite_color(colorId)`, `set_favorite_colors_order(favoriteColors)` | `()` |
| `retry_discovery`, `delete_profile` | `()` (devuelven al iniciar, no al terminar) |
| `get_language` | `string` |
| `check_for_updates` | `boolean` |
| `install_update`, `open_app_folder`, `open_apps_settings`, `show_window` | `()` |

`probe_bulb`, `install_update` y `open_apps_settings` son nuevos. `get-version` se reemplaza por `getVersion()` de `@tauri-apps/api/app`.

**Eventos.** `on-update-bulb` y `on-show-toast`, con los mismos nombres.

**Renderer.** `src/renderer/src/lib/api.ts` exporta un objeto `api` con la forma de `IElectronAPI` (`src/preload/electronAPI.ts`) más los tres comandos nuevos, implementado con `invoke` y `listen`. `onUpdateBulb` y `onShowToast` devuelven la función de baja. `getLanguage` captura el rechazo y devuelve `'en'`, así React siempre monta. `BulbStore.tsx` envuelve cada acción en un `call()` que convierte un `AppError` en un toast `toast.error.<code>`; `addBulbByIp` traduce `added`/`duplicate`/error a los toasts actuales `toast.addSuccess`/`addDuplicate`/`addFailed`.

**Capabilities** (`capabilities/default.json`): `core:default`, `log:default`, y `opener:allow-open-url` limitado a `https://*`. El updater y la apertura de carpetas se usan solo desde Rust, sin permisos expuestos al webview.

### 2.7 Ventana, tray, idioma, logs

- `tauri.conf.json`: `productName: "WiZ APP"`, `identifier: "com.matiastk.wizapp"`, `version: "../package.json"`, ventana 900x600 con el mismo mínimo, `visible: false`, `backgroundColor: "#1e1e1e"`, sin menú.
- Arranque oculto: `show_window` la muestra tras `document.fonts.ready`, como hoy. Red de seguridad nueva: si a los 5 s no se mostró, Rust la muestra igual (evita una app invisible si el JS falla).
- `CloseRequested`: `prevent_close()` y `hide()`. Sin aviso al usuario. Minimizar no se intercepta.
- Tray (`tray.rs`): mostrar, alternar bombilla activa, salir. Clic izquierdo muestra la ventana. "Salir" llama a `app.exit(0)`. Mostrar dispara `RefreshAll`.
- Instancia única: `tauri-plugin-single-instance` registrado primero; el callback hace `show`, `unminimize`, `set_focus` y `RefreshAll`.
- Enlaces externos: los `target="_blank"` del renderer pasan a `openUrl` de `@tauri-apps/plugin-opener`.
- Idioma (`i18n.rs`): `sys_locale::get_locale()` recortado a `en`/`es`, fallback `en`. Las tres etiquetas del tray se leen de los `translation.json` embebidos con `include_str!`.
- Logs: `tauri-plugin-log` a stdout y a `wiz-app.log` dentro de `app_config_dir()`, para que `open_app_folder` siga mostrando config y log juntos. `BulbStore.tsx` cambia `electron-log/renderer` por `@tauri-apps/plugin-log`.
- `src/renderer/index.html`: se quita el `<script src="http://localhost:8097">`. CSP en `app.security.csp`: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src ipc: http://ipc.localhost`.

### 2.8 Updater

- `bundle.createUpdaterArtifacts: true`; `plugins.updater` con `pubkey`, endpoint `https://github.com/MatiasTK/WizAPP/releases/latest/download/latest.json` y `windows.installMode: "passive"`.
- `updater.rs`: `check_on_startup()` (solo en release) emite el toast fijo `toast.updateAvailable` con acción `install-update`. `check_for_updates` devuelve el booleano que espera `HelpModal.tsx` y emite el mismo toast. `install_update` hace `download_and_install` y `app.restart()`; en Windows Tauri cierra la app para correr el instalador.
- La app nunca se cierra para actualizar sin que el usuario lo pida.
- Un release en draft o marcado prerelease no es visible para ese endpoint.

### 2.9 Empaquetado, convivencia y firewall

- `bundle.targets: ["nsis"]`, `installMode: currentUser`, WebView2 con `downloadBootstrapper`, idiomas del instalador inglés y español.
- La versión Electron no se desinstala. `legacy.rs` busca en `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall` una entrada cuyo `DisplayName` empiece con `WiZ APP` y cuyo desinstalador no sea el nuestro. Si existe, en el primer arranque (cuando se crea o importa el config) se emite el toast fijo `toast.legacyInstallFound` con acción `open-apps-settings`, que abre `ms-settings:appsfeatures`. `HelpModal.tsx` muestra el mismo aviso mientras la entrada exista.
- Firewall: sin regla ni elevación. El texto de `toast.discoveryFailed` suma una mención al firewall y `HelpModal.tsx` una entrada de ayuda. Qué se bloquea exactamente al cancelar el aviso se mide en el spike del módulo 0.
- Versiones: `4.0.0-beta.N` como prerelease de GitHub, luego `4.0.0`. `package.json` y `Cargo.toml` se suben juntos.

## 3. Orden de módulos y criterio de terminado

Cada módulo termina con `pnpm typecheck`, `pnpm lint`, `cargo fmt --check`, `cargo clippy -- -D warnings` y `cargo test` en verde, además de lo propio.

### M0. Andamiaje y spikes

Rama `tauri`, borrado de Electron, `vite.config.ts`, `tsconfig` y eslint sin presets de electron-toolkit, `package.json` (scripts `dev`, `build`, `tauri`; sin `postinstall`), `.npmrc` sin mirrors, `src-tauri/` mínimo, actualización de `CLAUDE.md`.

Terminado cuando:
- `pnpm tauri dev` abre la ventana con el renderer cargado (sin backend, con errores de `invoke` esperables) y HMR funciona.
- Spike de firewall documentado en este archivo: un binario de prueba que hace unicast y broadcast UDP, corrido en una VM limpia aceptando y cancelando el aviso, con el resultado de cada combinación.
- Spike de ventana: arranque con `visible: false` y `show()` posterior sin parpadeo blanco en WebView2.

### M1. Cliente UDP (`wiz/`)

Terminado cuando `cargo test` cubre con `FakeBulb`:
- `get_pilot`, `set_pilot`, `get_system_config` contra una bombilla que responde.
- Timeout sin respuesta, y **la siguiente petición funciona** (el bug del candado de wikari).
- Respuesta tardía de una petición anterior descartada por `method`.
- Respuesta con `error` produce `Rejected`; JSON inválido se ignora hasta el plazo.
- Puerto cerrado (`WSAECONNRESET`) produce `Unreachable` y el socket sigue usable.
- Respuesta con campos desconocidos y con opcionales faltantes se deserializa.
- `discover_unicast` retorna antes del plazo cuando responden todas; `discover_broadcast` deduplica.
- Prueba manual: un ejemplo `cargo run --example probe -- 127.0.0.1` contra `scripts/wiz_emulator.py`.

### M2. Config e importación (`config.rs`)

Terminado cuando `cargo test` cubre, sobre directorios temporales:
- Ida y vuelta de v2; escritura atómica (no queda `.tmp`).
- Archivo corrupto y `version: 3` terminan respaldados como `config.corrupt-*.json` y con config nuevo.
- Importación desde cada una de las tres carpetas legacy, con un `config.json` real de Electron 3.0.0 como fixture; el original queda byte a byte igual.
- No se importa si ya existe config nuevo.

### M3. Manager (`manager/`)

Terminado cuando `cargo test` cubre, con `FakeBulb` y un `Frontend` de prueba:
- Arranque con 3 guardadas y 1 apagada: 2 online, 1 offline, **las 3 siguen en el config**.
- Comando a una bombilla que deja de responder: queda offline, devuelve `bulbOffline`, la activa no cambia aunque la que falló sea otra.
- Comando a una bombilla offline que volvió: queda online.
- Dos bombillas, una colgada: el comando a la otra responde sin esperar el timeout de la primera, y `get_bulbs` responde de inmediato.
- Comandos solapados a la misma bombilla se ejecutan en orden y ninguno falla.
- `retry_discovery` durante un descubrimiento: el primero se cancela y no emite estado después.
- `delete_profile` durante un descubrimiento: config borrado, descubrimiento nuevo en modo adopción.
- Broadcast con config vacío adopta; con config no vacío ignora MACs desconocidas.
- MAC conocida en otra IP: se actualiza `ip` y `activeBulbIp`, se conserva el nombre.
- IP guardada respondida por otra MAC: la entrada queda offline y no se pisa.
- Sin bombillas conocidas: `discoveryFailed` y toast fijo. Con guardadas todas offline: sin toast.
- Colores y favoritos: alta, edición, baja (también la saca de favoritos), reordenamiento, y persisten.

### M4. Comandos, bindings y renderer

`commands.rs`, `lib.rs` con el actor arrancado en `setup`, bindings generados, `src/renderer/src/lib/api.ts`, y adaptación de los seis archivos que usan `window.api` (`BulbStore.tsx`, `main.tsx`, `pages/Home.tsx`, `AddDeviceModal`, `EditNameModal`, `HelpModal`). UI offline: la lista de bombillas atenúa las offline; `Home.tsx` muestra aviso y botón reintentar (`probe_bulb`) y deshabilita toggle, `BrightnessSlider.tsx` y escenas cuando la activa está offline; el loader de pantalla completa solo aparece con `isDiscovering` y lista vacía. Claves i18n nuevas en `en` y `es`: `toast.error.*`, `bulb.offline`, `bulb.retry`, `toast.configImported`, `toast.configReset`.

Terminado cuando:
- No queda ninguna referencia a `window.api`, `electron-log` ni `@shared/types` en `src/renderer`.
- `git diff --exit-code src/renderer/src/bindings` pasa después de `cargo test`.
- Con el emulador: agregar las tres bombillas por IP, alternar, brillo, escena, color custom, renombrar, borrar, favoritos con drag and drop, borrar perfil. Todo se refleja en la UI y sobrevive a un reinicio.
- Matar el emulador y alternar: la bombilla queda gris con toast de error y los controles deshabilitados. Reiniciar el emulador y apretar reintentar: vuelve.
- `HelpModal.tsx` muestra la versión real, no el texto fijo `3.0.0 (Windows)`.

### M5. Shell de escritorio

Ventana, cierre al tray, tray, instancia única, enlaces externos, idioma, logs, CSP.

Terminado cuando:
- La X oculta; el proceso sigue; el tray muestra, alterna y sale.
- Segunda instancia trae la ventana al frente también si estaba oculta.
- Con Windows en español las etiquetas del tray y la UI salen en español; en otro idioma, en inglés.
- Cambiar el estado de una bombilla del emulador por fuera y restaurar desde el tray refleja el cambio.
- Los enlaces de `HelpModal.tsx` abren el navegador del sistema.
- `open_app_folder` abre la carpeta con `config.json` y `wiz-app.log`, y el log tiene líneas de Rust y del renderer.
- Sin errores de CSP en la consola del build de release.

### M6. Updater

Requiere el par de claves (pendiente tuyo).

Terminado cuando:
- Con un `latest.json` de prueba que anuncia una versión mayor: aparece el toast al arrancar, "actualizar ahora" instala y relanza en la versión nueva.
- Con un artefacto de firma alterada, la instalación falla con toast de error y la app sigue corriendo.
- `check_for_updates` desde `HelpModal.tsx` devuelve `false` sin update y no acumula listeners.

### M7. Empaquetado, CI y convivencia

Íconos con `pnpm tauri icon` (requiere la fuente de 1024 px), `bundle` NSIS, `legacy.rs`, `.github/workflows/ci.yml` (PR, `windows-latest`: typecheck, lint, fmt, clippy, test, diff de bindings) y `.github/workflows/release.yml` reescrito (tag `v*.*.*`, solo Windows, `tauri-apps/tauri-action` con `includeUpdaterJson`, secretos `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, draft, prerelease si el tag contiene `-beta`).

Terminado cuando:
- Un tag `v4.0.0-beta.1` produce un draft con el instalador, su `.sig` y `latest.json`.
- En una VM con Electron 3.0.0 instalado y configurado: instalar la beta no pide admin, importa bombillas, nombres, colores y favoritos, y muestra el aviso de instalación vieja; el botón abre Aplicaciones instaladas. Tras desinstalar Electron el aviso no vuelve y el config nuevo sigue intacto.
- En una VM limpia: instala, descarga WebView2 si falta, y desinstala sin dejar el ejecutable.

### M8. Beta y versión estable

Terminado cuando la verificación de la sección 4 pasa completa sobre el instalador de la beta, se publica `4.0.0`, y la actualización `4.0.0` a `4.0.1` funciona por auto-update. Después: merge de `tauri` a `main` y README actualizado con la nota de reinstalación manual para usuarios de 3.x.

## 4. Verificación end-to-end

Se corre sobre el instalador generado por CI, no sobre `tauri dev`.

**A. Con emulador** (`python scripts/wiz_emulator.py`)

1. Primer arranque sin config: sin bombillas conocidas, toast fijo de descubrimiento fallido con mención al firewall.
2. Agregar `127.0.0.1`, `.2` y `.3`. Repetir una: toast de duplicada. Agregar `127.0.0.9`: toast de fallo en unos 5 s.
3. Por cada bombilla: alternar, brillo, una escena estática, una dinámica, un color custom.
4. Renombrar, reordenar favoritos, borrar un color que era favorito.
5. Reiniciar la app: todo persiste y las tres aparecen online en menos de 2 s.
6. Apagar el emulador y reiniciar la app: las tres aparecen grises de inmediato, sin toast fijo, y siguen en `config.json`.
7. Encender el emulador y restaurar desde el tray: vuelven a online sin tocar nada más.
8. Borrar una bombilla, borrar el perfil: config limpio y descubrimiento nuevo.

**B. Con bombillas reales**

9. Config vacío: el broadcast las encuentra y las adopta.
10. Desenchufar una y mandarle un comando: queda offline en unos 4 s y las demás siguen respondiendo durante ese lapso.
11. Cambiar el estado desde la app oficial de WiZ, ocultar y restaurar: se refleja.
12. Reservar otra IP en el router para una bombilla y reiniciarla, con todas las demás apagadas: reintentar la reubica conservando el nombre.
13. Alternar desde el tray con la ventana oculta.

**C. Sistema**

14. X oculta, segunda instancia restaura, "Salir" termina el proceso (verificar en el Administrador de tareas).
15. Aviso de firewall: aceptar y verificar descubrimiento; en otra VM cancelar y verificar que el mensaje orienta al usuario.
16. VM con Electron 3.0.0: importación y aviso de convivencia (criterio de M7).
17. Auto-update de `4.0.0` a `4.0.1`.
18. `config.json` escrito a mano con basura: respaldo `config.corrupt-*`, toast, app usable.

## 5. Riesgos abiertos

| Riesgo | Mitigación | Se resuelve en |
|---|---|---|
| Cancelar el aviso de firewall bloquea respuestas de broadcast o todo UDP entrante | Spike con medición real antes de escribir el cliente | M0 |
| `WSAECONNRESET` en sockets conectados | Test dedicado; si resulta inestable, pasar a sockets sin `connect` filtrando por origen | M1 |
| La entrada de registro de electron-builder no coincide con lo supuesto (`DisplayName`, HKCU) | Verificar en la VM con 3.0.0 antes de escribir `legacy.rs` | M7 |
| Dos apps abiertas a la vez controlando las mismas bombillas | Aceptado; solo se avisa | n/a |
| Firmware con respuestas distintas a las del emulador | Deserialización laxa y prueba B con hardware real | M1, M8 |
| Usuarios que cierran con la X y no ven que sigue corriendo | Aceptado sin aviso; revisar con feedback de la beta | M8 |
| Latencia de arranque con todas offline (hasta ~55 s de `isDiscovering`) | La lista gris se muestra desde el primer estado; el loader no bloquea | M4 |

## 6. Pendientes del lado del usuario

- Generar el par de claves del updater (`pnpm tauri signer generate`) y cargar los dos secretos en GitHub. Bloquea M6.
- Ícono fuente de 1024 px o más. Bloquea M7.
- Confirmar el borrado de `wizapp-tauri/` (no trackeado, no recuperable desde git). Bloquea el cierre de M0.
- Una VM de Windows limpia y otra con Electron 3.0.0 instalado y configurado. Bloquea M0 (spike) y M7.

## 7. Estado de ejecución

**M0 — parcial (2026-10-10), rama `tauri`.**

Hecho: rama creada desde `main`; Electron borrado salvo `wizapp-tauri/`; `vite.config.ts`, `tsconfig.json` único y eslint sin presets de electron-toolkit; `package.json` sin Electron; `src-tauri/` mínimo (single-instance, opener, log, CSP, NSIS); `CLAUDE.md` actualizado. `pnpm typecheck`, `eslint` y `cargo check` pasan; `pnpm tauri dev` compila, sirve el renderer en :5173 y abre `wiz-app.exe`.

Pendiente de M0:
- Spike de firewall (requiere VM limpia, ver §6).
- Spike de ventana sin parpadeo blanco (verificación visual; hoy `setup` muestra la ventana de inmediato).
- HMR no verificado visualmente.
- Borrar `wizapp-tauri/` (espera confirmación).
- `cargo fmt --check` y `clippy -D warnings` pasan. Los íconos son los 256 px de Electron, no los generados por `pnpm tauri icon`.
- Desviaciones: `strict` queda en `false` en `tsconfig.json` porque el código del renderer no compila en modo estricto; se mantiene el comportamiento del preset anterior. `src/renderer/src/env.d.ts` trae una declaración temporal de `window.api` hasta M4.

**M1 — hecho (2026-10-10).** `src-tauri/src/wiz/` (protocol, client, discovery, netif, testing) con 14 tests en verde con `FakeBulb`, incluido `WSAECONNRESET` real en Windows. `cargo clippy --all-targets -D warnings` limpio. Verificado a mano con `cargo run --example probe -- 127.0.0.2` contra el emulador. Nota: en Windows el emulador necesita `PYTHONIOENCODING=utf-8` (imprime `→` y cae con cp1252).

**M2 — hecho (2026-10-10).** `src-tauri/src/config.rs` + `models.rs` (`CustomColor`, `MAX_DEFAULT_COLORS`). 9 tests de config en verde (23 en total). Desviación: el fixture `src/testdata/electron_3_0_0_config.json` es **sintético** con la forma exacta que escribe 3.0.0 (verificada contra el `config.json` real de esta máquina: `bulbs[{bulbIp,bulbName}]`, `activeBulbIp`, `customColors`, `favoriteColors`); no se copió el archivo real para no versionar IPs de la red del usuario. Los tests de las tres carpetas legacy no distinguen `Wiz App` de `WiZ APP` en Windows (NTFS no distingue mayúsculas); el orden de búsqueda se prueba con `wiz_app`.
