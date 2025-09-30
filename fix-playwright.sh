#!/bin/bash

echo "🔧 Fikser Playwright-problemer..."
echo ""

# Sjekk om det finnes Playwright-prosesser
echo "📋 Sjekker for eksisterende Playwright-prosesser..."
PLAYWRIGHT_PROCS=$(ps aux | grep -i playwright | grep -v grep | wc -l)

if [ $PLAYWRIGHT_PROCS -gt 0 ]; then
    echo "⚠️  Fant $PLAYWRIGHT_PROCS Playwright-relaterte prosesser"
    echo "🛑 Lukker alle Playwright browser-prosesser..."

    # Drep Chrome/Chromium Playwright-prosesser
    pkill -f "chromium.*playwright" 2>/dev/null || true
    pkill -f "Google Chrome.*playwright" 2>/dev/null || true

    # Vent litt for at prosessene skal avsluttes
    sleep 2

    echo "✅ Playwright-prosesser lukket"
else
    echo "✅ Ingen Playwright-prosesser funnet"
fi

echo ""

# Sjekk om dev server kjører
echo "🌐 Sjekker om dev server kjører..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Dev server kjører på http://localhost:3000"
else
    echo "⚠️  Dev server svarer ikke på port 3000"
    echo "   Kjør: npm run dev"
fi

echo ""

# Sjekk om Amplify sandbox kjører
echo "☁️  Sjekker Amplify sandbox..."
SANDBOX_PROCS=$(ps aux | grep "ampx sandbox" | grep -v grep | wc -l)

if [ $SANDBOX_PROCS -gt 0 ]; then
    echo "✅ Amplify sandbox kjører"
else
    echo "⚠️  Amplify sandbox kjører ikke"
    echo "   Kjør: npx ampx sandbox"
fi

echo ""
echo "🎉 Klar for ny Playwright-test!"
echo ""
echo "Tips: Test manuelt på http://localhost:3000 hvis Playwright fortsatt ikke fungerer"