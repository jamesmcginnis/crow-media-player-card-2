# Crow Media Player Card 2

A sleek, modern media player card for Home Assistant with iOS-inspired design, multi-device support, and intuitive controls.

![Crow Media Player Card](Image1.png)

## ✨ Features

- **🎨 Beautiful iOS-Inspired Design** - Glassmorphic card with blur effects and smooth animations
- **📱 Dual View Modes** - Toggle between full card and compact mini-player views
- **🔄 Auto-Switching** - Automatically switches to the currently playing device
- **🎵 Multiple Device Support** - Manage multiple media players from a single card
- **↕️ Drag & Drop Reordering** - Easily reorder your media players in the visual editor
- **🎨 Customizable Accents** - Separate color customization for main accent and volume slider
- **📱 Mobile-Optimized** - Touch-friendly with smooth interactions and gestures
- **⏯️ Full Playback Controls** - Play/pause, skip, shuffle, repeat, and volume control
- **📊 Live Progress Bar** - Real-time playback progress with seek support
- **🖼️ Album Art Display** - Shows album artwork or device-specific icons

## 📸 Screenshots

### Full View
![Full Card View](Image1.png)

### Compact View
![Compact Mini-Player](Image2.png)

### Visual Editor
![Easy Configuration](Image3.png)

## 🚀 Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Click on "Frontend"
3. Click the "+" button
4. Search for "Crow Media Player Card 2"
5. Click "Install"
6. Restart Home Assistant

### Manual Installation

1. Download `crow-media-player-card-2.js` from the latest release
2. Copy it to your `config/www` folder
3. Add the following to your `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/crow-media-player-card-2.js
      type: module
```

4. Restart Home Assistant

## ⚙️ Configuration

### Visual Editor

This card includes a full visual editor! Simply add the card through the UI and configure it using the intuitive interface:

- **Main Accent Color** - Primary color for progress bar and active states
- **Volume Accent Color** - Color for the volume slider
- **Auto Switch Entities** - Toggle automatic switching to playing devices
- **Manage & Reorder Media Players** - Drag and drop to reorder, check/uncheck to add/remove

### YAML Configuration

You can also configure the card via YAML:

```yaml
type: custom:crow-media-player-card-2
entities:
  - media_player.living_room_speaker
  - media_player.bedroom_tv
  - media_player.kitchen_echo
accent_color: '#007AFF'
volume_accent: '#FF6B00'
auto_switch: true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entities` | list | **Required** | List of media_player entity IDs |
| `accent_color` | string | `#007AFF` | Main accent color (hex) |
| `volume_accent` | string | `#007AFF` | Volume slider color (hex) |
| `auto_switch` | boolean | `true` | Auto-switch to playing device |

## 🎯 Usage

### View Modes

- **Full Card Mode** - Shows large album art, full controls, and device selector
- **Compact Mode** - Minimal view with inline controls and volume slider
- Click the expand/collapse button in the top-right to toggle modes

### Controls

- **Play/Pause** - Click the center play button
- **Skip Tracks** - Use previous/next buttons
- **Shuffle & Repeat** - Toggle using the control buttons (highlighted when active)
- **Volume** - Adjust using the slider (inline in compact mode)
- **Seek** - Click anywhere on the progress bar to jump to that position
- **Switch Devices** - Use the dropdown selector or enable auto-switch
- **More Info** - Click on album art to open the media player's more-info dialog

### Auto-Switch Feature

When enabled, the card automatically switches to whichever device starts playing. Manual selection overrides auto-switch until another device starts playing.

## 🔧 Advanced

### Customization

The card uses CSS custom properties for colors:

```css
--accent: Main accent color
--vol-accent: Volume slider color
```

### Supported Media Players

Works with any Home Assistant media player that supports:
- `media_play_pause`
- `media_next_track` / `media_previous_track`
- `shuffle_set` / `repeat_set`
- `volume_set`
- `media_seek`

Tested with:
- ✅ Spotify
- ✅ Amazon Echo/Alexa
- ✅ Google Cast
- ✅ Apple TV
- ✅ Sonos
- ✅ DLNA/UPnP devices

## 🐛 Troubleshooting

**Card not appearing?**
- Ensure the resource is loaded in your Lovelace configuration
- Clear browser cache (Ctrl+F5 / Cmd+Shift+R)
- Check browser console for errors

**Auto-switch not working?**
- Verify `auto_switch: true` in configuration
- Some players may need entity polling enabled

**Album art not showing?**
- Check if your media player provides `entity_picture` attribute
- Fallback device icons will display if no artwork available

## 📝 Changelog

### Version 2.0
- Added visual configuration editor
- Drag & drop entity reordering
- Separate volume accent color
- Improved mobile touch support
- Press glow effects on buttons
- Enhanced compact mode with inline volume
- Better connection safety and polling
- Bug fixes and performance improvements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use and modify as needed.

## 💬 Support

If you encounter issues or have feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Include Home Assistant version and browser info

## ⭐ Show Your Support

If you like this card, please give it a star on GitHub!

---

Made with ❤️ for the Home Assistant community
