/* ===== Marca (placeholder) — cambia aquí y se aplica a todos los [data-brand] ===== */
window.SITE = { brand: 'Ciphera', tagline: 'Ciber Store', currency: 'EUR', freeShipping: 99 };
document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = window.SITE.brand; if (el.dataset.text) el.dataset.text = window.SITE.brand; });
document.title = document.title.replace(/^[^·]+/, window.SITE.brand + ' ');
