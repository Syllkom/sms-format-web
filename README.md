# SMS Format (Web) — Proyecto independiente

SMS Format es una pequeña aplicación web (nativa: HTML/CSS/JS) que forma parte del ecosistema HorekuOs.  
Este repositorio contiene la versión funcional en navegador de la lógica del plugin SMS del bot: normaliza números telefónicos individuales y listas, y genera dos salidas útiles:

- Versión “+ only”: simplemente limpia y antepone el símbolo `+` a cada número.
- Versión “+ formatted”: detecta el indicativo de país (heurística con lista de códigos comunes) y formatea la parte local en bloques legibles (p. ej. `+57 311 3825327`).

Importante: este proyecto es un prototipo rápido pensado para ser funcional y demostrativo. El código está comentado para facilitar la lectura y futuras mejoras. No pretende ser una implementación lista para producción — está pensado como base para evolucionar.

---

## Características principales

- Procesa entradas individuales y listas (separadores: nueva línea, coma, punto y coma, pipe o espacios).
- Soporta entradas con `+`, `00`, paréntesis, guiones y espacios.
- Genera dos salidas:
  - `+<digits>` (versión rápida).
  - `+<CC> <parte local agrupada>` (versión formateada).
- Copiar al portapapeles y descargar resultados (ambas versiones).
- Interfaz responsiva pensada para escritorio y móvil.
- Código comentado y fácil de entender para desarrollos posteriores.

---

## Contenido del repositorio (sugerido)

- `index.html` — Interfaz de usuario (HTML).
- `style.css` — Estilos visuales (diseño oscuro/futurista; responsive).
- `script.js` — Lógica de parsing, formateo, copiar y descarga.
- `src/icon` — Ruta sugerida para tu logo (sustituir por la imagen real).
- `README.md` — Este archivo.

> Nota: Si migras estos archivos desde el proyecto del bot, mantén la carpeta `components` con tu icono o ajusta la ruta en `index.html`.

---

## Instalación / Uso local

1. Clona el repositorio (nuevo) o crea una carpeta local.
2. Coloca los archivos `index.html`, `style.css` y `script.js` en la raíz del proyecto.
3. Opcional: añade tu logo en `src/icon` (puede ser `/src/icon.png` o similar — ajusta `index.html`).
4. Abre `index.html` en el navegador (doble click o arrastrar al navegador).
5. Pega números en el textarea y pulsa “Formatear”. Usa los botones para copiar o descargar cada versión.

No requiere servidor ni dependencias; es completamente estático.

---

## Ejemplos de entrada aceptada

- 584263683714
- +51907182818
- 0044 7700 900123
- (580) 426-366-3714
- Lista (multi-line):
  ```
  584263683714
  584266055913,584261554735
  +51907182818
  ```

---

## Limitaciones y notas técnicas

- La detección del código de país usa una combinación de:
  - una lista de códigos conocidos (no exhaustiva), y
  - heurística por longitud (intenta dejar la parte local en 7–10 dígitos).
- El agrupado local sigue reglas simples (10 → 3-3-4, 9 → 3-3-3, 8 → 4-4, otras → grupos de 3).
- Es un prototipo: la lógica es intencionadamente simple y comentada. Para producción se recomienda:
  - usar una base completa y actualizada de códigos de país (lib/DB),
  - validar con librerías o reglas oficiales (E.164),
  - añadir tests y manejo de errores más robusto,
  - internacionalización (i18n) si se requiere multi-idioma.

---

## Futuras mejoras sugeridas

- Reemplazar la heurística por una lista completa de indicativos (y/o utilizar una API).
- Añadir pruebas unitarias (Jest / Vitest) sobre la función de parsing/formateo.
- Permitir exportar en formatos CSV/XLSX.
- Añadir modo dark/light y control de accesibilidad (contrastes, tamaños, Aria labels).
- Conectar con el bot: exponer una pequeña API para procesar lotes desde el backend.

---

## Contribuciones

Este proyecto está pensado como un prototipo. Si deseas contribuir:

1. Abre una issue describiendo la propuesta.
2. Crea un fork y envía un PR con cambios pequeños y documentados.
3. Mantén el estilo del código comentado y añade tests para cambios en la lógica.

## Demo: https://syllkom.github.io/sms-format-web/
