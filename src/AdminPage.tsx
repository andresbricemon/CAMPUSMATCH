import { useEffect, useRef, useState } from "react";
import campusMapImage from "./assets/campus-map.png";
import { categoryMeta, knownTags, needs, programs, serviceTypes } from "./data";
import { loadMetrics, type Metrics } from "./metricsStore";
import { distanciaDesdeEntrada, ENTRADA_CRA_11, textoDistancia } from "./distance";
import { firebaseEnabled } from "./firebase";
import { Icon, PageTitle } from "./ui";
import type { CampusContent, ContentKey, Place } from "./types";

type Item = Record<string, unknown>;

type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "lines"
  | "tags"
  | "url"
  | "position";

type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  help?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

type SectionConfig = {
  key: ContentKey;
  label: string;
  singular: string;
  titleKey: "name" | "title";
  subtitle: (item: Item) => string;
  fields: Field[];
  /** Las zonas tienen geometría dibujada a mano: solo se editan sus textos. */
  canAdd: boolean;
  blank: () => Item;
};

const categories = Object.keys(categoryMeta);

const photoFields: Field[] = [
  {
    key: "photo.src",
    label: "Foto · enlace de la imagen",
    kind: "url",
    help: "Enlace https a una imagen pública. Déjalo vacío para no mostrar foto.",
  },
  { key: "photo.alt", label: "Foto · descripción (texto alternativo)", kind: "text" },
  { key: "photo.credit", label: "Foto · crédito", kind: "text", help: "Ej.: Foto: @unimilitar" },
  {
    key: "instagram",
    label: "Publicaciones de Instagram",
    kind: "lines",
    help: "Un enlace por línea (https://www.instagram.com/p/…).",
  },
];

const tagsField: Field = {
  key: "tags",
  label: "Etiquetas “Para ti”",
  kind: "tags",
  help: "Se marca como “Para ti” a quien tenga esos intereses u objetivos en su perfil.",
};

const discoveryFields: Field[] = [
  { key: "title", label: "Título", kind: "text", required: true },
  {
    key: "meta",
    label: "Detalle",
    kind: "text",
    help: "Fecha, hora, lugar o contacto. Ej.: Vie 20 nov · 8:00 a. m. · Plaza Cervantes",
  },
  { key: "url", label: "Enlace “Más info”", kind: "url" },
  tagsField,
];

const blankDiscovery = (): Item => ({ title: "", meta: "", tags: [] });

