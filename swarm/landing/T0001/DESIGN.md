# DESIGN.md: landing de Pressure Washing Quote, Contract and Collection Kit

Dirección elegida sin ejemplos de UXKIN (no estaba conectado): criterio propio para un oficio de campo, sobrio y concreto. Se usa solo en esta landing; no afecta al sitio de Nexia Lab ni a otras tareas.

## Color (tokens en `:root`, versión oscura bajo `prefers-color-scheme`)
| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `--bg` | #F6F3EE | #12161C | fondo de página |
| `--surface` | #FFFFFF | #1B212A | tarjetas y bloques |
| `--ink` | #14181F | #EEF1F5 | texto principal |
| `--muted` | #4C5663 | #A9B3C0 | texto secundario (≥ 4.5:1) |
| `--line` | #D9D3C8 | #2D3644 | bordes |
| `--blue` | #0B3D91 | #8DB4FF | enlaces y títulos de apoyo |
| `--cta` | #C2410C | #E8590C | únicamente botones de compra |
| `--cta-ink` | #FFFFFF | #FFFFFF | texto del botón |

Un solo acento (naranja de seguridad) reservado al botón de compra, para que lo primero que se pulse sea siempre la compra.

## Tipografía
- Títulos: Archivo (700/800). Cuerpo: Inter (400/600). Google Fonts con `display=swap` y fallback del sistema.
- Escala: 14 / 16 / 18 / 22 / 28 / 40 / 56 px (fluida con `clamp`). Cuerpo ≥ 16 px, línea 1.6, medida ≤ 68ch.

## Espaciado y forma
- Base de 8 px (8, 16, 24, 32, 48, 72, 112). Ancho de contenido 1120 px.
- Radio 6 px (controles) y 12 px (tarjetas e imágenes). Sin sombras salvo foco.

## Componentes
- Botón principal: `--cta`, texto blanco, alto 52 px, foco visible de 3 px. Botón secundario: contorno `--ink`.
- Listas con numerales grandes en vez de tarjetas idénticas. Alterna lado de imagen entre secciones.

## Imágenes y video
- Fotografía generada, sin texto ni marcas. Hero: video en bucle mudo (se pausa con `prefers-reduced-motion`) sobre un velo oscuro para contraste. Cada imagen con `alt`, `width`, `height` y `loading="lazy"` salvo la del hero.
- Sin iconos decorativos ni emojis.
