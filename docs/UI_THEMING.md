# UI Theming System

A fully Tailwind-native color theming system for the Nitro client. Users can customize the entire interface appearance — colors, fonts, glassmorphism effects — with live preview and persistence.

## Table of Contents

- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [CSS Variables Reference](#css-variables-reference)
- [Themed Elements](#themed-elements)
- [Font Customization](#font-customization)
- [Theme Presets](#theme-presets)
- [Import / Export](#import--export)
- [Server-Side Sync (WebSocket)](#server-side-sync-websocket)
- [Adding New Themed Elements](#adding-new-themed-elements)
- [Renderer & Emulator Integration](#renderer--emulator-integration)
- [Localization Keys](#localization-keys)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  UiSettingsProvider (App.tsx)                    │
│  ┌─────────────────────────────────────────────┐│
│  │  UiSettingsContext                          ││
│  │  - settings: IUiSettings                   ││
│  │  - updateSettings(partial)                 ││
│  │  - resetSettings()                         ││
│  │                                            ││
│  │  On change:                                ││
│  │  1. applyThemeToDOM() → sets CSS vars      ││
│  │  2. saveSettings() → localStorage          ││
│  │  3. syncToServer() → WebSocket (debounced) ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  CSS Custom Properties on <html>                │
│  --theme-primary, --theme-dark-panel, etc.      │
│                                                 │
│  Consumed by:                                   │
│  - Tailwind arbitrary values: bg-[var(--theme)] │
│  - CSS classes: .bg-card-header, .btn-primary   │
│  - CSS overrides: .nitro-infostand, .toolbar    │
└─────────────────────────────────────────────────┘
```

**Key design principle:** Components never need to know if a theme is active. They use standard Tailwind classes or CSS classes that reference CSS variables with fallback defaults. When no theme is active, fallbacks match the original hardcoded values — zero visual change.

---

## How It Works

### 1. Provider wraps the app

```tsx
// App.tsx
<UiSettingsProvider>
    <Base fit overflow="hidden">
        ...
    </Base>
</UiSettingsProvider>
```

### 2. Context applies CSS variables to `<html>`

When `settings.colorMode === 'color'`, the context sets CSS custom properties on `document.documentElement`:

```ts
root.style.setProperty('--theme-primary', 'rgba(30, 114, 149, 1)');
root.style.setProperty('--theme-dark-panel', '#212131');
// ... etc
```

When `settings.colorMode === 'default'`, all variables are removed and CSS fallbacks take over.

### 3. Components use CSS variables with fallbacks

**Tailwind arbitrary values (in TSX):**
```tsx
// Button.tsx - primary variant
'bg-[var(--theme-primary,#1e7295)] border-[var(--theme-primary,#1e7295)]'

// ToolbarView.tsx
'bg-[var(--theme-dark-bg-95,rgba(28,28,32,.95))]'
```

**CSS classes (in .css files):**
```css
/* index.css */
.bg-card-header {
    background-color: var(--theme-primary, #1e7295);
}

/* Buttons.css */
.btn-primary {
    background-color: var(--theme-primary, #3c6d82);
    border: 2px solid var(--theme-primary-border, #1a617f);
}
```

---

## CSS Variables Reference

| Variable | Default | Used by |
|----------|---------|---------|
| `--theme-primary` | `#1E7295` | Card headers, primary buttons, progress bars, slider track |
| `--theme-primary-dark` | `#185D79` | Card tabs |
| `--theme-primary-hover` | `#1a617f` | Button hover states |
| `--theme-primary-border` | `#185b77` | Button borders, card borders |
| `--theme-dark-bg` | `rgba(28,28,32,.98)` | Dark button backgrounds |
| `--theme-dark-bg-95` | `rgba(28,28,32,.95)` | Toolbar background |
| `--theme-dark-panel` | `#212131` | InfoStand, room tools, purse, history panel |
| `--theme-dark-border` | `#1c1c2a` | Dark button borders |
| `--theme-ctx-bg` | `#1c323f` | Context menu background |
| `--theme-ctx-header` | `#3d5f6e` | Context menu header |
| `--theme-ctx-item1` | `#131e25` | Context menu item gradient (top) |
| `--theme-ctx-item2` | `#0d171d` | Context menu item gradient (bottom) |
| `--theme-slider-track` | `#1e7295` | Slider active track |
| `--theme-border` | `#283F5D` | Card borders |
| `--theme-header-image` | — | Header background image URL (image mode) |
| `--theme-font-family` | `Ubuntu` | Global font family |
| `--theme-font-scale` | `1` | Global font scale multiplier |

---

## Themed Elements

All these elements respond to theme changes automatically:

| Element | File | Variable(s) used |
|---------|------|-----------------|
| Card headers | `NitroCardHeaderView.tsx`, `NitroCardView.css` | `--theme-primary` |
| Card tabs | `NitroCardTabsView.tsx`, `index.css` | `--theme-primary-dark` |
| Primary buttons | `Button.tsx`, `Buttons.css` | `--theme-primary`, `--theme-primary-border` |
| Dark buttons | `Button.tsx`, `Buttons.css` | `--theme-dark-bg`, `--theme-dark-border` |
| Gray buttons | `Button.tsx` | `--theme-primary` |
| Toolbar | `ToolbarView.tsx` | `--theme-dark-bg-95` |
| Context menu | `ContextMenuView.tsx` | `--theme-ctx-bg` |
| Context menu header | `ContextMenuHeaderView.tsx` | `--theme-ctx-header` |
| Context menu items | `ContextMenuListItemView.tsx`, `index.css` | `--theme-ctx-item1`, `--theme-ctx-item2` |
| InfoStand | `InfoStand.css` | `--theme-dark-panel` |
| Room tools | `RoomWidgets.css` | `--theme-dark-panel` |
| Room history | `RoomWidgets.css` | `--theme-dark-panel` |
| Room tools info | `RoomWidgets.css` | `--theme-dark-panel` |
| Purse (HC content) | `PurseView.css` | `--theme-dark-panel` |
| Purse (seasonal) | `PurseView.css` | `--theme-dark-panel` |
| Progress bar | `LayoutProgressBar.tsx` | `--theme-primary` |
| Slider track | `slider.css` | `--theme-slider-track` |
| Primary text | `Text.tsx` | `--theme-primary` |

---

## Font Customization

### Available Fonts

| Font | Type |
|------|------|
| Ubuntu | Default (bundled) |
| Roboto | Google Fonts |
| Inter | Google Fonts |
| Poppins | Google Fonts |
| Nunito | Google Fonts |
| Open Sans | Google Fonts |
| Lato | Google Fonts |
| Montserrat | Google Fonts |
| Source Sans 3 | Google Fonts |
| Quicksand | Google Fonts |
| Comic Neue | Google Fonts |
| Pixelify Sans | Google Fonts |

### How font loading works

1. User selects a font from the dropdown
2. If the font is not "Ubuntu" (the default), a `<link>` tag is dynamically added to `<head>` pointing to Google Fonts CDN
3. The `font-family` CSS property is set on `<html>`
4. When switching back to Ubuntu, the Google Fonts `<link>` tag is removed

### Font Scale

The font scale slider adjusts `font-size` on `<html>` from **70%** to **130%** (step: 5%). Since all elements use `rem` units, this scales the entire UI proportionally.

---

## Theme Presets

18 curated presets are included:

| Name | Header Color | Features |
|------|-------------|----------|
| Default | `#1E7295` | Original Nitro theme |
| Ocean | `#0077B6` | Deep blue tones |
| Forest | `#2D6A4F` | Green nature tones |
| Sunset | `#E76F51` | Warm orange/red |
| Royal | `#7B2CBF` | Purple royalty |
| Midnight | `#1B1B2F` | Ultra-dark |
| Cherry | `#C1121F` | Deep red |
| Gold | `#B8860B` | Luxurious gold |
| Slate | `#475569` | Professional gray |
| Candy | `#FF69B4` | Pink candy |
| Emerald | `#059669` | Rich emerald green |
| Volcano | `#DC2626` | Fiery red |
| Neon | `#00F5D4` | Neon cyan + glassmorphism |
| Arctic | `#A8DADC` | Ice blue tones |
| Glass | `#1E7295` | Default colors + glassmorphism |
| Sakura | `#FFB7C5` | Japanese cherry blossom pink |
| Cyberpunk | `#F72585` | Neon pink + glassmorphism |
| Earth | `#8B6F47` | Natural brown tones |

Each preset sets: `headerColor`, `toolbarColor`, `darkPanelColor`, `ctxBgColor`, and optionally `glassMode`.

---

## Import / Export

### Export
Themes are exported as **base64-encoded JSON** copied to clipboard:

```
eyJjb2xvck1vZGUiOiJjb2xvciIsImhlYWRlckNvbG9yIjoiIzFFNzI5NSIsLi4ufQ==
```

### Import
Paste the base64 code (or raw JSON) into the import field. The system tries base64 first, then falls back to raw JSON.

### JSON structure

```json
{
    "colorMode": "color",
    "headerColor": "#1E7295",
    "headerImageUrl": "",
    "headerAlpha": 100,
    "toolbarColor": "#1c1c20",
    "darkPanelColor": "#212131",
    "ctxBgColor": "#1c323f",
    "borderRadius": 4,
    "glassMode": false,
    "fontFamily": "Ubuntu",
    "fontScale": 100
}
```

---

## Server-Side Sync (WebSocket)

### Client behavior

The client attempts server sync automatically. If the renderer does not have the required Composer/Event classes, it falls back to localStorage-only with no errors.

**Flow:**
1. On mount: sends `UiSettingsLoadComposer` to request settings from server
2. Listens for `UiSettingsDataEvent` to receive settings JSON
3. On change: saves to localStorage immediately, then syncs to server with 1s debounce via `UiSettingsSaveComposer`

### Required Renderer classes

These must be added to `@nitrots/nitro-renderer` (the `Nitro_Render_V3` repository):

#### `UiSettingsLoadComposer`
- **Direction:** Client → Server (outgoing)
- **Packet header:** `10048` (configurable in packet headers config)
- **Parameters:** none

#### `UiSettingsSaveComposer`
- **Direction:** Client → Server (outgoing)
- **Packet header:** `10047` (configurable in packet headers config)
- **Parameters:** `settingsJson: string` (JSON string of full IUiSettings)

#### `UiSettingsDataEvent` / `UiSettingsDataParser`
- **Direction:** Server → Client (incoming)
- **Packet header:** configured in incoming headers
- **Parsed fields:** `settingsJson: string`

### Required Emulator changes (Arcturus / Java)

#### Database migration

Add a column to the existing `users` table:

```sql
ALTER TABLE `users`
    ADD COLUMN `ui_settings` TEXT NOT NULL DEFAULT '{}' AFTER `extra_rank`;
```

> **Note:** Adjust the `AFTER` clause to place the column where it makes sense in your schema. The column stores the full JSON string of `IUiSettings`.

#### Incoming packet handlers

**`UiSettingsLoadEvent` (header 10048):**
1. Get `user_id` from session
2. Query `SELECT ui_settings FROM users WHERE id = ?`
3. Respond with `UiSettingsDataComposer(uiSettings)`

**`UiSettingsSaveEvent` (header 10047):**
1. Get `user_id` from session
2. Read `settingsJson` string from packet
3. Validate JSON length (max 4096 chars recommended)
4. `UPDATE users SET ui_settings = ? WHERE id = ?`
5. No response needed (fire-and-forget)

#### Outgoing packet composer

**`UiSettingsDataComposer`:**
- Writes `settingsJson` as a string to the packet

---

## Adding New Themed Elements

To add theming support to a new element:

### Option A: Tailwind arbitrary value (in TSX components)

Replace hardcoded colors with CSS variable references:

```tsx
// Before
'bg-[#1e7295]'

// After
'bg-[var(--theme-primary,#1e7295)]'
```

The fallback value after the comma ensures zero visual change when no theme is active.

### Option B: CSS class override (in .css files)

Replace hardcoded colors with CSS variable references:

```css
/* Before */
.my-element {
    background: #212131;
}

/* After */
.my-element {
    background: var(--theme-dark-panel, #212131);
}
```

### Option C: New CSS variable

If existing variables don't cover your use case:

1. Add the variable to `applyThemeToDOM()` in `UiSettingsContext.tsx`
2. Add it to the removal list in the `default` mode branch
3. Add the property to `IUiSettings` if user-configurable
4. Use it with a fallback: `var(--theme-my-new-var, #default)`
5. Add the transition in `index.css` if animated changes are desired

### Adding transition support

Add the element's selector to the transition list in `index.css`:

```css
.bg-card-header,
.bg-card-tabs,
.my-new-element {  /* ← add here */
    transition: background-color 0.3s ease, border-color 0.3s ease;
}
```

---

## Glassmorphism Mode

When `glassMode: true`, the class `theme-glass` is added to `<html>`. CSS rules in `index.css` then apply:

```css
.theme-glass .bg-card-header,
.theme-glass .bg-card-tabs {
    backdrop-filter: blur(12px);
}

.theme-glass .nitro-infostand,
.theme-glass .nitro-room-tools {
    backdrop-filter: blur(12px);
    background-color: color-mix(in srgb, var(--theme-dark-panel) 75%, transparent) !important;
}
```

To add glassmorphism to a new element, add a `.theme-glass .your-element` rule in the same section.

---

## File Structure

```
src/
├── api/
│   └── ui-settings/
│       ├── IUiSettings.ts          # Types, defaults, presets, font list
│       ├── UiSettingsContext.tsx    # Provider, DOM application, WebSocket sync
│       └── index.ts                # Barrel export
├── components/
│   └── interface-settings/
│       ├── InterfaceColorTabView.tsx  # Color picker, presets, font, actions
│       └── InterfaceImageTabView.tsx  # Header image grid selector
├── css/
│   ├── index.css                   # CSS variables, glassmorphism, transitions
│   ├── common/Buttons.css          # Themed .btn-primary, .btn-dark
│   ├── nitrocard/NitroCardView.css # Themed .nitro-card-header
│   ├── purse/PurseView.css         # Themed purse elements
│   ├── room/InfoStand.css          # Themed .nitro-infostand
│   ├── room/RoomWidgets.css        # Themed room tools
│   └── slider.css                  # Themed slider track
└── common/
    ├── Button.tsx                  # Themed primary/dark/gray variants
    ├── Text.tsx                    # Themed primary text color
    ├── card/
    │   ├── NitroCardHeaderView.tsx # Image mode support
    │   └── tabs/NitroCardTabsView.tsx # Auto-themed via .bg-card-tabs
    └── layout/
        └── LayoutProgressBar.tsx   # Themed progress bar
```
