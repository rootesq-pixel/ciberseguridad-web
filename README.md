# Ciphera — Web de ciberseguridad (demo estática)

Abrir: servir la carpeta con cualquier servidor estático (p. ej. `python3 -m http.server 8080`) y visitar http://localhost:8080
(los módulos JS requieren http://, no file://).

## Renombrar la marca
- `js/config.js` → `SITE.brand` (cambia todos los `[data-brand]`).
- `index.html` → `<title>`, meta description, email `hola@ciphera.example`, y el texto "ciphera-soc" de la consola.

## Contenido de ejemplo (sustituir)
Teléfono, email, dirección, testimonios, cifras, mapa de amenazas y logs del SOC son SIMULADOS.

## Dependencias (CDN)
GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Three.js 0.160.0, Google Fonts (Space Grotesk, JetBrains Mono).
El formulario es solo front-end (no envía nada): conectar a un backend/Formspree/etc.