const sections: SectionConfig[] = [
  {
    key: "places",
    label: "Lugares del mapa",
    singular: "lugar",
    titleKey: "name",
    subtitle: (item) =>
      `${item.category} · ${textoDistancia(distanciaDesdeEntrada(item as { x: number; y: number }))}`,
    canAdd: true,
    blank: () => ({
      id: "",
      name: "",
      category: "Estudio",
      x: 50,
      y: 50,
      noise: "Moderado",
      schedule: "",
      openNow: true,
      capacity: 0,
      compatibility: 0,
      description: "",
      images: [],
      tags: [],
    }),
    fields: [
      { key: "name", label: "Nombre", kind: "text", required: true },
      { key: "category", label: "Categoría", kind: "select", options: categories },
      { key: "description", label: "Descripción", kind: "textarea" },
      { key: "position", label: "Ubicación en el mapa", kind: "position" },
      { key: "schedule", label: "Horario", kind: "text" },
      { key: "openNow", label: "Abierto ahora", kind: "checkbox" },
      { key: "noise", label: "Nivel de ruido", kind: "select", options: ["Silencioso", "Moderado", "Activo"] },
      { key: "capacity", label: "Cupos", kind: "number", min: 0 },
      { key: "compatibility", label: "Compatibilidad (%)", kind: "number", min: 0, max: 100 },
      {
        key: "images",
        label: "Fotos pendientes",
        kind: "lines",
        help: "Una etiqueta por línea; se muestran como “Foto pendiente”.",
      },
      tagsField,
      ...photoFields,
    ],
  },
  {
    key: "zones",
    label: "Zonas del mapa",
    singular: "zona",
    titleKey: "name",
    subtitle: (item) => `${item.category}${item.info ? ` · ${item.info}` : ""}`,
    canAdd: false,
    blank: () => ({}),
    fields: [
      { key: "name", label: "Nombre", kind: "text", required: true },
      { key: "category", label: "Categoría", kind: "select", options: categories },
      { key: "info", label: "Información del lugar", kind: "textarea" },
      tagsField,
      ...photoFields,
    ],
  },
  {
    key: "services",
    label: "Servicios",
    singular: "servicio",
    titleKey: "title",
    subtitle: (item) => `${item.type} · ${item.available ? "Disponible" : "Consulta el horario"}`,
    canAdd: true,
    blank: () => ({
      title: "",
      description: "",
      faculty: "Todas",
      type: serviceTypes[0],
      available: true,
      tags: [],
    }),
    fields: [
      { key: "title", label: "Nombre", kind: "text", required: true },
      { key: "description", label: "Descripción", kind: "textarea" },
      { key: "type", label: "Tipo de servicio", kind: "select", options: serviceTypes },
      {
        key: "faculty",
        label: "Facultad",
        kind: "select",
        options: ["Todas", ...programs.map((group) => group.faculty)],
      },
      { key: "available", label: "Disponible ahora", kind: "checkbox" },
      { key: "url", label: "Enlace “Más info”", kind: "url" },
      tagsField,
    ],
  },
  {
    key: "activities",
    label: "Actividades",
    singular: "actividad",
    titleKey: "title",
    subtitle: (item) => String(item.meta || ""),
    canAdd: true,
    blank: blankDiscovery,
    fields: discoveryFields,
  },
  {
    key: "clubs",
    label: "Clubes",
    singular: "club",
    titleKey: "title",
    subtitle: (item) => String(item.meta || ""),
    canAdd: true,
    blank: blankDiscovery,
    fields: discoveryFields,
  },
  {
    key: "opportunities",
    label: "Oportunidades",
    singular: "oportunidad",
    titleKey: "title",
    subtitle: (item) => String(item.meta || ""),
    canAdd: true,
    blank: blankDiscovery,
    fields: discoveryFields,
  },
];

function getPath(item: Item, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value as Item | undefined)?.[key], item);
}

