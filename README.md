# SMS Format (Web) — Aplicación de Formateo de Números Telefónicos

SMS Format es una aplicación web moderna y elegante (HTML/CSS/JS puro) que normaliza y formatea números telefónicos con una interfaz visual exquisita. Parte del ecosistema HorekuOs, esta versión web ofrece una experiencia fluida y responsiva con microinteracciones y animaciones que hacen que formatear números sea intuitivo y agradable.

---

## Características Principales

### Funcionalidad Core
- **Procesamiento flexible**: Acepta números individuales y listas (separadores: nueva línea, coma, punto y coma, pipe o espacios).
- **Entrada versátil**: Soporta `+`, `00`, paréntesis, guiones y espacios — la app se encarga de limpiar todo.
- **Dos modos de salida**:
  - **+only**: Limpia y antepone `+` a cada número (`+584263683714`).
  - **+formatted**: Detecta el indicativo de país y agrupa la parte local de forma legible (`+58 426 368 3714`).
- **Formatos de exportación**:
  - Copiar al portapapeles (individual o en lote).
  - Descargar como archivo `.txt` en múltiples formatos (solo +, formateado, enumerado, enlistado).

### Experiencia de Usuario
- **Interfaz moderna**: Diseño oscuro/futurista con gradientes, glassmorphism y efectos visuales sofisticados.
- **Microinteracciones**: Ripple effects, animaciones de entrada, transiciones suaves y feedback visual en cada acción.
- **Responsivo**: Optimizado para escritorio, tablet y móvil con layouts adaptativos.
- **Accesibilidad**: Navegación por teclado, focus visible, aria-labels y contraste adecuado.
- **Botón de pegar rápido**: Pega directamente desde el portapapeles del usuario con un solo clic.
- **Indicadores visuales**: Checkmarks animados en resultados válidos, contador de estadísticas en tiempo real.

### Detalles de Diseño
- Paleta de colores púrpura/cian con efectos de brillo y sombra.
- Animaciones de partículas de fondo para mayor profundidad.
- Botón rainbow animado para acceder al repositorio en GitHub.
- Modo oscuro nativo adaptado al tema del sistema.
- Tipografía clara (Inter) con jerarquía visual bien definida.

---

## 📁 Estructura del Proyecto

```
sms-format-web/
├── index.html              # Interfaz de usuario
├── src/
│   ├── components/
│   │   ├── style.css       # Estilos (CSS puro, sin frameworks)
│   │   └── script.js       # Lógica de formateo y UX
│   └── icon.svg            # Logo de la aplicación
├── package.json            # Metadatos del proyecto
└── README.md               # Este archivo
```

---

## Instalación y Uso

### Local (sin servidor)
1. Clona el repositorio:
   ```bash
   git clone https://github.com/Syllkom/sms-format-web.git
   cd sms-format-web
   ```
2. Abre `index.html` en tu navegador (doble clic o arrastra al navegador).
3. ¡Listo! No requiere dependencias ni servidor.

### Uso en línea
Accede a la versión desplegada (si está disponible) y comienza a formatear números al instante.

---

## Ejemplos de Uso

### Entrada aceptada
```
584263683714
+51907182818
0044 7700 900123
(580) 426-366-3714
584266055913, 584261554735
```

### Salida formateada
```
+58 426 368 3714
+51 990 718 2818
+44 7700 900123
+1 (580) 426-3714
+58 426 605 5913
+58 426 215 5473
```

### Opciones de exportación
- **+ sólo**: Solo el número con `+` (ideal para listas simples).
- **+ formateado**: Número formateado con espacios (legible).
- **Enumerado**: Números con índice (#1, #2, etc.).
- **Enlistado**: Formato CSV (número formateado, número sin formato).

---

## Características Visuales

### Diseño
- **Glassmorphism**: Tarjetas con efecto de vidrio esmerilado.
- **Gradientes animados**: Fondos con gradientes radiales y lineales.
- **Partículas de fondo**: Animación sutil de partículas flotantes.
- **Efectos de hover**: Elevación, cambio de color y transiciones suaves.

### Interactividad
- **Ripple effect**: Ondas de clic en botones.
- **Toast notifications**: Mensajes flotantes para feedback.
- **Stagger animations**: Entrada escalonada de resultados.
- **Indicadores activos**: Punto brillante en el modo seleccionado.

---

## Tecnología

- **HTML5**: Semántica y accesibilidad.
- **CSS3 puro**: Sin frameworks (Tailwind, Bootstrap, etc.). Animaciones, gradientes, media queries.
- **JavaScript vanilla**: Sin dependencias externas. Lógica de parsing, formateo, clipboard API.
- **Iconografía**: Material Symbols (Google Fonts).
- **Tipografía**: Inter (Google Fonts).

---

## Limitaciones Técnicas

- La detección del código de país usa:
  - Una lista de ~100 códigos comunes (no exhaustiva).
  - Heurística por longitud (intenta dejar 7–10 dígitos para la parte local).
- El agrupado local sigue reglas simples:
  - 10 dígitos → 3-3-4
  - 9 dígitos → 3-3-3
  - 8 dígitos → 4-4
  - Otros → grupos de 3
- Es un prototipo funcional; para producción se recomienda:
  - Usar una base de datos completa de códigos de país (libphonenumber, etc.).
  - Validar con estándares E.164.
  - Añadir tests unitarios.
  - Implementar manejo robusto de errores.

---

## 🚀 Mejoras Futuras Sugeridas

- [ ] Integración con libphonenumber.js para validación más precisa.
- [ ] Exportación a CSV/XLSX.
- [ ] Modo claro/oscuro con toggle.
- [ ] Historial de búsquedas recientes.
- [ ] Soporte multi-idioma (i18n).
- [ ] Tests unitarios (Jest/Vitest).
- [ ] API REST para procesamiento en lote desde backend.

---

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas mejorar SMS Format:

1. **Abre una issue** describiendo tu propuesta o reporte de bug.
2. **Crea un fork** del repositorio.
3. **Envía un PR** con cambios claros y documentados.
4. **Mantén el estilo**: Código limpio, comentarios donde sea necesario, sin dependencias externas.

---

## Licencia

Este proyecto es parte del ecosistema HorekuOs. Consulta el archivo `LICENSE` (si existe) para más detalles.

---

## Autor

**Syllkom** — Creador y mantenedor de SMS Format.

---

## Apoya el Proyecto

Si te gusta SMS Format, considera:
- ⭐ Darle una estrella en GitHub.
- 🔗 Compartirlo con otros desarrolladores.
- 💬 Dejar feedback o sugerencias.
- 🐛 Reportar bugs si encuentras alguno.
