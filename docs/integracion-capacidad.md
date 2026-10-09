# Integración frontend de capacidad diaria

## Contrato consumido

- GET /daily-limit devuelve `daily_limit_hours` (entero inclusivo 1–16).
- PATCH /daily-limit recibe `{ "daily_limit_hours": 4 }` y devuelve el valor persistido. Se usa PATCH porque es el método implementado en DailyLimitView; no se supone soporte PUT.
- GET /conflicts?date=AAAA-MM-DD consulta la carga ya guardada: `planned_hours` y `daily_limit` numéricos. Sidebar y Hoy muestran esos datos, no un total inventado de 0 ni un límite fijo.
- GET /conflicts?date=AAAA-MM-DD devuelve `conflict` booleano, `planned_hours` y `daily_limit` numéricos; puede incluir `message` y `options` cuando hay conflicto. Se utiliza tal como está implementado, sin enviar hours/exclude_subtask ni exigir campos adicionales. Si devuelve true se muestra el aviso con las horas actuales y el mensaje del servidor; si devuelve false se continúa al PATCH. Una respuesta que no incluya los tres campos requeridos conserva el formulario y muestra error/reintento.
- Si la evaluación permite guardar, se hace PATCH /subtasks/ID. Solo después de una respuesta exitosa se actualiza detalle, se reconsulta y se emite `planning:updated` para refrescar Hoy y capacidad. Cada entrada a Hoy consulta /today y conserva los filtros de sesión.

## Pendientes del Backend (no modificado)

El main revisado (0ac736b) tiene GET /conflicts, pero solo evalúa la carga existente. Por solicitud se consume este contrato actual. Una fecha con 5h/límite6 devuelve false incluso si se pretende mover otras2h: no se garantiza prevención de sobrecarga de la propuesta. Tampoco puede anticipar si reducir horas resolvería un día actualmente sobrecargado. Esta limitación no se sustituye con cálculo frontend. Para completar US-07/US-08, BE debe evaluar la propuesta y revalidar al persistir. El cálculo actual incluye ejecutadas: BE debe confirmar la regla de gestiones no ejecutadas.

La rama local de backend hoy (2bc1266) no contiene /daily-limit ni /conflicts; no cambiar ni mezclar ramas desde frontend. Ejecutar/desplegar el backend que tenga las API correspondientes y configurar VITE_API_URL para ese servidor.

## Pruebas

`node --test tests/planning.test.mjs`

Pruebas de contrato con respuestas simuladas: carga guardada7/límite6; igualdad6/6; ausencia de cálculo de horas propuestas; respuesta incompleta; error/reintento; horas finitas positivas, máximo999.99 y2 decimales; GET/PATCH de límite personal; rango entero1–16; carga guardada del servidor. No prueban persistencia real ni reemplazan pruebas BE.

Validación manual del contrato actual:

1. Configurar A=6 y B=4; recargar e iniciar sesión con cada cuenta. Confirmar GET personal y ausencia de valores de la sesión anterior.
2. Con7 horas ya guardadas y límite6, mostrar el aviso del servidor y no hacer PATCH mientras devuelve true.
3. Con5 horas ya guardadas y límite6, devuelve false. Una edición válida continúa al PATCH; comprobar GET posterior con título/estado intactos. No afirmar que se evaluaron las horas propuestas.
4. Abrir Hoy después del guardado y confirmar carga informada por Backend, agrupación y orden; recargar y comparar con GET.
5. Cambiar fecha/horas, provocar error o respuesta incompleta y reintentar: conservar valores. Cancelar no envía PATCH. Doble clic solo inicia un guardado.
6. Provocar 400 por límite: error junto al campo; fallo general: mensaje/reintento y valor editado conservado.
