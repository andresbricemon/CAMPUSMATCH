import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import App from "./App";
import AdminApp from "./AdminApp";
import { ALLOWED_DOMAIN, auth, firebaseEnabled, googleProvider, isAllowedEmail } from "./firebase";
import { loadProfile, saveProfile } from "./profileStore";
import { checkIsAdmin, loadContent, resetContentSection, saveContentSection } from "./contentStore";
import { profile as catalog, programs, semesters } from "./data";
import { Icon } from "./ui";
import type { CampusContent, SessionUser, StudentProfileState } from "./types";

/** Con qué perfil entra la persona: la app del estudiante o el panel de administración. */
type Role = "student" | "admin";

type Phase =
  | { kind: "loading" }
  | { kind: "signed-out"; error?: string }
  | { kind: "onboarding"; user: SessionUser; content: CampusContent }
  | { kind: "ready"; user: SessionUser; content: CampusContent; profile: StudentProfileState }
  | { kind: "admin"; user: SessionUser; content: CampusContent };

const ROLE_KEY = "campusmatch-role";

const DEMO_USERS: Record<Role, SessionUser> = {
  student: { uid: "demo", name: "Estudiante Demo", email: `demo@${ALLOWED_DOMAIN}`, photoURL: null },
  admin: {
    uid: "demo-admin",
    name: "Administrador Demo",
    email: `admin.demo@${ALLOWED_DOMAIN}`,
    photoURL: null,
  },
};

function storedRole(): Role {
  try {
    return sessionStorage.getItem(ROLE_KEY) === "admin" ? "admin" : "student";
  } catch {
    return "student";
  }
}

function toSessionUser(user: User): SessionUser {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "Estudiante",
    email: user.email || "",
    photoURL: user.photoURL,
  };
}

function applyStoredTheme() {
  document.documentElement.dataset.theme =
    sessionStorage.getItem("campusmatch-theme") === "dark" ? "dark" : "light";
}

