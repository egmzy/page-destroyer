# Page Destroyer

A Chrome extension that turns any webpage into a destructible playground. Click elements to destroy them with satisfying animations and sound effects.

### Watch Demo:

[![Watch Demo](https://img.youtube.com/vi/H_G78ZbRSeE/mqdefault.jpg)](https://www.youtube.com/watch?v=H_G78ZbRSeE)

[Chrome Web Store](https://chromewebstore.google.com/detail/mljgcdfelelajdnbeghebambkdipbpod?utm_source=item-share-cb) 

## Features

- **13 Weapons** — Flamer, Laser, Machine Gun, Hammer, Meteor, Black Hole, Explosion, Acid, Freeze, Lightning, Tornado, Glitch, Gravity
- **Sound Effects** — Synthesized audio using Web Audio API
- **Particle Effects** — Fire, sparks, debris, smoke, shockwaves, ice crystals, lightning bolts, vortex winds, pixels
- **Element Protection** — Large containers are protected from accidental destruction
- **Undo on Exit** — Press ESC to restore all destroyed elements

## Installation

1. Clone this repository
2. Generate icons: Open `tools/generate-icons.html` in browser and download
3. Move downloaded PNGs to `assets/icons/`
4. Open Chrome → `chrome://extensions`
5. Enable "Developer mode"
6. Click "Load unpacked" → select this folder

## Usage

1. Click the extension icon to activate
2. Select a weapon from the bottom toolbar
3. Click any element to destroy it
4. Press **ESC** or click **✕** to exit and restore

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 1-9 | Switch weapons (1-9) |
| M | Toggle mute |
| ESC | Exit & restore |

> Weapons 10-13 can be selected by clicking them in the toolbar.

## Project Structure

```
page-destroyer/
├── manifest.json
├── package.json
├── src/
│   ├── background.js
│   ├── content.js
│   └── content.css
├── assets/
│   └── icons/
└── tools/
    └── generate-icons.html
```

## License

MIT
