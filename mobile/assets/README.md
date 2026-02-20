# App Assets

This folder should contain:

1. **icon.png** (1024x1024) - App icon
2. **splash.png** (1284x2778) - Splash screen
3. **adaptive-icon.png** (1024x1024) - Android adaptive icon

## Temporary Placeholders

For testing, you can create simple placeholder images:

### Using ImageMagick (if installed):
```bash
# Icon
convert -size 1024x1024 xc:#2563eb -gravity center -pointsize 200 -fill white -annotate +0+0 "NA" icon.png

# Splash
convert -size 1284x2778 xc:#2563eb -gravity center -pointsize 300 -fill white -annotate +0+0 "Nexus\nAttendo" splash.png

# Adaptive Icon
convert -size 1024x1024 xc:#2563eb -gravity center -pointsize 200 -fill white -annotate +0+0 "NA" adaptive-icon.png
```

### Using Online Tools:
1. Go to https://www.canva.com or https://www.figma.com
2. Create 1024x1024 image with blue background (#2563eb)
3. Add white text "NA" or "Nexus Attendo"
4. Export as PNG

### Quick Fix:
For now, the app will work without these files during development with Expo Go.
They are only required for building standalone APK.
