import { useEffect, useState } from "react";
import AdminPage from "./AdminPage";
import { withComputedDistances } from "./contentStore";
import { Icon, ThemeToggle } from "./ui";
import type { CampusContent, ContentKey, SessionUser } from "./types";

type AdminAppProps = {
  user: SessionUser;
  initialContent: CampusContent;
  onContentChange: <K extends ContentKey>(key: K, items: CampusContent[K]) => Promise<void>;
  /** Restaura una sección al contenido original y devuelve el contenido actualizado. */
  onContentReset: (key: ContentKey) => Promise<CampusContent>;
  onSignOut: () => void;
};

/** Interfaz del perfil administrador: separada de la app del estudiante. */
export default function AdminApp({
  user,
  initialContent,
  onContentChange,
  onContentReset,
  onSignOut,
}: AdminAppProps) {
  const [content, setContent] = useState<CampusContent>(initialContent);
  const [dark, setDark] = useState(() => sessionStorage.getItem("campusmatch-theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    sessionStorage.setItem("campusmatch-theme", dark ? "dark" : "light");
  }, [dark]);

  const saveContent = async <K extends ContentKey>(key: K, items: CampusContent[K]) => {
    const next = withComputedDistances(key, items);
    await onContentChange(key, next);
    setContent((current) => ({ ...current, [key]: next }));
  };
  const resetContent = async (key: ContentKey) => {
    setContent(await onContentReset(key));
  };

  return (
    <div className="app-shell admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="shield" size={21} />
          </span>
          <span>
            Campus<strong>Match</strong>
          </span>
        </div>
        <p className="tagline">
          Panel de administración
          <br />
          del contenido del campus.
        </p>
        <div className="admin-identity">
          <small>Sesión de administrador</small>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
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
              <Icon name="shield" size={18} />
            </span>
            <strong>CampusMatch · Admin</strong>
          </div>
          <div className="user-menu">
            <ThemeToggle dark={dark} onChange={() => setDark(!dark)} />
            <button className="signout-button" onClick={onSignOut} aria-label="Cerrar sesión">
              Salir
            </button>
          </div>
        </header>
        <main id="main-content">
          <AdminPage content={content} onSave={saveContent} onReset={resetContent} />
        </main>
      </div>
    </div>
  );
}
