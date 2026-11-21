# CLAUDE.md

Este repositorio contiene dos cosas independientes:

- **Sitio web de Nexia Lab Pro** (raíz): HTML estático (`index.html`, `servicios.html`, `la-serena.html`, `casos.html`, `ecosistema.html`, `blog/`, `assets/`). No tiene build.
- **Nexia Swarm** (`swarm/`): enjambre de agentes en TypeScript que crea y lanza productos digitales. Sus reglas, comandos y arquitectura están en [`swarm/CLAUDE.md`](swarm/CLAUDE.md).

No mezcles cambios entre ambos: el enjambre escribe solo dentro de `swarm/output/` y nunca modifica el sitio.
