#!/bin/sh
# Screenshot a dev route: scripts/shot.sh <route> <out.png> [width] [height]
# Widths under 500 are rendered in an iframe, because Chrome's headless
# window has a minimum width and would otherwise lay the page out wider.
CH="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
W="${3:-1440}"; H="${4:-900}"; URL="http://localhost:5173$1"
if [ "$W" -lt 500 ]; then
  WRAP="$(mktemp -d)/frame.html"
  printf '<body style="margin:0;background:#0c0d10"><iframe src="%s" width="%s" height="%s" style="border:0"></iframe>' "$URL" "$W" "$H" > "$WRAP"
  URL="file://$WRAP"; WW=500
else
  WW="$W"
fi
"$CH" --headless=new --disable-gpu --hide-scrollbars --window-size="$WW,$H" \
  --virtual-time-budget=10000 --screenshot="$2" "$URL" >/dev/null 2>&1
