# Shortcut Animation Generator

A lightweight keyboard shortcut animation generator and embeddable widget.

## Features
- Virtual keyboard renderer for Mac and Windows layouts
- Record key sequences or manually input them
- Generates autoplay shortcut animations
- Export as embeddable widget (HTML snippet)
- OS adaptive (Mac / Windows)

## Usage
You can use the prebuilt embed widget via CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/JoeyXi/shortcut-anim@v0.1.0/dist/kbd-mini.css">
<script src="https://cdn.jsdelivr.net/gh/JoeyXi/shortcut-anim@v0.1.0/dist/kbd-mini.js"></script>
<div class="kbd-mini" data-os="mac" data-seq="control,shift,s"></div>
```

## Development
Clone and run locally:

```bash
git clone https://github.com/JoeyXi/shortcut-anim.git
cd shortcut-anim
open apps/generator/index.html
```

## License
MIT
