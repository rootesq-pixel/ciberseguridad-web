# Ciphera Store — Tienda de ciberseguridad (demo estática)

Servir con cualquier servidor estático (`python3 -m http.server 8080`) y abrir http://localhost:8080
(los módulos JS necesitan http://, no file://). Funciona en subrutas (GitHub Pages): todas las rutas son relativas.

## Renombrar la marca
- `js/config.js` → `SITE.brand` (se aplica a todos los `[data-brand]`, al título y al grabado de la llave 3D).
- Email/teléfono de ejemplo en `index.html` (footer).

## Catálogo
`js/data.js`: productos, cursos y packs. TODO es contenido de ejemplo (precios, valoraciones, opiniones, instructor).

## Checkout
Solo demostración: no hay campos de pago ni envío de datos. Carrito y favoritos se guardan en localStorage.

## Dependencias (CDN)
Three.js 0.160 (+ addons), GSAP 3.12.5 (ScrollTrigger, Flip), Lenis 1.1.13, Google Fonts.
Sin WebGL o sin CDN de Three.js, el hero muestra una ilustración estática (img/key-fallback.svg).