export default function AuthGate() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>(storedRole);

  useEffect(applyStoredTheme, []);

  async function enter(user: SessionUser, as: Role) {
    try {
      if (as === "admin") {
        if (!(await checkIsAdmin(user))) {
          sessionStorage.removeItem(ROLE_KEY);
          if (firebaseEnabled && auth) await signOut(auth);
          setPhase({
            kind: "signed-out",
            error: `La cuenta ${user.email} no tiene permisos de administrador. Entra como estudiante o pide a un administrador que te dé acceso.`,
          });
          return;
        }
        setPhase({ kind: "admin", user, content: await loadContent() });
        return;
      }
      const [stored, content] = await Promise.all([loadProfile(user), loadContent()]);
      setPhase(
        stored
          ? { kind: "ready", user, content, profile: stored }
          : { kind: "onboarding", user, content },
      );
    } catch (error) {
      console.error(error);
      setPhase({
        kind: "signed-out",
        error: "No pudimos cargar tu información. Revisa tu conexión e intenta de nuevo.",
      });
    }
  }

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      const demo = sessionStorage.getItem("campusmatch-demo") === "1";
      if (demo) void enter(DEMO_USERS[storedRole()], storedRole());
      else setPhase({ kind: "signed-out" });
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPhase((current) =>
          current.kind === "signed-out" ? current : { kind: "signed-out" },
        );
        return;
      }
      if (!isAllowedEmail(user.email)) {
        await signOut(auth!);
        setPhase({
          kind: "signed-out",
          error: `Solo se permiten cuentas institucionales @${ALLOWED_DOMAIN}. Ingresaste con ${user.email}.`,
        });
        return;
      }
      // El rol elegido en la pantalla de inicio se guarda antes de abrir Google
      // para que sobreviva al inicio de sesión por redirección y a las recargas.
      await enter(toSessionUser(user), storedRole());
    });
  }, []);

  async function login() {
    sessionStorage.setItem(ROLE_KEY, role);
    setBusy(true);
    if (!firebaseEnabled || !auth) {
      sessionStorage.setItem("campusmatch-demo", "1");
      await enter(DEMO_USERS[role], role);
      setBusy(false);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider());
    } catch (error) {
      const code = (error as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, googleProvider());
        return;
      }
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        console.error(error);
        setPhase({ kind: "signed-out", error: "No se pudo iniciar sesión con Google. Intenta de nuevo." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    sessionStorage.removeItem("campusmatch-demo");
    sessionStorage.removeItem(ROLE_KEY);
    if (firebaseEnabled && auth) await signOut(auth);
    setPhase({ kind: "signed-out" });
  }

  if (phase.kind === "loading") {
    return (
      <div className="auth-screen" role="status" aria-live="polite">
        <p className="muted">Cargando CampusMatch…</p>
      </div>
    );
  }

  if (phase.kind === "signed-out") {
    return (
      <LoginScreen
        onLogin={login}
        busy={busy}
        error={phase.error}
        role={role}
        onRoleChange={setRole}
      />
    );
  }

  if (phase.kind === "onboarding") {
    return (
      <Onboarding
        user={phase.user}
        onCancel={logout}
        onDone={async (profile) => {
          await saveProfile(phase.user, profile);
          setPhase({ kind: "ready", user: phase.user, content: phase.content, profile });
        }}
      />
    );
  }

  const demoBanner = !firebaseEnabled && (
    <div className="demo-banner" role="note">
      Modo demo: el inicio de sesión real con Google se activa al configurar Firebase (.env).
    </div>
  );

  if (phase.kind === "admin") {
    return (
      <>
        {demoBanner}
        <AdminApp
          user={phase.user}
          initialContent={phase.content}
          onContentChange={(key, items) => saveContentSection(key, items, phase.user)}
          onContentReset={async (key) => {
            await resetContentSection(key);
            return loadContent();
          }}
          onSignOut={logout}
        />
      </>
    );
  }

  return (
    <>
      {demoBanner}
      <App
        user={phase.user}
        initialProfile={phase.profile}
        onProfileChange={(profile) => saveProfile(phase.user, profile)}
        onSignOut={logout}
        content={phase.content}
      />
    </>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const roleOptions: { id: Role; label: string; helper: string; icon: string }[] = [
  {
    id: "student",
    label: "Estudiante",
    helper: "Tu perfil, match, servicios y mapa",
    icon: "graduation",
  },
  {
    id: "admin",
    label: "Administrador",
    helper: "Gestiona lugares, servicios y actividades",
    icon: "shield",
  },
];

function LoginScreen({
  onLogin,
  busy,
  error,
  role,
  onRoleChange,
}: {
  onLogin: () => void;
  busy: boolean;
  error?: string;
  role: Role;
  onRoleChange: (role: Role) => void;
}) {
  const roleName = role === "admin" ? "administrador" : "estudiante";
  return (
    <main className="auth-screen">
      <section className="auth-card card" aria-labelledby="login-title">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>
            Campus<strong>Match</strong>
          </span>
        </div>
        <h1 id="login-title">Conecta lo que necesitas con lo que eres</h1>
        <p className="lead">
          Servicios, espacios y oportunidades de la Universidad Militar Nueva Granada, sede Calle 100.
        </p>
        <fieldset className="role-picker">
          <legend>¿Cómo quieres entrar?</legend>
          <div className="role-options">
            {roleOptions.map((option) => (
              <label key={option.id} className={`role-option ${role === option.id ? "active" : ""}`}>
                <input
                  type="radio"
                  name="login-role"
                  value={option.id}
                  checked={role === option.id}
                  onChange={() => onRoleChange(option.id)}
                />
                <span className="role-icon" aria-hidden="true">
                  <Icon name={option.icon} size={22} />
                </span>
                <strong>{option.label}</strong>
                <small>{option.helper}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="google-button" onClick={onLogin} disabled={busy}>
          <GoogleLogo />
          {busy
            ? "Abriendo Google…"
            : firebaseEnabled
              ? `Entrar como ${roleName}`
              : `Entrar en modo demo como ${roleName}`}
        </button>
        <p className="auth-note">
          {firebaseEnabled
            ? role === "admin"
              ? `Usa tu correo @${ALLOWED_DOMAIN} autorizado como administrador.`
              : `Usa tu correo @${ALLOWED_DOMAIN}.`
            : "Firebase no está configurado: se usará un perfil de prueba guardado en este navegador."}
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

function Onboarding({
  user,
  onDone,
  onCancel,
}: {
  user: SessionUser;
  onDone: (profile: StudentProfileState) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState<StudentProfileState>({
    career: "",
    faculty: "",
    semester: "",
    selectedInterests: [],
    selectedGoals: [],
  });

  const toggle = (key: "selectedInterests" | "selectedGoals", item: string) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(item)
        ? current[key].filter((value) => value !== item)
        : [...current[key], item],
    }));

  const chooseProgram = (career: string) => {
    const faculty = programs.find((group) => group.programs.some((p) => p === career))?.faculty ?? "";
    setDraft((current) => ({ ...current, career, faculty }));
  };

  const canContinue =
    step === 0
      ? Boolean(draft.career && draft.semester)
      : step === 1
        ? draft.selectedInterests.length > 0
        : draft.selectedGoals.length > 0;

  async function finish() {
    setSaving(true);
    setError(undefined);
    try {
      await onDone(draft);
    } catch (e) {
      console.error(e);
      setError("No pudimos guardar tu perfil. Intenta de nuevo.");
      setSaving(false);
    }
  }

  const firstName = user.name.split(" ")[0];

  return (
    <main className="auth-screen">
      <div className="page onboarding">
        <div className="onboarding-steps" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= step ? "done" : ""} />
          ))}
        </div>
        <p className="eyebrow">Paso {step + 1} de 3</p>
        <h1 className="page-title" style={{ fontSize: 30, fontWeight: 800 }}>
          {step === 0 && <>Hola, {firstName}. ¿Qué estudias?</>}
          {step === 1 && <>¿Qué te mueve?</>}
          {step === 2 && <>¿Qué quieres lograr este semestre?</>}
        </h1>

        {step === 0 && (
          <section className="card">
            <label>
              Programa
              <select
                className="academic-select"
                value={draft.career}
                onChange={(e) => chooseProgram(e.target.value)}
              >
                <option value="" disabled>
                  Elige tu programa
                </option>
                {programs.map((group) => (
                  <optgroup key={group.faculty} label={group.faculty}>
                    {group.programs.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Semestre
              <select
                className="academic-select"
                value={draft.semester}
                onChange={(e) => setDraft((c) => ({ ...c, semester: e.target.value }))}
              >
                <option value="" disabled>
                  Elige tu semestre
                </option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {draft.faculty && <p className="save-status">Facultad: {draft.faculty}</p>}
          </section>
        )}

        {step === 1 && (
          <section className="card">
            <p className="muted">Elige uno o varios. Con esto te mostramos lo que es “Para ti”.</p>
            <div className="chips">
              {catalog.interests.map((interest) => {
                const active = draft.selectedInterests.includes(interest.label);
                return (
                  <button
                    key={interest.label}
                    className={`chip ${active ? "active" : ""}`}
                    aria-pressed={active}
                    onClick={() => toggle("selectedInterests", interest.label)}
                  >
                    {active ? "✓ " : ""}
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="card">
            <ul className="goals">
              {catalog.goals.map((goal) => {
                const active = draft.selectedGoals.includes(goal.label);
                return (
                  <li key={goal.label}>
                    <button
                      className={`goal-toggle ${active ? "active" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggle("selectedGoals", goal.label)}
                    >
                      <span className="check-dot" aria-hidden="true">
                        {active ? "✓" : ""}
                      </span>
                      {goal.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <div className="button-row">
          <button
            className="button secondary"
            onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
            disabled={saving}
          >
            {step === 0 ? "Cerrar sesión" : "Atrás"}
          </button>
          {step < 2 ? (
            <button className="button primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continuar
            </button>
          ) : (
            <button className="button primary" disabled={!canContinue || saving} onClick={finish}>
              {saving ? "Guardando…" : "Crear mi perfil"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
