import { useEffect, useMemo, useRef, useState } from "react";
import {
  categoryMeta,
  needs,
  profile,
  programs,
  recommendations,
  semesters,
  serviceTypes,
  type Category,
  type NeedId,
  type Noise,
} from "./data";
import campusMapImage from "./assets/campus-map.png";
import { textoDistancia, urlRuta } from "./distance";
import { logMatch } from "./metricsStore";
import { Icon, PageTitle, ThemeToggle } from "./ui";
import {
  initialsFrom,
  type CampusContent,
  type CampusZone,
  type DiscoveryItem,
  type Place,
  type SessionUser,
  type Service,
  type StudentProfileState,
} from "./types";

type Section = "profile" | "match" | "discover" | "explore";
type Screen = Section | "result";
const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Perfil", icon: "user" },
  { id: "match", label: "Match", icon: "sparkles" },
  { id: "discover", label: "Descubre", icon: "compass" },
  { id: "explore", label: "Explora", icon: "map" },
];



function BackButton({ onClick, label = "Volver" }: { onClick: () => void; label?: string }) {
  return (
    <button className="back-button" onClick={onClick}>
      <Icon name="arrowLeft" size={19} />
      {label}
    </button>
  );
}

function ProfilePage({
  user,
  value,
  onSave,
}: {
  user: SessionUser;
  value: StudentProfileState;
  onSave: (value: StudentProfileState) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const toggle = (key: "selectedInterests" | "selectedGoals", item: string) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(item)
        ? current[key].filter((selected) => selected !== item)
        : [...current[key], item],
    }));
  const save = () => {
    onSave(draft);
    setEditing(false);
  };
  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };
  const updateProgram = (career: string) => {
    const faculty =
      programs.find((group) => group.programs.some((program) => program === career))?.faculty ??
      value.faculty;
    setDraft((current) => ({ ...current, career, faculty }));
  };

  return (
    <div className="page">
      <PageTitle
        eyebrow="Tu espacio"
        title={
          <>
            Hola, <span className="accent-mark">{user.name.split(" ")[0]}</span>
          </>
        }
        text="Tu perfil nos ayuda a encontrar conexiones que sí van contigo."
      />
      <section className="profile-hero card stagger">
        <div className="avatar" aria-hidden="true">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            initialsFrom(user.name)
          )}
        </div>
        <div>
          <p className="mini-label">Perfil de estudiante</p>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
        </div>
      </section>
      <div className="profile-grid">
        <section className="card stagger">
          <div className="section-heading">
            <span className="icon-box">
              <Icon name="graduation" />
            </span>
            <div>
              <p className="mini-label">Tu recorrido</p>
              <h2>Info académica</h2>
            </div>
          </div>
          <dl className="info-list">
            <div>
              <dt>Carrera</dt>
              <dd>
                {editing ? (
                  <select
                    className="academic-select"
                    aria-label="Programa académico"
                    value={draft.career}
                    onChange={(event) => updateProgram(event.target.value)}
                  >
                    {programs.map((group) => (
                      <optgroup key={group.faculty} label={group.faculty}>
                        {group.programs.map((program) => (
                          <option key={program}>{program}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  value.career
                )}
              </dd>
            </div>
            <div>
              <dt>Semestre</dt>
              <dd>
                {editing ? (
                  <select
                    className="academic-select"
                    aria-label="Semestre"
                    value={draft.semester}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, semester: event.target.value }))
                    }
                  >
                    {semesters.map((semester) => (
                      <option key={semester}>{semester}</option>
                    ))}
                  </select>
                ) : (
                  value.semester
                )}
              </dd>
            </div>
            <div>
              <dt>Facultad</dt>
              <dd>{editing ? draft.faculty : value.faculty}</dd>
            </div>
          </dl>
        </section>
        <section className="card stagger">
          <div className="section-row">
            <div>
              <p className="mini-label">Lo que te mueve</p>
              <h2>Intereses</h2>
            </div>
            {!editing && (
              <button className="text-button" onClick={startEditing}>
                <Icon name="edit" size={17} /> Editar
              </button>
            )}
          </div>
          <div className="chips" aria-label="Intereses">
            {profile.interests.map((interest) => {
              const active = (editing ? draft.selectedInterests : value.selectedInterests).includes(
                interest.label,
              );
              return editing ? (
                <button
                  key={interest.label}
                  className={`chip ${active ? "active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggle("selectedInterests", interest.label)}
                >
                  {active && <Icon name="check" size={15} />}
                  {interest.label}
                </button>
              ) : (
                active && (
                  <span key={interest.label} className="chip active">
                    {interest.label}
                  </span>
                )
              );
            })}
          </div>
          {editing && (
            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => {
                  setDraft(value);
                  setEditing(false);
                }}
              >
                Cancelar
              </button>
              <button className="button primary" onClick={save}>
                Guardar cambios
              </button>
            </div>
          )}
        </section>
        <section className="card goals-card stagger">
          <div className="section-heading">
            <span className="icon-box coral">
              <Icon name="sparkles" />
            </span>
            <div>
              <p className="mini-label">Tu norte</p>
              <h2>Preferencias</h2>
            </div>
          </div>
          <ul className="goals">
            {profile.goals.map((goal) => {
              const active = (editing ? draft.selectedGoals : value.selectedGoals).includes(
                goal.label,
              );
              if (!editing && !active) return null;
              return (
                <li key={goal.label}>
                  {editing ? (
                    <button
                      className={`goal-toggle ${active ? "active" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggle("selectedGoals", goal.label)}
                    >
                      <span className="check-dot">{active && <Icon name="check" size={15} />}</span>
                      <span>{goal.label}</span>
                    </button>
                  ) : (
                    <>
                      <span className="check-dot">
                        <Icon name="check" size={15} />
                      </span>
                      <span>{goal.label}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function MatchPage({ choose }: { choose: (id: NeedId) => void }) {
  return (
    <div className="page match-page">
      <PageTitle
        eyebrow="Match rápido"
        title={
          <>
            ¿Qué necesitas <span className="accent-mark">ahora?</span>
          </>
        }
        text="Elige una opción y te mostraremos el lugar que mejor encaja contigo."
      />
      <div className="needs-grid">
        {needs.map((need, index) => (
          <button
            key={need.id}
            className="need-card stagger"
            style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}
            onClick={() => choose(need.id)}
          >
            <span className="need-icon">
              <Icon name={need.icon} size={27} />
            </span>
            <span>
              <strong>{need.label}</strong>
              <small>{need.helper}</small>
            </span>
            <Icon name="arrowRight" className="need-arrow" />
          </button>
        ))}
      </div>
      <div className="tip-card stagger">
        <Icon name="info" />
        <p>
          <strong>Sin complicaciones.</strong> No necesitas escribir nada; solo cuéntanos cómo te
          sientes.
        </p>
      </div>
    </div>
  );
}

/** "Llévame allí": ruta a pie en Google Maps desde la entrada Cra. 11 (abre la app en el celular). */
function RouteLink({ point, onClick }: { point: { x: number; y: number }; onClick?: () => void }) {
  return (
    <div className="route-action">
      <a
        className="button primary wide"
        href={urlRuta(point)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        <Icon name="navigation" size={19} />
        Llévame allí
        <span className="sr-only"> (abre Google Maps en una pestaña nueva)</span>
      </a>
      <small>Ruta aproximada desde la entrada Cra. 11</small>
    </div>
  );
}

/** Lugar recomendado para una necesidad. Si un admin eliminó el previsto, usa el de mejor compatibilidad. */
function recommendedPlace(need: NeedId, places: Place[]): Place | undefined {
  return (
    places.find((item) => item.id === recommendations[need]) ??
    [...places].sort((a, b) => b.compatibility - a.compatibility)[0]
  );
}

function ResultPage({
  need,
  places,
  onBack,
  onRoute,
}: {
  need: NeedId;
  places: Place[];
  onBack: () => void;
  onRoute: (id: string) => void;
}) {
  const needLabel = needs.find((item) => item.id === need)?.label;
  // Si un administrador eliminó el lugar recomendado, se usa el de mejor compatibilidad.
  const place = recommendedPlace(need, places);
  if (!place)
    return (
      <div className="page result-page">
        <BackButton onClick={onBack} />
        <div className="empty card">
          <Icon name="compass" />
          <h3>Aún no hay lugares para recomendar</h3>
          <p>Vuelve pronto: estamos actualizando el mapa del campus.</p>
        </div>
      </div>
    );
  return (
    <div className="page result-page">
      <BackButton onClick={onBack} />
      <PageTitle
        eyebrow={`Tu match para “${needLabel}”`}
        title={
          <>
            Encontramos una <span className="accent-mark">buena opción</span>
          </>
        }
        text="Esta recomendación combina cercanía, disponibilidad y tus preferencias."
      />
      <article className="result-card card">
        <div className="result-top">
          <span className={`place-icon cat-${place.category.toLowerCase()}`}>
            <Icon name={categoryMeta[place.category].icon} size={29} />
          </span>
          <span className="category-pill">{place.category}</span>
        </div>
        <h2>{place.name}</h2>
        <p className="muted">{place.description}</p>
        <div className="place-stats">
          <span>
            <Icon name="pin" size={18} />
            <strong>{textoDistancia(place.distance)}</strong>
            <small>Distancia</small>
          </span>
          <span>
            <Icon name="volume" size={18} />
            <strong>{place.noise}</strong>
            <small>Nivel de ruido</small>
          </span>
          <span>
            <Icon name="users" size={18} />
            <strong>{place.capacity} cupos</strong>
            <small>Disponibles</small>
          </span>
        </div>
        <div className="compatibility">
          <div className="section-row">
            <div>
              <p className="mini-label">Compatibilidad</p>
              <strong>{place.compatibility}% · Match excelente</strong>
            </div>
            <span className="score">{place.compatibility}%</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Compatibilidad"
            aria-valuenow={place.compatibility}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ "--progress": `${place.compatibility}%` } as React.CSSProperties} />
          </div>
        </div>
        <div className="result-actions">
          {/* Abre Google Maps y, en la app, deja el lugar marcado en Explora. */}
          <RouteLink point={place} onClick={() => onRoute(place.id)} />
          <button className="button secondary wide" onClick={onBack}>
            Elegir otra necesidad
          </button>
        </div>
      </article>
    </div>
  );
}

function Accordion({
  section,
  selectedTags,
}: {
  section: { id: string; title: string; items: DiscoveryItem[] };
  selectedTags: ReadonlySet<string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="accordion card stagger">
      <button
        className="accordion-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${section.id}-content`}
      >
        <span>
          <span className="mini-label">Para ti</span>
          <strong>{section.title}</strong>
        </span>
        <span className="round-icon" aria-hidden="true">
          <Icon name={open ? "minus" : "plus"} size={18} />
        </span>
      </button>
      <div
        id={`${section.id}-content`}
        className={`accordion-content ${open ? "open" : ""}`}
        hidden={!open}
      >
        {section.items.map((item, index) => (
          <div className="discovery-item" key={`${index}-${item.title}`}>
            <span className="item-dot" />
            <div>
              <div className="item-title-row">
                <strong>{item.title}</strong>
                {item.tags.some((tag) => selectedTags.has(tag)) && (
                  <span className="personal-badge">Para ti</span>
                )}
              </div>
              {item.meta && <p>{item.meta}</p>}
              {item.url && (
                <a className="more-info-link" href={item.url} target="_blank" rel="noreferrer">
                  Más info
                  <Icon name="arrowRight" size={15} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type DiscoverFilters = { faculty: string; type: string; available: boolean };
const discoverDefault: DiscoverFilters = { faculty: "Todas", type: "Todos", available: false };

function DiscoverPage({
  openFilters,
  filters,
  selectedTags,
  services,
  sections,
}: {
  openFilters: () => void;
  filters: DiscoverFilters;
  selectedTags: ReadonlySet<string>;
  services: Service[];
  sections: { id: string; title: string; items: DiscoveryItem[] }[];
}) {
  const filtered = services.filter(
    (service) =>
      (filters.faculty === "Todas" || service.faculty === filters.faculty) &&
      (filters.type === "Todos" || service.type === filters.type) &&
      (!filters.available || service.available),
  );
  return (
    <div className="page">
      <PageTitle
        eyebrow="Descubre tu campus"
        title={
          <>
            ¿Sabías <span className="accent-mark">qué…?</span>
          </>
        }
        text="Hay servicios y oportunidades pensados para acompañar cada etapa de tu vida universitaria."
      />
      <div className="filter-bar">
        <p>
          <strong>{filtered.length}</strong> servicios encontrados
        </p>
        <button className="button secondary" onClick={openFilters}>
          <Icon name="sliders" size={19} />
          Ventana de filtros
        </button>
      </div>
      <section className="services-section">
        <div className="section-row">
          <div>
            <p className="mini-label">Siempre a tu alcance</p>
            <h2>Servicios</h2>
          </div>
          <span className="verified">
            <Icon name="checkCircle" size={17} /> Verificados
          </span>
        </div>
        <div className="service-grid">
          {filtered.map((service, index) => (
            <article
              className="service-card card stagger"
              key={`${index}-${service.title}`}
              style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}
            >
              <span className="service-icon">
                <Icon
                  name={
                    service.type === "Bienestar" || service.type === "Salud"
                      ? "heart"
                      : service.type === "Académico"
                        ? "book"
                        : service.type === "Movilidad"
                          ? "navigation"
                          : "briefcase"
                  }
                />
              </span>
              <div>
                <div className="item-title-row">
                  <h3>{service.title}</h3>
                  {service.tags.some((tag) => selectedTags.has(tag)) && (
                    <span className="personal-badge">Para ti</span>
                  )}
                </div>
                <p>{service.description}</p>
                <span className={`availability ${service.available ? "" : "closed"}`}>
                  <span />
                  {service.available ? "Disponible ahora" : "Consulta el horario"}
                </span>
                {service.url && (
                  <a className="more-info-link" href={service.url} target="_blank" rel="noreferrer">
                    Más info
                    <Icon name="arrowRight" size={15} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty card">
            <Icon name="compass" />
            <h3>No encontramos resultados</h3>
            <p>Prueba cambiando uno de los filtros.</p>
          </div>
        )}
      </section>
      <div className="accordion-stack">
        {sections.map((section) => (
          <Accordion key={section.id} section={section} selectedTags={selectedTags} />
        ))}
      </div>
    </div>
  );
}

function CampusMap({
  selected,
  route,
  onSelect,
  visiblePlaces,
  places,
  campusZones,
}: {
  selected?: string;
  route?: boolean;
  onSelect: (id: string) => void;
  visiblePlaces: Place[];
  places: Place[];
  campusZones: CampusZone[];
}) {
  const target = places.find((p) => p.id === selected);
  const selectedZone = campusZones.find((zone) => zone.id === selected);
  const [hoveredZoneId, setHoveredZoneId] = useState<string>();
  const activeZone = campusZones.find((zone) => zone.id === hoveredZoneId) ?? selectedZone;
  return (
    <div className="campus-map" role="group" aria-label="Mapa ilustrado del campus">
      <img
        className="campus-photo"
        src={campusMapImage}
        alt="Vista aérea del campus con edificios y zonas resaltadas por color"
      />
      {route && target && (
        <svg className="route-overlay" viewBox="0 0 100 100" aria-hidden="true">
          <path
            d={`M8 91 C 20 80, ${target.x - 15} ${target.y + 8}, ${target.x} ${target.y}`}
            className="route-line"
          />
        </svg>
      )}
      {campusZones.map((zone) => (
        <button
          key={zone.id}
          className={`campus-zone zone-${zone.id} ${selected === zone.id ? "selected" : ""}`}
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
            clipPath: zone.shape,
          }}
          onClick={() => onSelect(zone.id)}
          onMouseEnter={() => setHoveredZoneId(zone.id)}
          onMouseLeave={() => setHoveredZoneId(undefined)}
          onFocus={() => setHoveredZoneId(zone.id)}
          onBlur={() => setHoveredZoneId(undefined)}
          aria-label={`Abrir ${zone.name}`}
          aria-pressed={selected === zone.id}
          aria-describedby={activeZone?.id === zone.id ? "campus-zone-tooltip" : undefined}
        >
          <span className="sr-only">{zone.name}</span>
        </button>
      ))}
      {activeZone && (
        <div
          id="campus-zone-tooltip"
          className={`map-label ${activeZone.y < 18 ? "below" : ""}`}
          style={{
            left: `${Math.min(Math.max(activeZone.x + activeZone.width / 2, 16), 84)}%`,
            top:
              activeZone.y < 18
                ? `${activeZone.y + activeZone.height + 2}%`
                : `${Math.max(activeZone.y - 2, 4)}%`,
          }}
          role="tooltip"
        >
          <strong>{activeZone.name}</strong>
          <small>
            {hoveredZoneId === activeZone.id ? "Haz clic para ver detalles" : "Zona seleccionada"}
          </small>
        </div>
      )}
      {visiblePlaces.map((place) => (
        <button
          key={place.id}
          className={`map-marker cat-${place.category.toLowerCase()} ${selected === place.id ? "selected" : ""}`}
          style={{
            left: `${place.x}%`,
            top: `${place.y}%`,
            ...(place.id === "cafeteria-central" ? { padding: 0 } : {}),
            ...(place.id === "hamburguesas" ? { display: "grid" } : {}),
          }}
          onClick={() => onSelect(place.id)}
          aria-label={`${place.name}, ${place.category}`}
          aria-pressed={selected === place.id}
        >
          <Icon name={categoryMeta[place.category].icon} size={17} />
        </button>
      ))}
    </div>
  );
}

function InstagramPanel({
  urls,
  placeName,
  onClose,
}: {
  urls: readonly string[];
  placeName: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const currentUrl = urls[index];
  const embedUrl = `${currentUrl.replace(/\/$/, "")}/embed/captioned/`;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, a, iframe")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>("button, a, iframe"),
      ].filter((element) => !element.hasAttribute("disabled"));
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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop instagram-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="filter-panel instagram-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instagram-title"
        ref={panelRef}
      >
        <div className="panel-handle" aria-hidden="true" />
        <header>
          <div>
            <p className="mini-label">Publicación institucional</p>
            <h2 id="instagram-title">{placeName}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar Instagram">
            <Icon name="x" />
          </button>
        </header>
        <div className="instagram-content">
          <iframe
            key={currentUrl}
            src={embedUrl}
            title={`Publicación de Instagram de ${placeName}, ${index + 1} de ${urls.length}`}
            loading="lazy"
            allowFullScreen
          />
          {urls.length > 1 && (
            <div className="instagram-pagination">
              <button
                className="button secondary"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                disabled={index === 0}
              >
                Anterior
              </button>
              <span>
                {index + 1} de {urls.length}
              </span>
              <button
                className="button secondary"
                onClick={() => setIndex((current) => Math.min(urls.length - 1, current + 1))}
                disabled={index === urls.length - 1}
              >
                Siguiente
              </button>
            </div>
          )}
          <a
            className="button primary instagram-link"
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en Instagram
          </a>
        </div>
      </div>
    </div>
  );
}

function InstagramButton({ urls, placeName }: { urls: readonly string[]; placeName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="button secondary instagram-trigger" onClick={() => setOpen(true)}>
        <Icon name="camera" size={19} />
        Ver en Instagram
      </button>
      {open && <InstagramPanel urls={urls} placeName={placeName} onClose={() => setOpen(false)} />}
    </>
  );
}

function PlaceDetail({
  place,
  zone,
  routed,
}: {
  place?: Place;
  zone?: CampusZone;
  routed: boolean;
}) {
  if (zone)
    return (
      <aside className="place-detail card">
        <div className="section-row">
          <span className={`place-icon cat-${zone.category.toLowerCase()}`}>
            <Icon name={zone.icon ?? categoryMeta[zone.category]?.icon ?? "pin"} />
          </span>
          <span className="category-pill">Zona del campus</span>
        </div>
        <h2>{zone.name}</h2>
        <p className="muted">
          Seleccionaste esta zona en el mapa. Puedes enviarme su información y fotografías para
          completar esta ficha.
        </p>
        <div className="pending-content">
          <Icon name="info" />
          <div>
            {zone.info ? (
              <>
                <strong>Información del lugar</strong>
                <p>{zone.info}</p>
              </>
            ) : (
              <>
                <strong>Información pendiente</strong>
                <p>Horario, servicios, nivel de ruido y disponibilidad.</p>
              </>
            )}
          </div>
        </div>
        {zone.photo && (
          <div className="gallery" aria-label={`Galería de ${zone.name}`}>
            <figure className="photo-real">
              <img src={zone.photo.src} alt={zone.photo.alt} />
              <figcaption>{zone.photo.credit}</figcaption>
            </figure>
            {["Vista adicional", "Detalle"].map((label) => (
              <div className="photo-placeholder" key={label}>
                <Icon name="image" />
                <span>Foto pendiente</span>
                <small>{label}</small>
              </div>
            ))}
          </div>
        )}
        <RouteLink point={{ x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 }} />
        {zone.instagram?.length ? (
          <InstagramButton urls={zone.instagram} placeName={zone.name} />
        ) : null}
      </aside>
    );
  if (!place)
    return (
      <aside className="place-detail card empty-detail">
        <span className="large-pin">
          <Icon name="pin" size={30} />
        </span>
        <h2>Elige un lugar</h2>
        <p>Toca un marcador del mapa para conocer sus detalles.</p>
      </aside>
    );
  const placePhoto = place.photo;
  return (
    <aside className="place-detail card">
      {routed && (
        <div className="route-status">
          <Icon name="navigation" size={17} />
          <span>
            <strong>Ruta activa</strong> · Sigue la línea punteada
          </span>
        </div>
      )}
      <div className="section-row">
        <span className={`place-icon cat-${place.category.toLowerCase()}`}>
          <Icon name={categoryMeta[place.category].icon} />
        </span>
        <span className="category-pill">{place.category}</span>
      </div>
      <h2>{place.name}</h2>
      <p
        className="muted"
        style={place.id === "coase-bienestar" ? { overflowWrap: "anywhere" } : undefined}
      >
        {place.description}
      </p>
      <div className="detail-meta">
        <span>
          <Icon name="pin" size={17} />
          {textoDistancia(place.distance)}
        </span>
        <span>
          <Icon name="volume" size={17} />
          {place.noise}
        </span>
        <span>
          <Icon name="users" size={17} />
          {place.capacity} cupos
        </span>
      </div>
      <div className="schedule">
        <Icon name="clock" size={19} />
        <div>
          <small>Horario</small>
          <strong>{place.schedule}</strong>
        </div>
      </div>
      <div className="gallery" aria-label="Galería de imágenes pendientes">
        {placePhoto && (
          <figure className="photo-real">
            <img src={placePhoto.src} alt={placePhoto.alt} />
            <figcaption>{placePhoto.credit}</figcaption>
          </figure>
        )}
        {place.images.slice(placePhoto ? 1 : 0).map((label) => (
          <div className="photo-placeholder" key={label}>
            <Icon name="image" />
            <span>Foto pendiente</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <RouteLink point={place} />
      {place.instagram?.length ? (
        <InstagramButton urls={place.instagram} placeName={place.name} />
      ) : null}
    </aside>
  );
}

/** Rango del filtro de distancia (metros desde la entrada Cra. 11). */
const DISTANCIA_MIN = 30;
const DISTANCIA_MAX = 200;
const DISTANCIA_PASO = 10;

type ExploreFilters = {
  category: "Todas" | Category;
  distance: number;
  schedule: "Cualquiera" | "Abierto ahora";
  noise: "Todos" | Noise;
};
const exploreDefault: ExploreFilters = {
  category: "Todas",
  distance: DISTANCIA_MAX,
  schedule: "Cualquiera",
  noise: "Todos",
};

function ExplorePage({
  selected,
  routed,
  onSelect,
  openFilters,
  filters,
  places,
  campusZones,
}: {
  selected?: string;
  routed: boolean;
  onSelect: (id: string) => void;
  openFilters: () => void;
  filters: ExploreFilters;
  places: Place[];
  campusZones: CampusZone[];
}) {
  const visible = places.filter(
    (p) =>
      (filters.category === "Todas" || p.category === filters.category) &&
      p.distance <= filters.distance &&
      (filters.schedule === "Cualquiera" || p.openNow) &&
      (filters.noise === "Todos" || p.noise === filters.noise),
  );
  const place = places.find((p) => p.id === selected);
  const zone = campusZones.find((item) => item.id === selected);
  return (
    <div className="page explore-page">
      <PageTitle
        eyebrow="Muévete con confianza"
        title={
          <>
            Explora el <span className="accent-mark">campus</span>
          </>
        }
        text="Encuentra espacios cercanos y descubre qué hay en cada punto."
      />
      <div className="filter-bar">
        <p>
          <strong>{visible.length}</strong> lugares en el mapa
        </p>
        <button className="button secondary" onClick={openFilters}>
          <Icon name="sliders" size={19} />
          Ventana de filtros
        </button>
      </div>
      <div className="legend" aria-label="Leyenda del mapa">
        {(Object.keys(categoryMeta) as Category[]).map((cat) => (
          <span key={cat}>
            <i className={`legend-shape cat-${cat.toLowerCase()}`}>
              <Icon
                name={categoryMeta[cat].icon}
                size={12}
                className={cat === "Alimentación" ? "selected-icon-padding-zero" : ""}
              />
            </i>
            {cat}
          </span>
        ))}
      </div>
      <div className="explore-layout">
        <CampusMap
          selected={selected}
          route={routed}
          onSelect={onSelect}
          visiblePlaces={visible}
          places={places}
          campusZones={campusZones}
        />
        <PlaceDetail place={place} zone={zone} routed={routed} />
      </div>
    </div>
  );
}

function FilterModal({
  title,
  onClose,
  children,
  onClear,
  count,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onClear: () => void;
  count: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const panel = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("button, select, input")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panel) {
        const focusable = [...panel.querySelectorAll<HTMLElement>("button, select, input")];
        if (!focusable.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
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
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="filter-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        ref={ref}
      >
        <div className="panel-handle" aria-hidden="true" />
        <header>
          <div>
            <p className="mini-label">Personaliza tu búsqueda</p>
            <h2 id="filter-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar filtros">
            <Icon name="x" />
          </button>
        </header>
        <div className="filter-fields">{children}</div>
        <footer>
          <button className="button ghost" onClick={onClear}>
            Limpiar
          </button>
          <button className="button primary" onClick={onClose}>
            Ver {count} resultados
          </button>
        </footer>
      </div>
    </div>
  );
}

type AppProps = {
  user: SessionUser;
  initialProfile: StudentProfileState;
  onProfileChange: (profile: StudentProfileState) => Promise<void> | void;
  onSignOut: () => void;
  /** Contenido del campus (el original o el editado por los administradores). */
  content: CampusContent;
};

function App({
  user,
  initialProfile,
  onProfileChange,
  onSignOut,
  content,
}: AppProps) {
  const { places, zones: campusZones, services } = content;
  const discoverySections = useMemo(
    () => [
      { id: "activities", title: "Actividades", items: content.activities },
      { id: "clubs", title: "Clubes", items: content.clubs },
      { id: "opportunities", title: "Oportunidades", items: content.opportunities },
    ],
    [content.activities, content.clubs, content.opportunities],
  );
  const serviceFaculties = useMemo(
    () => [...new Set(services.map((service) => service.faculty).filter((f) => f !== "Todas"))],
    [services],
  );
  const [screen, setScreen] = useState<Screen>("match");
  const [history, setHistory] = useState<Screen[]>([]);
  const [need, setNeed] = useState<NeedId>("study");
  const [selectedPlace, setSelectedPlace] = useState<string>();
  const [routed, setRouted] = useState(false);
  const [modal, setModal] = useState<"discover" | "explore" | null>(null);
  const [discoverFilters, setDiscoverFilters] = useState(discoverDefault);
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>(exploreDefault);
  const [studentProfile, setStudentProfile] = useState<StudentProfileState>(initialProfile);
  const saveStudentProfile = (next: StudentProfileState) => {
    setStudentProfile(next);
    Promise.resolve(onProfileChange(next)).catch((error) => {
      console.error(error);
      window.alert("No se pudo guardar tu perfil en la nube. Revisa tu conexión.");
    });
  };
  const [dark, setDark] = useState(() => sessionStorage.getItem("campusmatch-theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    sessionStorage.setItem("campusmatch-theme", dark ? "dark" : "light");
  }, [dark]);
  const scrollToTop = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  const navigate = (next: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
    scrollToTop();
  };
  const goBack = () => {
    const previous = history.at(-1) ?? "match";
    setHistory((h) => h.slice(0, -1));
    setScreen(previous);
  };
  const goSection = (section: Section) => {
    setHistory((h) => [...h, screen]);
    setScreen(section);
    setRouted(false);
    scrollToTop();
  };
  const activeSection = screen === "result" ? "match" : screen;
  const selectedTags = useMemo(() => {
    const interestTags = profile.interests
      .filter((interest) => studentProfile.selectedInterests.includes(interest.label))
      .flatMap((interest) => interest.tags);
    const goalTags = profile.goals
      .filter((goal) => studentProfile.selectedGoals.includes(goal.label))
      .flatMap((goal) => goal.tags);
    return new Set([...interestTags, ...goalTags]);
  }, [studentProfile.selectedGoals, studentProfile.selectedInterests]);
  const discoverCount = useMemo(
    () =>
      services.filter(
        (s) =>
          (discoverFilters.faculty === "Todas" || s.faculty === discoverFilters.faculty) &&
          (discoverFilters.type === "Todos" || s.type === discoverFilters.type) &&
          (!discoverFilters.available || s.available),
      ).length,
    [discoverFilters, services],
  );
  const exploreCount = useMemo(
    () =>
      places.filter(
        (p) =>
          (exploreFilters.category === "Todas" || p.category === exploreFilters.category) &&
          p.distance <= exploreFilters.distance &&
          (exploreFilters.schedule === "Cualquiera" || p.openNow) &&
          (exploreFilters.noise === "Todos" || p.noise === exploreFilters.noise),
      ).length,
    [exploreFilters, places],
  );

  const nav = (
    <nav className="main-nav" aria-label="Navegación principal">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={activeSection === item.id ? "active" : ""}
          onClick={() => goSection(item.id)}
          aria-current={activeSection === item.id ? "page" : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="sparkles" size={21} />
          </span>
          <span>
            Campus<strong>Match</strong>
          </span>
        </div>
        <p className="tagline">
          Conecta lo que necesitas
          <br />
          con lo que eres.
        </p>
        {nav}
        <div className="sidebar-footer">
          <p>Universidad Militar Nueva Granada</p>
          <small>Sede Calle 100 · Bogotá</small>
          <button className="signout-button" onClick={onSignOut}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Icon name="sparkles" size={18} />
            </span>
            <strong>CampusMatch</strong>
          </div>
          <div className="user-menu">
            <ThemeToggle dark={dark} onChange={() => setDark(!dark)} />
            <button className="signout-button" onClick={onSignOut} aria-label="Cerrar sesión">
              Salir
            </button>
          </div>
        </header>
        <main id="main-content">
          {screen === "profile" && (
            <ProfilePage
              user={user}
              value={studentProfile}
              onSave={saveStudentProfile}
            />
          )}
          {screen === "match" && (
            <MatchPage
              choose={(id) => {
                setNeed(id);
                navigate("result");
                const match = recommendedPlace(id, places);
                if (match) void logMatch(user, id, match.id);
              }}
            />
          )}
          {screen === "result" && (
            <ResultPage
              need={need}
              places={places}
              onBack={goBack}
              onRoute={(id) => {
                setSelectedPlace(id);
                setRouted(true);
                navigate("explore");
              }}
            />
          )}
          {screen === "discover" && (
            <DiscoverPage
              filters={discoverFilters}
              openFilters={() => setModal("discover")}
              selectedTags={selectedTags}
              services={services}
              sections={discoverySections}
            />
          )}
          {screen === "explore" && (
            <ExplorePage
              selected={selectedPlace}
              routed={routed}
              onSelect={(id) => {
                setSelectedPlace(id);
                setRouted(false);
              }}
              filters={exploreFilters}
              openFilters={() => setModal("explore")}
              places={places}
              campusZones={campusZones}
            />
          )}
        </main>
        <div className="bottom-nav">{nav}</div>
      </div>
      {modal === "discover" && (
        <FilterModal
          title="Filtrar servicios"
          onClose={() => setModal(null)}
          onClear={() => setDiscoverFilters(discoverDefault)}
          count={discoverCount}
        >
          <label>
            Facultad
            <select
              value={discoverFilters.faculty}
              onChange={(e) => setDiscoverFilters({ ...discoverFilters, faculty: e.target.value })}
            >
              <option>Todas</option>
              {serviceFaculties.map((faculty) => (
                <option key={faculty}>{faculty}</option>
              ))}
            </select>
          </label>
          <label>
            Tipo de servicio
            <select
              value={discoverFilters.type}
              onChange={(e) => setDiscoverFilters({ ...discoverFilters, type: e.target.value })}
            >
              <option>Todos</option>
              {serviceTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="switch-field">
            <span>
              <strong>Disponibilidad</strong>
              <small>Mostrar solo disponibles ahora</small>
            </span>
            <input
              type="checkbox"
              checked={discoverFilters.available}
              onChange={(e) =>
                setDiscoverFilters({ ...discoverFilters, available: e.target.checked })
              }
            />
          </label>
        </FilterModal>
      )}
      {modal === "explore" && (
        <FilterModal
          title="Filtrar lugares"
          onClose={() => setModal(null)}
          onClear={() => setExploreFilters(exploreDefault)}
          count={exploreCount}
        >
          <label>
            Categoría
            <select
              value={exploreFilters.category}
              onChange={(e) =>
                setExploreFilters({
                  ...exploreFilters,
                  category: e.target.value as ExploreFilters["category"],
                })
              }
            >
              <option>Todas</option>
              {Object.keys(categoryMeta).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Distancia máxima desde la entrada Cra. 11 <strong>{exploreFilters.distance} m</strong>
            <input
              type="range"
              min={DISTANCIA_MIN}
              max={DISTANCIA_MAX}
              step={DISTANCIA_PASO}
              value={exploreFilters.distance}
              onChange={(e) =>
                setExploreFilters({ ...exploreFilters, distance: Number(e.target.value) })
              }
            />
          </label>
          <fieldset>
            <legend>Horario</legend>
            <div className="segmented">
              {(["Cualquiera", "Abierto ahora"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="schedule"
                    checked={exploreFilters.schedule === value}
                    onChange={() => setExploreFilters({ ...exploreFilters, schedule: value })}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Nivel de ruido
            <select
              value={exploreFilters.noise}
              onChange={(e) =>
                setExploreFilters({
                  ...exploreFilters,
                  noise: e.target.value as ExploreFilters["noise"],
                })
              }
            >
              <option>Todos</option>
              <option>Silencioso</option>
              <option>Moderado</option>
              <option>Activo</option>
            </select>
          </label>
        </FilterModal>
      )}
    </div>
  );
}

export default App;
