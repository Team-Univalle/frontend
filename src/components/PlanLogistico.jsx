import { Pencil, Trash2 } from 'lucide-react';
import './PlanLogistico.css';

function CampoSubtarea({
  item,
  errors = {},
  disabled,
  onChange,
  idPrefix,
  showStatus = false,
}) {
  return (
    <>
      <div className="gestion-field gestion-field--nombre">
        <label htmlFor={`${idPrefix}-gestion`}>Título</label>
        <input
          id={`${idPrefix}-gestion`}
          type="text"
          value={item.gestion}
          onChange={(event) => onChange('gestion', event.target.value)}
          aria-invalid={!!errors.gestion}
          aria-describedby={errors.gestion ? `${idPrefix}-gestion-error` : undefined}
          disabled={disabled}
        />
        {errors.gestion && (
          <span id={`${idPrefix}-gestion-error`} className="field-error">
            {errors.gestion}
          </span>
        )}
      </div>

      <div className="gestion-field">
        <label htmlFor={`${idPrefix}-fecha`}>Fecha objetivo</label>
        <input
          id={`${idPrefix}-fecha`}
          type="date"
          value={item.fechaObjetivo}
          onChange={(event) => onChange('fechaObjetivo', event.target.value)}
          aria-invalid={!!errors.fechaObjetivo}
          aria-describedby={errors.fechaObjetivo ? `${idPrefix}-fecha-error` : undefined}
          disabled={disabled}
        />
        {errors.fechaObjetivo && (
          <span id={`${idPrefix}-fecha-error`} className="field-error">
            {errors.fechaObjetivo}
          </span>
        )}
      </div>

      <div className="gestion-field gestion-field--horas">
        <label htmlFor={`${idPrefix}-horas`}>Horas estimadas</label>
        <input
          id={`${idPrefix}-horas`}
          type="number"
          min="0.25"
          step="0.25"
          placeholder="Ej. 1.5"
          value={item.horasEstimadas}
          onChange={(event) => onChange('horasEstimadas', event.target.value)}
          aria-invalid={!!errors.horasEstimadas}
          aria-describedby={errors.horasEstimadas ? `${idPrefix}-horas-error` : undefined}
          disabled={disabled}
        />
        {errors.horasEstimadas && (
          <span id={`${idPrefix}-horas-error`} className="field-error">
            {errors.horasEstimadas}
          </span>
        )}
      </div>

      {showStatus && (
        <div className="gestion-field gestion-field--estado">
          <label htmlFor={`${idPrefix}-estado`}>Estado</label>
          <select
            id={`${idPrefix}-estado`}
            value={item.estado}
            onChange={(event) => onChange('estado', event.target.value)}
            disabled={disabled}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Ejecutada">Ejecutada</option>
            <option value="Pospuesta">Pospuesta</option>
          </select>
        </div>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export default function PlanLogistico({
  mode = 'initial',
  items = [],
  errors = {},
  disabled = false,
  onAdd,
  onChange,
  onDelete,
  onEdit,
  deletingId,
  loading = false,
  loadError = '',
  onRetry,
  isFormOpen = false,
  isEditing = false,
  draft,
  draftErrors = {},
  onDraftChange,
  onCancel,
  onSubmit,
  saving = false,
  submitError = '',
}) {
  const isDetail = mode === 'detail';
  const title = isDetail ? 'Gestiones' : 'Plan logístico inicial';
  const description = isDetail
    ? 'Subtareas asociadas a este evento.'
    : 'Añade subtareas con fecha objetivo y esfuerzo mayor que cero.';

  return (
    <section className="plan-logistico" aria-labelledby="plan-logistico-title">
      <div className="plan-logistico__header">
        <div>
          <h2 id="plan-logistico-title">{title}</h2>
          {!isDetail && <p>{description}</p>}
        </div>
        {!isDetail && (
          <button
            className="boton-adicional"
            type="button"
            onClick={onAdd}
            disabled={disabled}
          >
            + Añadir gestión
          </button>
        )}
      </div>

      {isDetail && loading && (
        <div className="plan-logistico__estado" role="status">
          Cargando subtareas...
        </div>
      )}

      {isDetail && !loading && loadError && (
        <div className="plan-logistico__estado plan-logistico__estado--error" role="alert">
          <p>No fue posible cargar las subtareas.</p>
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}

      {isDetail && !loading && !loadError && isFormOpen && draft && (
        <form className="gestion-card gestion-card--nueva" onSubmit={onSubmit} noValidate>
          <span className="gestion-card__numero" aria-hidden="true">
            {isEditing ? <Pencil size={15} /> : '+'}
          </span>
          <CampoSubtarea
            item={draft}
            errors={draftErrors}
            disabled={saving}
            onChange={onDraftChange}
            idPrefix="nueva-subtarea"
            showStatus={isEditing}
          />
          {submitError && (
            <div className="subtarea-submit-error" role="alert">
              {submitError}
            </div>
          )}
          <div className="subtarea-actions">
            <button type="button" onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
            <button className="boton-guardado" type="submit" disabled={saving}>
              {saving
                ? 'Guardando...'
                : submitError
                  ? 'Reintentar'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Guardar subtarea'}
            </button>
          </div>
        </form>
      )}

      {isDetail && !loading && !loadError && items.length === 0 && !isFormOpen && (
        <div className="plan-logistico__estado plan-logistico__estado--vacio">
          <p>Aún no tienes subtareas logísticas.</p>
          <button type="button" onClick={onAdd}>
            Agregar subtarea
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <div className="plan-logistico__lista">
          {items.map((item, index) =>
            isDetail ? (
              <article className="gestion-card gestion-card--lectura" key={item.id}>
                <div className="gestion-resumen gestion-resumen--titulo">
                  <strong>{item.gestion}</strong>
                  <span>Gestión logística</span>
                </div>
                <div className="gestion-resumen gestion-resumen--tiempo">
                  <strong className="gestion-horas">{item.horasEstimadas} h</strong>
                  <span>{formatDate(item.fechaObjetivo)}</span>
                </div>
                <span className={`gestion-estado gestion-estado--${String(item.estado || 'Pendiente').toLowerCase()}`}>
                  {item.estado || 'Pendiente'}
                </span>
                <div className="gestion-card__acciones">
                  <button type="button" onClick={() => onEdit(item)} disabled={deletingId === item.id}>
                    <Pencil size={15} aria-hidden="true" /> Editar
                  </button>
                  <button className="gestion-card__eliminar" type="button" onClick={() => onDelete(item)} disabled={deletingId === item.id} aria-label={`Eliminar ${item.gestion}`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ) : (
              <div className="gestion-card" key={item.id}>
                <span className="gestion-card__numero" aria-hidden="true">
                  {index + 1}
                </span>
                <CampoSubtarea
                  item={item}
                  errors={{
                    gestion: errors[`${item.id}-gestion`],
                    fechaObjetivo: errors[`${item.id}-fechaObjetivo`],
                    horasEstimadas: errors[`${item.id}-horasEstimadas`],
                  }}
                  disabled={disabled}
                  onChange={(field, value) => onChange(item.id, field, value)}
                  idPrefix={`subtarea-${item.id}`}
                />
                <button
                  className="boton-eliminar-gestion"
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={disabled}
                  aria-label={`Eliminar gestión ${index + 1}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
