import { useEffect, useMemo, useRef, useState } from "react";
import {
  campusZones,
  categoryMeta,
  discoverySections,
  needs,
  places,
  profile,
  programs,
  recommendations,
  semesters,
  services,
  type Category,
  type NeedId,
  type Noise,
} from "./data";
import campusMapImage from "./assets/campus-map.png";
import { initialsFrom, type SessionUser, type StudentProfileState } from "./types";

type Section = "profile" | "match" | "discover" | "explore";
type Screen = Section | "result";
type IconName = string;

const iconPaths: Record<string, React.ReactNode> = {
  user: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.1 3.4A3 3 0 0 1 9 8.3L5.5 9.5 9 10.7a3 3 0 0 1 1.9 1.9L12 16l1.1-3.4a3 3 0 0 1 1.9-1.9l3.5-1.2L15 8.3a3 3 0 0 1-1.9-1.9Z" />
      <path d="m5 3 .5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5Z" />
      <path d="m19 17 .6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" />
      <path d="M8 3v15M16 6v15" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  utensils: (
    <>
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 7 0 9" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5Z" />
      <path d="M4 6.5v13M8 7h8" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  activity: <polyline points="3 12 7 12 10 5 14 19 17 12 21 12" />,
  arrowLeft: (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  graduation: (
    <>
      <path d="m2 10 10-5 10 5-10 5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4Z" />
      <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  x: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  navigation: (
    <>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
      <path d="m11 13 11-11" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12.5" r="4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  car: (
    <>
      <path d="m5 17-1 2v2M19 17l1 2v2M5 17h14l-1.5-6h-11Z" />
      <path d="M7 11 9 7h6l2 4M7 17h.01M17 17h.01" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z" />
      <path d="M4 21c3-6 7-9 12-12" />
    </>
  ),
};

function Icon({
  name,
  size = 22,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Perfil", icon: "user" },
  { id: "match", label: "Match", icon: "sparkles" },
  { id: "discover", label: "Descubre", icon: "compass" },
  { id: "explore", label: "Explora", icon: "map" },
];

function ThemeToggle({ dark, onChange }: { dark: boolean; onChange: () => void }) {
  return (
    <button
      className="theme-toggle"
      onClick={onChange}
      aria-label={`Cambiar a tema ${dark ? "claro" : "oscuro"}`}
      title={`Tema ${dark ? "claro" : "oscuro"}`}
    >
      <Icon name={dark ? "moon" : "sun"} size={18} />
      <span className="hidden sm:inline">{dark ? "Oscuro" : "Claro"}</span>
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

function PageTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: string;
}) {
  return (
    <header className="page-title stagger">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {text && <p className="lead">{text}</p>}
    </header>
  );
}

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

function ResultPage({
  need,
  onBack,
  onRoute,
}: {
  need: NeedId;
  onBack: () => void;
  onRoute: (id: string) => void;
}) {
  const place = places.find((item) => item.id === recommendations[need])!;
  const needLabel = needs.find((item) => item.id === need)?.label;
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
            <strong>{place.distance} m</strong>
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
          <button className="button primary wide" onClick={() => onRoute(place.id)}>
            <Icon name="navigation" size={19} />
            Llévame allí
          </button>
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
  section: (typeof discoverySections)[number];
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
        {section.items.map((item) => (
          <div className="discovery-item" key={item.title}>
            <span className="item-dot" />
            <div>
              <div className="item-title-row">
                <strong>{item.title}</strong>
                {item.tags.some((tag) => selectedTags.has(tag)) && (
                  <span className="personal-badge">Para ti</span>
                )}
              </div>
              {item.meta && <p>{item.meta}</p>}
              {"url" in item && (
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
}: {
  openFilters: () => void;
  filters: DiscoverFilters;
  selectedTags: ReadonlySet<string>;
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
              key={service.title}
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
                {"url" in service && (
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
        {discoverySections.map((section) => (
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
}: {
  selected?: string;
  route?: boolean;
  onSelect: (id: string) => void;
  visiblePlaces: (typeof places)[number][];
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
  place?: (typeof places)[number];
  zone?: (typeof campusZones)[number];
  routed: boolean;
}) {
  if (zone)
    return (
      <aside className="place-detail card">
        <div className="section-row">
          <span className={`place-icon cat-${zone.category.toLowerCase()}`}>
            <Icon name={"icon" in zone ? zone.icon : categoryMeta[zone.category].icon} />
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
            {"info" in zone ? (
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
        {"photo" in zone && (
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
        {"instagram" in zone && <InstagramButton urls={zone.instagram} placeName={zone.name} />}
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
  const placePhoto = "photo" in place ? place.photo : undefined;
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
          <Icon name="pin" size={17} />A {place.distance} m
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
      {"instagram" in place && <InstagramButton urls={place.instagram} placeName={place.name} />}
    </aside>
  );
}

type ExploreFilters = {
  category: "Todas" | Category;
  distance: number;
  schedule: "Cualquiera" | "Abierto ahora";
  noise: "Todos" | Noise;
};
const exploreDefault: ExploreFilters = {
  category: "Todas",
  distance: 1000,
  schedule: "Cualquiera",
  noise: "Todos",
};

function ExplorePage({
  selected,
  routed,
  onSelect,
  openFilters,
  filters,
}: {
  selected?: string;
  routed: boolean;
  onSelect: (id: string) => void;
  openFilters: () => void;
  filters: ExploreFilters;
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
          visiblePlaces={[...visible]}
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
};

function App({ user, initialProfile, onProfileChange, onSignOut }: AppProps) {
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
    [discoverFilters],
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
    [exploreFilters],
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
            <ProfilePage user={user} value={studentProfile} onSave={saveStudentProfile} />
          )}
          {screen === "match" && (
            <MatchPage
              choose={(id) => {
                setNeed(id);
                navigate("result");
              }}
            />
          )}
          {screen === "result" && (
            <ResultPage
              need={need}
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
            </select>
          </label>
          <label>
            Tipo de servicio
            <select
              value={discoverFilters.type}
              onChange={(e) => setDiscoverFilters({ ...discoverFilters, type: e.target.value })}
            >
              <option>Todos</option>
              <option>Bienestar</option>
              <option>Salud</option>
              <option>Académico</option>
              <option>Profesional</option>
              <option>Movilidad</option>
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
            Distancia máxima <strong>{exploreFilters.distance} m</strong>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
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
