# Developer Context Information

## Externalized Dependencies

In an Electron app, native Node modules (the ones you compile with electron-rebuild) must be externalized. They cannot be bundled, therefore should be installed with `npm i --save ...` into `dependencies` section.

Command for detecting node native modules:

```bash
find node_modules -type f -name "*.node" 2>/dev/null | grep -v "obj\.target"
```

### baileys

The `baileys` package and its dependencies are externalized:
- `bufferutil`
- `utf-8-validate`

These 2 dependencies contain electron-rebuilt node native modules. The `baileys` package itself is also externalized for compatibility.

### better-sqlite3

`better-sqlite3` contain node native modules and needs to be externalized.

### jimp

`jimp` is added as image processing library for baileys. `sharp` can be used as an alternative.
Without adding any the image processsing (like adding group profile picture) will fail.

## Icons

The project has **two** separate icon directories that serve different purposes.

### `build/` — Packaging & installer icons (used by electron-builder)

These files are consumed **only at build/package time** by `electron-builder`. They are never loaded at runtime by the Electron process itself.

| File | Purpose |
|------|---------|
| `build/icon.png` | Source icon (1024×1024 px). Used by electron-builder as the base for all platforms when no platform-specific icon is specified. |
| `build/icon.icns` | macOS application icon (multi-resolution `.icns`). Used for the `.app` bundle and the macOS dock icon when installed. |
| `build/icon.ico` | Windows application icon (multi-size `.ico`). Used for the installer (NSIS), the `.exe` file, and the Windows taskbar/Start menu. |
| `build/icons/<size>x<size>.png` | XDG icon set for Linux (16 → 512 px). Required by `electron-builder` to install icons into `/usr/share/icons/hicolor/` inside `.deb` packages so that the desktop environment (GNOME, KDE, etc.) can display the app icon in the dock/launcher. Without this directory the dock icon is missing after installation. |

The `build/icons/` directory is explicitly referenced in `electron-builder.yml` under the `linux.icon` key:

```yaml
linux:
  icon: build/icons
```

> **Regenerating `build/icons/`:** If `build/icon.png` changes, regenerate the full icon set with:
> ```bash
> mkdir -p build/icons
> for size in 16 24 32 48 64 96 128 256 512; do
>   sips -z $size $size build/icon.png --out build/icons/${size}x${size}.png
> done
> ```

---

### `resources/` — Runtime icons (used by the running Electron process)

These files are copied into the packaged app's `resources/` directory via the `extraResources` rule in `electron-builder.yml` and are accessed at runtime through `process.resourcesPath` (packaged) or `app.getAppPath() + '/resources'` (dev).

#### `resources/icon.png` (885×885 px)

The **window icon** on Linux. Passed to `BrowserWindow` so the OS can use it for the taskbar button and window decoration.

```ts
// src/main/index.ts
import icon from '../../resources/icon.png?asset'

new BrowserWindow({
  ...(process.platform === 'linux' ? { icon } : {}),
})
```

On macOS and Windows the window icon is derived automatically from the packaged `.icns`/`.ico`, so this is Linux-only.

#### `resources/icon-white.png`

A white/monochrome variant of the app icon. Used in two places:

1. **WhatsApp group profile picture** — set as the profile picture of the Aloha WhatsApp group when it is first created (`src/main/gateway/whatsapp.ts`):

   ```ts
   const iconPath = app.isPackaged
     ? path.join(process.resourcesPath, 'icon-white.png')
     : path.join(app.getAppPath(), 'resources', 'icon-white.png')
   await this.sock!.updateProfilePicture(this.groupId, { url: iconPath })
   ```

2. **Linux system tray icon** — referenced via the `TRAY_ICON_FILE_NAME` map in `src/main/index.ts` (see tray section below).

#### `resources/tray/` — Tray icons

Platform-specific icons for the system tray. The correct file is selected at runtime based on `process.platform`:

| File | Platform | Notes |
|------|----------|-------|
| `resources/tray/iconTemplate.png` + `iconTemplate@2x.png` | macOS | `Template` suffix tells macOS to apply automatic dark/light tinting. |
| `resources/tray/icon-white.png` | Linux | White icon that is visible on both dark and light panels. |
| `resources/tray/win.ico` | Windows | `.ico` file for the Windows notification area. |

Resolution logic in `src/main/index.ts`:

```ts
const TRAY_ICON_FILE_NAME = {
  win32:  'win.ico',
  darwin: 'iconTemplate.png',
  linux:  'icon-white.png',
}

const trayIcon = nativeImage.createFromPath(
  app.isPackaged
    ? path.resolve(process.resourcesPath, './tray/', trayIconFileName)
    : path.resolve(__dirname, '../../resources/tray/', trayIconFileName)
)
```

---

### Summary

| Scenario | Source directory | Resolved by |
|----------|-----------------|-------------|
| App bundle icon / installer icon (all platforms) | `build/` | `electron-builder` at package time |
| Linux dock icon after `.deb` install | `build/icons/` | `electron-builder` → XDG icon theme |
| Linux `BrowserWindow` icon (window decoration / taskbar button) | `resources/icon.png` | Electron main process at runtime |
| System tray icon (all platforms) | `resources/tray/` | Electron main process at runtime |
| WhatsApp group profile picture | `resources/icon-white.png` | WhatsApp gateway at runtime |