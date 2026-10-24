# Desprendible de Nómina

Página web para generar desprendibles de pago: pide nombre, cédula, cargo, fecha de pago, los días laborados (en un calendario), el valor del día y las horas extras, y arma el comprobante listo para imprimir o guardar en PDF.

## Archivos

- `index.html` — estructura de la página
- `style.css` — diseño (incluye formato de impresión)
- `script.js` — calendario y cálculos

## Cómo subirla a GitHub Pages

1. Entra a github.com y crea un repositorio nuevo (público), por ejemplo `desprendible-nomina`.
2. En el repositorio, clic en **Add file → Upload files** y arrastra los archivos `index.html`, `style.css`, `script.js` y `README.md` (sueltos, no dentro de otra carpeta).
3. Clic en **Commit changes**.
4. Ve a **Settings → Pages**.
5. En **Branch** elige `main` y la carpeta `/ (root)`, y clic en **Save**.
6. Espera uno o dos minutos; la página queda en `https://TU-USUARIO.github.io/desprendible-nomina/`.

## Uso

- Toca los días en el calendario para marcarlos; las flechas cambian de mes.
- El valor del día se puede escribir directo o calcular como salario pactado ÷ días pactados.
- Las horas extras se pagan como cantidad × valor de cada hora (el valor lo escribes tú).
- El botón **Imprimir / Guardar PDF** imprime solo el desprendible; en el diálogo elige "Guardar como PDF".
