# Custom Fonts for King Law Firm

## Required Fonts

### 1. Junction Regular (Body Text)
- **Source**: https://www.theleagueofmoveabletype.com/junction
- **Files needed**: 
  - Junction-regular.woff2
  - Junction-regular.woff
- **Usage**: Body text throughout the site

### 2. Goudy Bookletter 1911 (Titles/Headlines)
- **Source**: https://www.theleagueofmoveabletype.com/goudy-bookletter-1911
- **Files needed**:
  - GoudyBookletter1911.woff2
  - GoudyBookletter1911.woff
- **Usage**: All h1, h2, h3, h4, h5, h6 tags

### 3. League Script (Quotes/Special Text)
- **Source**: https://www.theleagueofmoveabletype.com/league-script
- **Files needed**:
  - LeagueScript-Regular.woff2
  - LeagueScript-Regular.woff
- **Usage**: Pull quotes, testimonials, special emphasis

## Installation Instructions

1. Download all three font families from The League of Moveable Type
2. Convert to WOFF2 and WOFF formats if needed (use https://transfonter.org/)
3. Place font files in this directory (`/static/fonts/`)
4. Fonts are already configured in `/src/app.css` with @font-face declarations
5. Tailwind classes available:
   - `font-body` - Junction Regular
   - `font-title` - Goudy Bookletter 1911
   - `font-quote` - League Script

## Fallback Fonts

If custom fonts fail to load:
- **Body**: Falls back to system-ui, sans-serif
- **Title**: Falls back to Georgia, serif
- **Quote**: Falls back to cursive

## Font Display Strategy

Using `font-display: swap` for optimal performance - text will display in fallback font until custom fonts are loaded.
