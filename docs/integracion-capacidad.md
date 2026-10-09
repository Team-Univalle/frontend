# Integración de capacidad diaria y reprogramación

- GET /daily-limit consulta el límite personal; PUT /daily-limit persiste un entero de 1 a 16. No se permiten decimales. El default de 6 se asigna en Backend, no en el navegador.
- GET /conflicts?date=AAAA-MM-DD muestra carga actual. Con subtask_id, estimated_hours y status evalúa la propuesta, excluyendo la propia tarea, ejecutadas y otros usuarios. Devuelve conflict, planned_hours, task_hours, total_hours, daily_limit, excess, message y suggested_dates.
- La regla total <= límite pertenece al servidor. Una respuesta incompleta o contradictoria muestra error, sin éxito ni PATCH.
- PATCH /subtasks/ID revalida dentro de una transacción por organizador; 409 devuelve error global con code=overload_conflict y conflict. Esto cubre cambios concurrentes después de consultar disponibilidad.
- El modal compartido por Detalle y Hoy conserva fecha/horas ante error, bloquea doble envío, permite mover o reducir, muestra cantidades del servidor y mantiene título/estado no editados.
- Cancelar/Escape/cerrar no envía PATCH, restaura el foco y no marca Pospuesta. Solo el botón explícito Posponer cambia ese estado; no elimina su carga.
- Tras éxito se reconsulta detalle y /today mediante planning:updated, sin F5. Filtros de Hoy se guardan por id de usuario.
- Horas: valor finito >0, máximo 999.99 y dos decimales. Fechas válidas desde hoy hasta la fecha del evento.

## Verificación reproducible

Frontend: `node --test tests/*.test.mjs`, `npm run lint`, `npm run build`.
Backend: `python manage.py test` usa SQLite temporal, sin modificar Supabase.
Para QA integrada local: ver README del backend y sus settings QA. Cuentas/datos sintéticos separados de producción. Las capturas y resultados del informe identifican el entorno probado.
