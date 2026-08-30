# 📖 Manual de Usuario y Guía Operacional (COE La Guaira)

Guía paso a paso para el uso operativo de la **App de Mapas** en el Centro de Operaciones de Emergencia, Protección Civil y Bomberos.

---

## 1. 🧭 Navegación y Vistas del Mapa

### Selección del Mapa Base
En la barra de herramientas superior derecha, haz clic en el icono de **Ajustes de Mapa** (⚙️) para alternar entre:
- **Google Satelital:** Imágenes satelitales nítidas y actualizadas.
- **ArcGIS Satelital:** Mosaicos cartográficos de ESRI.

### Selector de Fecha e Historial
- En la barra superior, utiliza el **Selector de Fecha** para consultar la situación de cualquier día pasado o el día actual.
- Al cambiar de fecha, todas las estadísticas, etiquetas flotantes y personal en el mapa se actualizan automáticamente al estado de ese día.
- **Modo Acumulado:** Permite consolidar la vista histórica completa de todos los días de la emergencia hasta la fecha seleccionada.

---

## 2. ✏️ Trazado y Edición de Sitios de Interés

### Barra de Herramientas de Dibujo (Izquierda)
- **📍 Punto:** Haz clic en el icono de punto y luego sobre el mapa para ubicar un sitio de interés (edificación, punto de rescate, campamento, centro de salud).
- **📐 Polígono (Sector):** Haz clic para delimitar un sector o área de búsqueda. Doble clic para finalizar.
- **📏 Línea:** Haz clic para trazar rutas de acceso o líneas de evacuación.

---

## 3. 📋 Registro de Bitácora Diaria del Punto / Sector

Al hacer clic en cualquier punto o polígono del mapa, se abrirá la **Ventana Emergente (Popup)**:

### A. Información y Estadísticas Generales
- **Nombre y Descripción:** Asigna el nombre oficial del sitio (ej. *"Residencias San Jorge"*).
- **Categorías Rápidas:**
  - 🏚️ *Estructura Colapsada* (indica cantidad estimada de afectados).
  - ⛺ *Campamento / Albergue* (capacidad y población).
  - 🏥 *Centro de Salud* (tipo de instalación médica).

### B. Grupos y Equipos de Trabajo Desplegados
- **Nombre del Grupo:** Ej. *"Grupo 2-B"*, *"Comisión USAR"*.
- **Oficiales:** Cantidad de efectivos presentes en el sitio.
- **Unidades / Vehículos:** Ej. *"Unidad 1534, Ambulancia 02"*.
- **Horarios y Estado de Llegada:** Marca la casilla de verificación cuando el equipo confirme su llegada al punto (el punto en el mapa se tornará con indicador verde).

### C. Actividades Personalizadas del Punto / Sector
- Permite registrar acciones específicas del día que no corresponden a un grupo en particular:
  - *Demolición controlada*, *Guardia preventiva*, *Inspección técnica*, *Despeje de vías*.
  - Las actividades personalizadas son **independientes por día** y quedan visibles en la etiqueta flotante del mapa.

### D. Novedades Cronológicas
- Registra eventos relevantes con su hora exacta (ej. *"14:30 — Se culmina apuntalamiento del ala este"*).

---

## 4. 🔀 Herramienta de Comparación "Antes y Después" (Swipe)

1. En la barra superior, activa el botón **Antes y Después** (↔️).
2. Se activará un deslizador central en la pantalla:
   - **Lado Izquierdo (Antes):** Muestra el terreno antes del impacto del evento adverso.
   - **Lado Derecho (Después):** Muestra la capa actual de **Google Satelital** o las escenas satelitales post-evento de alta resolución.
3. Arrastra el divisor horizontalmente para evaluar daños estructurales, deslizamientos o accesibilidad de vías.

---

## 5. 📊 Pizarra Operacional y Reportes Excel

### Pizarra Operacional
- Haz clic en el botón **Pizarra** para visualizar el resumen general de capacidades, despliegue de personal por REDAN/ZOEDAN y estado de los campamentos activos.

### Exportación a Excel y Reportes por Rango
- Accede a la vista `/consolidado` o al modal de **Reporte por Rango** para generar la matriz completa de operaciones en formato Excel (`.xlsx`) lista para minutas institucionales y partes de guardia.
