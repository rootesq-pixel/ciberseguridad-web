/* ===== Configuración rápida de marca =====
   Cambia SITE.brand y se actualiza en toda la web ([data-brand]).
   Recuerda cambiar también <title> y el email en index.html. */
window.SITE = { brand: 'Ciphera' };
document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = window.SITE.brand; if (el.dataset.text) el.dataset.text = window.SITE.brand; });
