# CampusMatch · UMNG Calle 100 — Instrucciones para Claude Code

App web (React + Vite + TypeScript) exportada de Figma Make y convertida en MVP:
inicio de sesión con Google restringido a cuentas `@unimilitar.edu.co`, creación de
perfil en el primer ingreso (onboarding) y perfil guardado en Firestore. Se publica
en Firebase Hosting.

## Estructura
- `src/App.tsx` – la app (Perfil, Match, Descubre, Explora). Recibe el usuario y el perfil por props.
- `src/AuthGate.tsx` – login con Google, validación de dominio, onboarding de 3 pasos.
- `src/firebase.ts` – inicialización de Firebase desde variables `VITE_*`. Sin `.env` → **modo demo**.
- `src/profileStore.ts` – lee/guarda el perfil en `users/{uid}` (Firestore) o en localStorage (demo).
- `src/data.ts` – contenido de la universidad (lugares, servicios, programas, intereses, objetivos).
- `firestore.rules` – cada usuario solo lee/escribe su propio documento y solo con correo verificado @unimilitar.edu.co.
- `firebase.json` – Hosting de `dist/` como SPA.

## Tarea: dejar el MVP funcionando y publicado
Hazlo paso a paso y confirma con el usuario antes de crear recursos en la nube.

1. **Instalar y probar en local (modo demo)**
   - `npm install`
   - `npm run build` y corrige cualquier error de TypeScript o de build sin cambiar el diseño.
   - `npm run dev` y verifica en http://localhost:5173 que entra en modo demo, que el onboarding
     guarda el perfil y que Perfil, Match, Descubre y Explora funcionan.

2. **Crear el proyecto de Firebase** (pide confirmación al usuario y el ID que quiere usar)
   - `npx firebase login`
   - `npx firebase projects:create <id-unico>` (ej. `campusmatch-umng-g5`) o usa uno existente.
   - Pon ese ID en `.firebaserc`.
   - `npx firebase apps:create web campusmatch --project <id>`
   - `npx firebase apps:sdkconfig web --project <id>` y copia los valores a un archivo `.env`
     siguiendo `.env.example`. **No subas `.env` a git.**
   - Crea Firestore: `npx firebase firestore:databases:create "(default)" --location=southamerica-east1 --project <id>`

3. **Activar Google como proveedor** (no se puede por CLI: guía al usuario)
   - Consola de Firebase → Authentication → Comenzar → Método de acceso → Google → Habilitar,
     elegir correo de soporte → Guardar.
   - En Authentication → Configuración → Dominios autorizados deben estar `localhost`,
     `<id>.web.app` y `<id>.firebaseapp.com`.

4. **Probar el login real en local**
   - `npm run dev`, entrar con una cuenta `@unimilitar.edu.co`, completar el onboarding,
     recargar y comprobar que el perfil se mantiene (documento en Firestore → `users/{uid}`).
   - Probar con un Gmail personal: debe rechazarlo con el mensaje de dominio.

5. **Publicar**
   - `npm run deploy` (build + hosting + reglas de Firestore).
   - Entregar al usuario la URL `https://<id>.web.app`.

## Problemas conocidos a revisar
- Si al iniciar sesión Google muestra "Esta app está bloqueada" / "Acceso restringido", la
  administración de Google Workspace de la UMNG limita apps de terceros. Opciones: pedir a TIC que
  autorice la app (ID de cliente OAuth del proyecto) o, solo para pruebas, cambiar
  `VITE_ALLOWED_DOMAIN` y las reglas a otro dominio.
- Para lanzar fuera de "modo prueba", configurar la pantalla de consentimiento OAuth en Google Cloud
  (nombre de la app, logo, correo de soporte).
- Contenido marcado `[POR VERIFICAR]` en `src/data.ts` no está confirmado por la universidad.

## Convenciones
- Interfaz en español (Colombia). Mantener accesibilidad: contraste 4.5:1, objetivos táctiles ≥ 44 px, foco visible.
- No cambiar el diseño visual salvo para corregir errores.
