# KW Research Web App

Aplicación web Next.js que expone la herramienta de keyword research como un servicio web.

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu AHREFS_API_KEY

# Ejecutar en desarrollo
npm run dev

# Abrir http://localhost:3000
```

## 📦 Deploy en Vercel

### Opción 1: Deploy desde GitHub (Recomendado)

1. Push el código a GitHub
2. Ir a [vercel.com](https://vercel.com)
3. Importar el repositorio
4. Vercel detectará automáticamente Next.js
5. Configurar las variables de entorno:
   - `AHREFS_API_KEY`: Tu API key de Ahrefs
6. Deploy!

### Opción 2: Deploy con CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar variables de entorno cuando te lo pida
```

## 🔑 Variables de Entorno Requeridas

En Vercel, configura:

```
AHREFS_API_KEY=tu_api_key_aqui
CACHE_TTL_AHREFS=86400
AHREFS_RATE_LIMIT=10
LOG_LEVEL=info
```

## 📖 Uso

1. Abrir la URL de tu deployment
2. Ingresar URL del competidor
3. Seleccionar límite de keywords
4. Click en "Analizar"
5. Ver resultados en tiempo real

## ⚠️ Límites

- **Vercel Free Tier:**
  - 100 GB bandwidth/mes
  - 100 GB-hours compute/mes
  - Timeout máximo: 60 segundos

- **Recomendaciones:**
  - Límite máximo 200 keywords por análisis
  - Cada análisis toma 10-30 segundos

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Backend:** Next.js API Routes (serverless)
- **Styling:** CSS Modules + Variables CSS
- **Deploy:** Vercel
- **APIs:** Ahrefs API v3

## 📁 Estructura

```
web/
├── app/
│   ├── api/analyze/route.ts  # API endpoint
│   ├── page.tsx               # Página principal
│   ├── layout.tsx             # Layout raíz
│   └── globals.css            # Estilos globales
├── lib/
│   └── analyze.ts             # Lógica de análisis
├── package.json
└── vercel.json
```
