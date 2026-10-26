# [Miniproyecto1] - FrontEnd

Organizador de Eventos Independientes — Mini-proyecto 1.

## Requisitos
- Node.js 20.19 o 22.12 en adelante, según los requisitos de Vite 8

## Instalación

\`\`\`bash
npm install
\`\`\`

## Correr en desarrollo

\`\`\`bash
npm run dev
\`\`\`

## API y build de producción

En desarrollo puedes copiar `.env.example` a `.env.local`; sin variable se usa la API local.
En Vercel configura `VITE_API_URL=https://backend-qs5z.onrender.com` en el entorno que despliegues.
La URL debe ser pública y HTTPS. El build falla si falta la variable o apunta a localhost.
Después de cambiar una variable en Vercel, es necesario volver a desplegar.

Para comprobar el build desde PowerShell, usando una variable solo para esa sesión:

```powershell
$env:VITE_API_URL = 'https://backend-qs5z.onrender.com'
npm run build
npm run preview
```

Las vistas y el layout se cargan por separado con `React.lazy`. Cada ruta muestra
“Cargando vista...” mientras descarga y ofrece “Reintentar” si falla la carga.
Para las comprobaciones automáticas del frontend: `node --test tests/*.test.mjs`.
Antes de aprobar rendimiento en producción, medir Lighthouse móvil y Network después
del despliegue; un build correcto no certifica los tiempos de la API ni Core Web Vitals.

## Carpetas

- `src/pages/` — vistas por ruta
- `src/components/` — componentes reutilizables
- `src/services/` — comunicación con la API
- `src/hooks/` — lógica reutilizable
- `src/routes/` — configuración de rutas
