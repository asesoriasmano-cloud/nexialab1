# assets/vendor

## react-19.3.1.min.js

React 19 ya no publica las versiones UMD que antes se cargaban desde unpkg (`react.development.js` / `react-dom.development.js`).
Este archivo las reemplaza: es React 19.3.1 + ReactDOM 19.3.1 en modo producción, empaquetados en un solo script que
expone `window.React` y `window.ReactDOM` (incluye `createRoot`). Así el sitio sigue funcionando **sin build** y
`assets/tweaks.jsx` / `assets/tweaks-panel.jsx` no necesitan cambios.

Se carga en `index.html`, `servicios.html`, `casos.html` y `la-serena.html`, antes de Babel.

### Cómo regenerarlo (por ejemplo, para subir de versión)

```bash
mkdir /tmp/react-vendor && cd /tmp/react-vendor
npm init -y && npm install react@19.3.1 react-dom@19.3.1 esbuild
cat > entry.js <<'EOF'
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
window.React = React;
window.ReactDOM = { ...ReactDOM, ...ReactDOMClient };
EOF
npx esbuild entry.js --bundle --minify --format=iife --target=es2018 \
  --define:process.env.NODE_ENV='"production"' --legal-comments=none \
  --outfile=react-19.3.1.min.js
```

Luego antepón el encabezado de licencia (ver el inicio del archivo actual), cópialo a `assets/vendor/`
y actualiza el nombre del archivo en las 4 páginas.
