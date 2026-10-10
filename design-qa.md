# QA visual Sprint 3

Fuente: exports UX US-06, US-07, US-08 y US-12 de la carpeta suministrada por el equipo. No se inspeccionó el Figma vivo; las fechas/cargas de prueba difieren de los ejemplos estáticos.

Evidencia local: C:/Users/Ideapad/Documents/Codex/2026-09-21/clo/qa-sprint3. Comparación lado a lado: comparacion-conflicto.png y comparacion-resolver-reducir.png. Referencia normalizada a ancho de modal450 px; no se alteraron resultados HTTP ni capturas para inventar estados.

## Superficies verificadas

- Reprogramar: contexto de gestión/evento, fecha controlada y acciones Cancelar/Guardar.
- Conflicto: modal blanco, radio12, encabezado y alerta roja, desglose de cinco cantidades, alternativas Mover/Reducir/Posponer. Primario #4F46E5, texto y borde acompañan el color.
- Resolver: tarjetas Antes/Después, selección de alternativa en panel periwinkle, fecha y días sugeridos, campo compacto de horas, fórmula de capacidad del servidor. Se conservó la composición del export; no se introdujo una pantalla alternativa.
- Configuración: consulta al abrir, campo personal, ayuda/preview, error y reintento con valor conservado, éxito tras confirmación. A375 px modal351.2 px, documento375 px: sin desbordamiento.
- Estados: carga y acciones bloqueadas, éxito actualizado sin F5, error503 conservando la propuesta, vacío real con Crear evento y vacío por filtros.

## Revisión e iteración

Se sustituyó la edición inline por el modal compartido Detalle/Hoy; se corrigieron desbordamientos, paleta, panel seleccionado unido al campo, barra con segmentos gris/púrpura y divisores del desglose. La prueba de Escape devolvió el foco a Reprogramar. Inputs y alternativas quedan bloqueados al guardar; roles dialog/alertdialog y foco visible.

Las diferencias respecto al ejemplo estático son los datos reales de QA, el texto de reintento y las cantidades/sugerencias del servidor. No se certifica coincidencia pixel a pixel con un archivo Figma inaccesible, ni despliegue externo. El informe IxD conserva capturas y alcance de la revisión.

Verificación técnica final: 20 tests FE aprobados, lint sin errores y build correcto; backend34 tests. Evidencia de API real local y persistencia GET complementa la verificación visual.
