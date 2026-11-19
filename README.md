# CampusMatch · UMNG Calle 100

Conecta a los estudiantes de la Universidad Militar Nueva Granada (sede Calle 100) con servicios,
espacios y oportunidades según su perfil.

## Correr en tu computador
Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Sin configurar Firebase la app corre en **modo demo** (perfil guardado en
el navegador).

## Activar el inicio de sesión con Google y publicar
Sigue `CLAUDE.md` (o pídeselo a Claude Code: "lee CLAUDE.md y deja el MVP publicado").
Resumen: crear proyecto Firebase → copiar la configuración a `.env` → habilitar Google en
Authentication → `npm run deploy`.

## Qué incluye el MVP
- Inicio de sesión con la cuenta institucional `@unimilitar.edu.co` (Google).
- Creación de perfil en 3 pasos: programa y semestre, intereses, objetivos.
- Perfil guardado en la nube (Firestore) y editable desde la sección Perfil.
- Match por necesidad, Descubre con distintivo "Para ti", mapa del campus con fotos y publicaciones de Instagram.
- **Dos perfiles al iniciar sesión**: *Estudiante* (la app de siempre) o *Administrador*, una interfaz aparte para
  añadir, editar o eliminar lugares del mapa, servicios, actividades, clubes y oportunidades (y editar los textos y
  fotos de las zonas del mapa).

## Nombrar administradores
Un usuario es administrador si existe el documento `admins/{correo}` en Firestore:
Consola de Firebase → Firestore Database → Iniciar colección `admins` → ID del documento = el correo
**en minúsculas** (ej. `nombre.apellido@unimilitar.edu.co`) → agrega cualquier campo (ej. `rol: "admin"`) → Guardar.
Luego, en la pantalla de inicio, elige **Administrador** y entra con esa cuenta. Si una cuenta sin ese documento elige
Administrador, se le niega el acceso. En modo demo se puede entrar con cualquiera de los dos perfiles.
