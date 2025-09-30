# Playwright Testing Guide

## Problem: Multiple Browser Instances / about:blank tabs

Dette skjer når Playwright MCP server allerede har en browser-instans kjørende og nye forsøk på å starte Playwright feiler.

## Forebyggende tiltak

### 1. Sjekk alltid om Playwright kjører først
```bash
# Sjekk for eksisterende Playwright-prosesser
ps aux | grep -i playwright | grep -v grep
```

### 2. Rydd opp før testing
```bash
# Drep alle Playwright browser-prosesser
pkill -f "chromium.*playwright" || true

# Eller mer spesifikt for Chrome
pkill -f "Google Chrome.*playwright" || true
```

### 3. Sjekk at dev server kjører
```bash
# Alltid sjekk først at serveren er tilgjengelig
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

## Når problemet oppstår

### Symptomer:
- Mange faner med `about:blank`
- Feilmelding: "Browser is already in use for /Users/.../ms-playwright/mcp-chrome-..."
- Browser åpner men navigerer ikke til riktig URL

### Løsning:
1. **Lukk alle browser-faner** som ble åpnet av Playwright
2. **Drep prosessene**:
   ```bash
   pkill -f "chromium.*playwright"
   pkill -f "Google Chrome.*playwright"
   ```
3. **Vent litt** (2-3 sekunder) før ny test
4. **Start på nytt**

## Alternativ: Manuell testing

Når Playwright ikke fungerer, test manuelt:
1. Åpne vanlig browser (ikke Playwright)
2. Gå til http://localhost:3000
3. Test funksjonaliteten manuelt
4. Sjekk Console i DevTools for feilmeldinger

## Claude Code Playwright Tips

### Før testing med Playwright:
1. Be Claude sjekke om dev server kjører
2. Be Claude sjekke om Playwright allerede kjører
3. Be Claude lukke eksisterende Playwright-instanser først

### Eksempel forespørsel:
```
"Test login-funksjonaliteten med Playwright.
Sjekk først at serveren kjører og lukk eventuelle eksisterende Playwright-instanser."
```

## Debugging Playwright-problemer

### Se hvilke porter som brukes:
```bash
lsof -i :3000  # Dev server
lsof -i :55714 # Typisk Playwright debugging port
```

### Se alle Chrome-prosesser:
```bash
ps aux | grep "Google Chrome"
```

### Rydd opp Playwright cache (hvis nødvendig):
```bash
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*
```

## Beste praksis for Claude Code

1. **Alltid sjekk server først**
2. **Lukk gamle instanser før nye tester**
3. **Bruk manuell testing som backup**
4. **Ikke start flere Playwright-tester samtidig**
5. **Vent på at én test er ferdig før neste**

## Quick Fix Script

Lagre dette som `fix-playwright.sh`:
```bash
#!/bin/bash
echo "Fikser Playwright..."
pkill -f "chromium.*playwright" || true
pkill -f "Google Chrome.*playwright" || true
sleep 2
echo "Playwright prosesser lukket. Klar for ny test."
```

Gjør executable: `chmod +x fix-playwright.sh`
Kjør når problem oppstår: `./fix-playwright.sh`