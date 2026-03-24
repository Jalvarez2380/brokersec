# CI/CD y Monitoreo en BROKERSEC

Este repositorio ya queda preparado con una base de automatizacion sobre GitHub Actions, despliegue a Render y monitoreo del backend para PostgreSQL.

## Que se agrego

### 1. Pipeline de backend

Archivo: `.github/workflows/backend-ci.yml`

Se ejecuta en `push` y `pull_request` cuando hay cambios en `backend/`.

Incluye:

- instalacion de dependencias con `npm ci`
- pruebas automaticas con `npm run test:ci`
- publicacion del artefacto de cobertura

### 2. Pipeline de app movil

Archivo: `.github/workflows/mobile-ci.yml`

Se ejecuta en `push` y `pull_request` cuando hay cambios en `app-ionic/`.

Incluye:

- instalacion de dependencias con `npm ci`
- validacion TypeScript con `npm run typecheck`
- build web con `npm run build`
- sincronizacion de Capacitor Android con `npx cap sync android`
- publicacion del artefacto `dist`

### 3. Monitoreo programado del backend

Archivo: `.github/workflows/backend-monitor.yml`

Se ejecuta manualmente o cada 30 minutos. La idea es monitorear el backend desplegado usando el endpoint:

- `/api/health/live` para disponibilidad del servicio

Para activarlo en GitHub, crea el secret:

- `BACKEND_HEALTHCHECK_URL`

Ejemplo:

```text
https://tu-backend.com/api/health/live
```

Si el endpoint no responde con exito, el workflow falla y deja trazabilidad en Actions.

### 4. Despliegue continuo del backend a Render

Archivos:

- `.github/workflows/backend-deploy-render.yml`
- `render.yaml`

El flujo propuesto es:

1. se hace push a `main`
2. corre `Backend CI`
3. si las pruebas pasan, GitHub Actions dispara el deploy hook de Render
4. Render despliega el backend y valida `/api/health/ready`

Para activar el deploy automatico por GitHub Actions, crea el secret:

- `RENDER_DEPLOY_HOOK_URL`

Ese valor lo entrega Render al crear el servicio.

## Infraestructura Render lista para PostgreSQL

El archivo `render.yaml` define:

- un servicio web `brokersec-backend`
- una base `brokersec-postgres`
- el enlace automatico de `DATABASE_URL` desde la base al backend
- `healthCheckPath` en `/api/health/ready`

Variables importantes:

- `DATABASE_URL`: se llena desde Render automaticamente
- `JWT_SECRET`: se genera automaticamente
- `INTERNAL_API_KEY`: se genera automaticamente
- `OPENWEATHER_API_KEY`: se configura manualmente en Render
- `CORS_ORIGIN`: se configura manualmente en Render

## Health checks agregados al backend

Se ampliaron los endpoints de salud para que el monitoreo y los pipelines tengan objetivos claros:

- `GET /api/health/live`
  Devuelve estado del servicio, version, entorno y uptime.
- `GET /api/health/ready`
  Verifica si la aplicacion esta lista para recibir trafico, incluyendo conexion a base de datos.
- `GET /api/health/db`
  Devuelve informacion detallada de conectividad PostgreSQL.

## Como encaja esto en la arquitectura

En BROKERSEC, CI/CD funciona como una capa transversal de aseguramiento de calidad:

- el backend se valida antes de integrarse
- la app movil se compila automaticamente antes de publicarse
- el monitoreo revisa si el backend desplegado sigue disponible

Esto reduce errores manuales, mejora la trazabilidad y permite justificar arquitectonicamente que el sistema no solo tiene frontend y backend, sino tambien una capa operativa automatizada.

## Que sigue si quieres acercarte a CD real

Lo siguiente recomendable seria:

1. crear el Blueprint en Render usando `render.yaml`
2. cargar `OPENWEATHER_API_KEY` y `CORS_ORIGIN`
3. agregar `RENDER_DEPLOY_HOOK_URL` en GitHub Secrets
4. generar build Android release o AAB en GitHub Actions
5. conectar alertas a correo, Slack o Discord
6. incorporar analisis de seguridad con `npm audit` o CodeQL