function setPath(item: Item, path: string, value: unknown): Item {
  const [head, ...rest] = path.split(".");
  if (!rest.length) return { ...item, [head]: value };
  return { ...item, [head]: setPath((item[head] as Item) ?? {}, rest.join("."), value) };
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const isLink = (value: string) => /^https:\/\//i.test(value) || value.startsWith("/");

/** Limpia el borrador antes de guardarlo y devuelve los errores de validación. */
function normalize(config: SectionConfig, draft: Item): { item: Item; errors: string[] } {
  const errors: string[] = [];
  const item: Item = { ...draft };

  for (const field of config.fields) {
    if (field.kind === "lines") {
      const lines = ((item[field.key] as string[]) ?? []).map((line) => line.trim()).filter(Boolean);
      if (lines.length) item[field.key] = lines;
      else if (field.key === "images") item[field.key] = [];
      else delete item[field.key];
    }
    if (field.kind === "text" || field.kind === "textarea") {
      const value = String(getPath(item, field.key) ?? "").trim();
      if (field.required && !value) errors.push(`“${field.label}” es obligatorio.`);
    }
    if (field.kind === "number") {
      const value = Number(item[field.key]);
      if (!Number.isFinite(value)) errors.push(`“${field.label}” debe ser un número.`);
      else if (
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      )
        errors.push(`“${field.label}” debe estar entre ${field.min ?? "—"} y ${field.max ?? "—"}.`);
      item[field.key] = value;
    }
    if (field.kind === "position") {
      for (const axis of ["x", "y"]) {
        const value = Number(item[axis]);
        if (!Number.isFinite(value) || value < 0 || value > 100)
          errors.push("La ubicación en el mapa debe estar entre 0 y 100 %.");
        item[axis] = value;
      }
    }
  }

  for (const key of ["title", "name", "meta", "description", "schedule", "info"]) {
    if (typeof item[key] === "string") item[key] = (item[key] as string).trim();
  }
  if ("info" in item && !item.info) delete item.info;

  const url = String(item.url ?? "").trim();
  if (url) {
    if (!isLink(url)) errors.push("El enlace “Más info” debe empezar por https://");
    item.url = url;
  } else delete item.url;

  const photo = item.photo as Item | undefined;
  if (photo) {
    const src = String(photo.src ?? "").trim();
    if (!src) delete item.photo;
    else {
      if (!isLink(src)) errors.push("El enlace de la foto debe empezar por https://");
      item.photo = {
        src,
        alt: String(photo.alt ?? "").trim() || String(item[config.titleKey] ?? ""),
        credit: String(photo.credit ?? "").trim(),
      };
    }
  }

  const instagram = item.instagram as string[] | undefined;
  if (instagram?.some((link) => !/^https:\/\/(www\.)?instagram\.com\//i.test(link)))
    errors.push("Los enlaces de Instagram deben empezar por https://www.instagram.com/");

  if (!Array.isArray(item.tags)) item.tags = [];
  return { item, errors: [...new Set(errors)] };
}

function PositionPicker({
  x,
  y,
  category,
  onChange,
}: {
  x: number;
  y: number;
  category: string;
  onChange: (x: number, y: number) => void;
}) {
  const round = (value: number) => Math.round(Math.min(Math.max(value, 0), 100) * 10) / 10;
  return (
    <div className="admin-position">
      <div
        className="campus-map admin-map"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onChange(
            round(((event.clientX - rect.left) / rect.width) * 100),
            round(((event.clientY - rect.top) / rect.height) * 100),
          );
        }}
      >
        <img className="campus-photo" src={campusMapImage} alt="" draggable={false} />
        <span
          className="admin-entrance"
          style={{ left: `${ENTRADA_CRA_11.x}%`, top: `${ENTRADA_CRA_11.y}%` }}
          title="Entrada Cra. 11"
          aria-hidden="true"
        />
        <span
          className={`map-marker cat-${category.toLowerCase()}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          aria-hidden="true"
        >
          <Icon name={categoryMeta[category as keyof typeof categoryMeta]?.icon ?? "pin"} size={17} />
        </span>
      </div>
      <p className="admin-help">Haz clic en el mapa para mover el marcador o escribe las coordenadas.</p>
      <p className="admin-distance" aria-live="polite">
        <Icon name="pin" size={16} />
        Distancia calculada: <strong>{textoDistancia(distanciaDesdeEntrada({ x, y }))}</strong>
      </p>
      <div className="admin-coords">
        <label>
          Horizontal (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={x}
            onChange={(event) => onChange(Number(event.target.value), y)}
          />
        </label>
        <label>
          Vertical (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={y}
            onChange={(event) => onChange(x, Number(event.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  draft,
  setDraft,
}: {
  field: Field;
  draft: Item;
  setDraft: (updater: (current: Item) => Item) => void;
}) {
  const id = `admin-field-${field.key.replace(/\./g, "-")}`;
  const value = getPath(draft, field.key);
  const update = (next: unknown) => setDraft((current) => setPath(current, field.key, next));
  const help = field.help && (
    <small className="admin-help" id={`${id}-help`}>
      {field.help}
    </small>
  );
  const describedBy = field.help ? `${id}-help` : undefined;

  if (field.kind === "position")
    return (
      <fieldset className="admin-fieldset">
        <legend>{field.label}</legend>
        <PositionPicker
          x={Number(draft.x ?? 50)}
          y={Number(draft.y ?? 50)}
          category={String(draft.category ?? "Estudio")}
          onChange={(x, y) => setDraft((current) => ({ ...current, x, y }))}
        />
      </fieldset>
    );

  if (field.kind === "checkbox")
    return (
      <label className="switch-field">
        <span>
          <strong>{field.label}</strong>
        </span>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => update(e.target.checked)} />
      </label>
    );

  if (field.kind === "tags") {
    const selected = (value as string[] | undefined) ?? [];
    return (
      <fieldset className="admin-fieldset">
        <legend>{field.label}</legend>
        {help}
        <div className="chips admin-tags">
          {[...new Set([...knownTags, ...selected])].map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                className={`chip ${active ? "active" : ""}`}
                aria-pressed={active}
                onClick={() => update(active ? selected.filter((t) => t !== tag) : [...selected, tag])}
              >
                {active && <Icon name="check" size={15} />}
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  let control: React.ReactNode;
  if (field.kind === "textarea" || field.kind === "lines")
    control = (
      <textarea
        id={id}
        rows={field.kind === "lines" ? 3 : 4}
        aria-describedby={describedBy}
        value={field.kind === "lines" ? ((value as string[]) ?? []).join("\n") : String(value ?? "")}
        onChange={(e) => update(field.kind === "lines" ? e.target.value.split("\n") : e.target.value)}
      />
    );
  else if (field.kind === "select")
    control = (
      <select id={id} value={String(value ?? "")} onChange={(e) => update(e.target.value)}>
        {[...new Set([...(field.options ?? []), String(value ?? "")])]
          .filter(Boolean)
          .map((option) => (
            <option key={option}>{option}</option>
          ))}
      </select>
    );
  else
    control = (
      <input
        id={id}
        type={field.kind === "number" ? "number" : field.kind === "url" ? "url" : "text"}
        min={field.min}
        max={field.max}
        required={field.required}
        aria-describedby={describedBy}
        value={field.kind === "number" ? Number(value ?? 0) : String(value ?? "")}
        onChange={(e) => update(field.kind === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={field.kind === "url" ? "https://" : undefined}
      />
    );

  return (
    <label htmlFor={id}>
      <span>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
      {control}
      {help}
    </label>
  );
}

function EditorModal({
  config,
  initial,
  isNew,
  busy,
  onCancel,
  onSubmit,
}: {
  config: SectionConfig;
  initial: Item;
  isNew: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (item: Item) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Item>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const ref = useRef<HTMLFormElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    const onCancel = () => cancelRef.current();
    const previous = document.activeElement as HTMLElement;
    const panel = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    const selector = "button, select, input, textarea";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Tab" && panel) {
        const focusable = [...panel.querySelectorAll<HTMLElement>(selector)].filter(
          (element) => !element.hasAttribute("disabled"),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { item, errors: found } = normalize(config, draft);
    setErrors(found);
    if (found.length) {
      ref.current?.querySelector(".auth-error")?.scrollIntoView({ block: "nearest" });
      return;
    }
    await onSubmit(item);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <form
        className="filter-panel admin-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-editor-title"
        ref={ref}
        onSubmit={submit}
        noValidate
      >
        <div className="panel-handle" aria-hidden="true" />
        <header>
          <div>
            <p className="mini-label">{config.label}</p>
            <h2 id="admin-editor-title">
              {isNew ? `Añadir ${config.singular}` : `Editar ${config.singular}`}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Cerrar editor">
            <Icon name="x" />
          </button>
        </header>
        <div className="filter-fields admin-fields">
          {config.fields.map((field) => (
            <FieldInput key={field.key} field={field} draft={draft} setDraft={setDraft} />
          ))}
        </div>
        {errors.length > 0 && (
          <div className="auth-error" role="alert">
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <footer>
          <button type="button" className="button ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? "Guardando…" : isNew ? "Añadir" : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function RankingList({
  title,
  eyebrow,
  rows,
}: {
  title: string;
  eyebrow: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="card metrics-list">
      <p className="mini-label">{eyebrow}</p>
      <h2>{title}</h2>
      <ol>
        {rows.map((row, index) => (
          <li key={`${index}-${row.label}`}>
            <span className="metrics-rank" aria-hidden="true">
              {index + 1}
            </span>
            <div className="metrics-row-text">
              <div className="item-title-row">
                <strong>{row.label}</strong>
                <span className="personal-badge">
                  {row.count} {row.count === 1 ? "vez" : "veces"}
                </span>
              </div>
              <span className="metrics-bar" aria-hidden="true">
                <span style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MetricsPanel({ places }: { places: Place[] }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = async () => {
    setLoading(true);
    setError(undefined);
    try {
      setMetrics(await loadMetrics());
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar las métricas. Revisa tu conexión y que las reglas de Firestore estén desplegadas.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const placeName = (id: string) =>
    places.find((place) => place.id === id)?.name ?? "Lugar eliminado del mapa";
  const needLabel = (id: string) => needs.find((need) => need.id === id)?.label ?? id;

  return (
    <section aria-labelledby="metrics-title" aria-busy={loading}>
      <div className="filter-bar admin-toolbar">
        <h2 id="metrics-title" className="metrics-heading">
          Métricas de uso
        </h2>
        <button className="button secondary" onClick={() => void refresh()} disabled={loading}>
          <Icon name="rotate" size={18} />
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </div>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {!metrics && loading && (
        <p className="muted" role="status">
          Cargando métricas…
        </p>
      )}
      {metrics && (
        <>
          <div className="metrics-grid">
            {[
              {
                label: "Usuarios registrados",
                value: metrics.users ?? "—",
                icon: "users",
                hint: metrics.users === null ? "No se pudo contar" : "Con perfil creado",
              },
              {
                label: "Matches últimos 7 días",
                value: metrics.matchesLast7Days,
                icon: "calendar",
                hint: "Resultados obtenidos en Match",
              },
              {
                label: "Matches totales",
                value: metrics.totalMatches,
                icon: "sparkles",
                hint: "Desde que se empezó a medir",
              },
            ].map((stat) => (
              <article className="card metrics-card" key={stat.label}>
                <span className="icon-box">
                  <Icon name={stat.icon} />
                </span>
                <div>
                  <p className="mini-label">{stat.label}</p>
                  <strong className="metrics-value">{stat.value}</strong>
                  <small>{stat.hint}</small>
                </div>
              </article>
            ))}
          </div>
          {metrics.totalMatches === 0 ? (
            <div className="empty card">
              <Icon name="sparkles" />
              <h3>Todavía no hay matches</h3>
              <p>
                Cuando los estudiantes usen “¿Qué necesitas ahora?”, aquí verás los lugares más
                recomendados y las necesidades más pedidas.
              </p>
            </div>
          ) : (
            <div className="metrics-lists">
              <RankingList
                eyebrow="Top 5"
                title="Lugares más recomendados"
                rows={metrics.topPlaces.map((row) => ({
                  label: placeName(row.placeId),
                  count: row.count,
                }))}
              />
              <RankingList
                eyebrow="Lo que buscan"
                title="Necesidades más pedidas"
                rows={metrics.topNeeds.map((row) => ({
                  label: needLabel(row.need),
                  count: row.count,
                }))}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function AdminPage({
  content,
  onSave,
  onReset,
}: {
  content: CampusContent;
  onSave: <K extends ContentKey>(key: K, items: CampusContent[K]) => Promise<void>;
  onReset: (key: ContentKey) => Promise<void>;
}) {
  const [view, setView] = useState<ContentKey | "metrics">("places");
  const tab: ContentKey = view === "metrics" ? "places" : view;
  const [editing, setEditing] = useState<{ index: number | null; draft: Item } | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const config = sections.find((section) => section.key === tab)!;
  const items = content[tab] as unknown as Item[];

  const persist = async (next: Item[], message: string): Promise<boolean> => {
    setBusy(true);
    setStatus(null);
    try {
      await onSave(tab, next as unknown as CampusContent[typeof tab]);
      setStatus({ kind: "ok", text: message });
      return true;
    } catch (error) {
      console.error(error);
      setStatus({
        kind: "error",
        text: "No se pudo guardar. Revisa tu conexión y que tu cuenta tenga permisos de administrador.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (item: Item) => {
    if (!editing) return false;
    const title = String(item[config.titleKey]);
    let next: Item[];
    if (editing.index === null) {
      if (tab === "places") {
        const ids = new Set(items.map((existing) => existing.id));
        let id = slugify(title) || "lugar";
        while (ids.has(id)) id = `${slugify(title) || "lugar"}-${Math.random().toString(36).slice(2, 6)}`;
        item.id = id;
      }
      next = [...items, item];
    } else {
      next = items.map((existing, index) => (index === editing.index ? item : existing));
    }
    const ok = await persist(
      next,
      editing.index === null ? `Se añadió “${title}”.` : `Se guardaron los cambios de “${title}”.`,
    );
    if (ok) setEditing(null);
    return ok;
  };

  const remove = async (index: number) => {
    const title = String(items[index][config.titleKey]);
    if (!window.confirm(`¿Eliminar “${title}”? Los estudiantes dejarán de verlo.`)) return;
    await persist(
      items.filter((_, i) => i !== index),
      `Se eliminó “${title}”.`,
    );
  };

  const reset = async () => {
    if (
      !window.confirm(
        `¿Restaurar “${config.label}” al contenido original? Se perderán todos los cambios hechos en esta sección.`,
      )
    )
      return;
    setBusy(true);
    setStatus(null);
    try {
      await onReset(tab);
      setStatus({ kind: "ok", text: `“${config.label}” volvió al contenido original.` });
    } catch (error) {
      console.error(error);
      setStatus({ kind: "error", text: "No se pudo restaurar el contenido. Intenta de nuevo." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page admin-page">
      <PageTitle
        eyebrow="Perfil administrador"
        title={
          <>
            Gestiona el <span className="accent-mark">contenido</span>
          </>
        }
        text="Añade o edita lugares del mapa, servicios, actividades, clubes y oportunidades. Los cambios se publican al instante para todos los estudiantes."
      />
      {!firebaseEnabled && (
        <div className="tip-card stagger">
          <Icon name="info" />
          <p>
            <strong>Modo demo.</strong> Los cambios se guardan solo en este navegador.
          </p>
        </div>
      )}
      <div className="chips admin-tabs" role="group" aria-label="Sección a administrar">
        {sections.map((section) => (
          <button
            key={section.key}
            className={`chip ${view === section.key ? "active" : ""}`}
            aria-pressed={view === section.key}
            onClick={() => {
              setView(section.key);
              setStatus(null);
            }}
          >
            {section.label}
            <span className="admin-count">{(content[section.key] as unknown[]).length}</span>
          </button>
        ))}
        <button
          className={`chip ${view === "metrics" ? "active" : ""}`}
          aria-pressed={view === "metrics"}
          onClick={() => {
            setView("metrics");
            setStatus(null);
          }}
        >
          <Icon name="activity" size={16} />
          Métricas
        </button>
      </div>
      {view === "metrics" ? (
        <MetricsPanel places={content.places} />
      ) : (
      <>
      <div className="filter-bar admin-toolbar">
        <p>
          <strong>{items.length}</strong> {config.label.toLowerCase()}
        </p>
        <div className="admin-toolbar-actions">
          <button className="button ghost" onClick={reset} disabled={busy}>
            <Icon name="rotate" size={18} />
            Restaurar original
          </button>
          {config.canAdd && (
            <button
              className="button primary"
              onClick={() => setEditing({ index: null, draft: config.blank() })}
              disabled={busy}
            >
              <Icon name="plus" size={18} />
              Añadir {config.singular}
            </button>
          )}
        </div>
      </div>
      {!config.canAdd && (
        <p className="admin-help admin-note">
          Las zonas están dibujadas sobre la imagen del mapa, así que solo se editan sus textos y fotos.
          Para un sitio nuevo, añade un lugar del mapa.
        </p>
      )}
      <div role="status" aria-live="polite">
        {status && (
          <p className={status.kind === "ok" ? "admin-status" : "auth-error"}>{status.text}</p>
        )}
      </div>
      <ul className="admin-list">
        {items.map((item, index) => (
          <li className="card admin-item" key={`${index}-${String(item[config.titleKey])}`}>
            {"category" in item && (
              <span className={`place-icon cat-${String(item.category).toLowerCase()}`}>
                <Icon
                  name={categoryMeta[item.category as keyof typeof categoryMeta]?.icon ?? "pin"}
                  size={20}
                />
              </span>
            )}
            <div className="admin-item-text">
              <strong>{String(item[config.titleKey])}</strong>
              {config.subtitle(item) && <small>{config.subtitle(item)}</small>}
            </div>
            <div className="admin-item-actions">
              <button
                className="text-button"
                onClick={() => setEditing({ index, draft: structuredClone(item) })}
                disabled={busy}
                aria-label={`Editar ${String(item[config.titleKey])}`}
              >
                <Icon name="edit" size={17} /> Editar
              </button>
              {config.canAdd && (
                <button
                  className="text-button danger"
                  onClick={() => remove(index)}
                  disabled={busy}
                  aria-label={`Eliminar ${String(item[config.titleKey])}`}
                >
                  <Icon name="trash" size={17} /> Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!items.length && (
        <div className="empty card">
          <Icon name="compass" />
          <h3>No hay elementos</h3>
          <p>Usa “Añadir {config.singular}” para crear el primero.</p>
        </div>
      )}
      </>
      )}
      {editing && (
        <EditorModal
          config={config}
          initial={editing.draft}
          isNew={editing.index === null}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
