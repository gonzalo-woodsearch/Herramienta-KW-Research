# 🎯 Próximos Pasos - Configuración Inicial

## ✅ Proyecto Completado

La herramienta de investigación de keywords para clínicas dentales está **100% implementada** y lista para usar.

## 📋 Checklist de Verificación

### 1️⃣ Verificar Node.js

```bash
node --version
# Debe ser v18 o superior
```

Si no tienes Node.js instalado:
- Descargar de: https://nodejs.org/
- Instalar la versión LTS (Long Term Support)

### 2️⃣ Instalar Dependencias

```bash
cd "C:\Users\WoodSearch3\Desktop\Herramienta KW Research"
npm install
```

Esto instalará:
- `google-ads-api` - SDK oficial Google Ads
- `commander` - CLI framework
- `@modelcontextprotocol/sdk` - MCP server
- `csv-writer` - Generador de CSV
- Y otras dependencias

### 3️⃣ Configurar Credenciales

**Ahrefs API:**
1. Ir a https://ahrefs.com/api
2. Generar API key (requiere suscripción Ahrefs)
3. Copiar la key

**Google Ads API:**
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Ads API
3. Crear credenciales OAuth2
4. Solicitar Developer Token
5. Obtener Refresh Token

**Crear archivo .env:**

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
AHREFS_API_KEY=tu_key_real_aqui
GOOGLE_ADS_DEVELOPER_TOKEN=tu_token
GOOGLE_ADS_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=tu_secret
GOOGLE_ADS_REFRESH_TOKEN=tu_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

### 4️⃣ Compilar el Proyecto

```bash
npm run build
```

Esto generará la carpeta `dist/` con el código JavaScript compilado.

### 5️⃣ Probar la Herramienta

**Opción A: Modo desarrollo (sin compilar)**
```bash
npm run dev -- url --url https://example.com/implantes --limit 20
```

**Opción B: Modo producción (compilado)**
```bash
npm start -- url --url https://example.com/implantes --limit 20
```

**Importante**: La URL debe:
- Existir en la base de datos de Ahrefs
- Tener keywords orgánicas
- Coincidir exactamente (con/sin www, http/https)

### 6️⃣ Revisar Resultados

Los outputs se generan en `./output/`:

```bash
# Ver reporte Markdown
notepad output\report.md

# Abrir CSV en Excel
start output\keywords.csv

# Ver JSON
notepad output\keywords.json
```

## 🎓 Guías de Ayuda

### Para empezar rápido
→ [QUICKSTART.md](QUICKSTART.md)

### Documentación completa
→ [README.md](README.md)

### Detalles de implementación
→ [IMPLEMENTATION.md](IMPLEMENTATION.md)

## 🔧 Comandos Útiles

```bash
# Verificar instalación
npm run lint

# Modo desarrollo (más rápido, no requiere compilar)
npm run dev -- url --url <URL>

# Limpiar y recompilar
rm -rf dist && npm run build

# Ver cache stats
npm start -- cache --stats

# Limpiar cache
npm start -- cache --clear
```

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
npm run build
```

### Error: "Missing environment variable"
→ Revisa tu archivo `.env` y asegúrate de tener todas las variables

### Error: "Ahrefs API 401"
→ Tu API key es inválida o expirada

### Error: "No keywords found"
→ La URL no tiene keywords orgánicas en Ahrefs, prueba otra URL

### Error: compilación TypeScript
→ Verifica que tienes TypeScript:
```bash
npm install -g typescript
```

## 📊 Estructura del Proyecto

```
Herramienta KW Research/
├── 📄 Archivos de configuración
│   ├── package.json          # Dependencias y scripts
│   ├── tsconfig.json          # Config TypeScript
│   ├── .env.example          # Template credenciales
│   └── .gitignore            # Archivos a ignorar en git
│
├── 📚 Documentación
│   ├── README.md             # Documentación completa
│   ├── QUICKSTART.md         # Guía rápida
│   ├── IMPLEMENTATION.md     # Resumen técnico
│   └── NEXT_STEPS.md         # Este archivo
│
├── 📁 src/ (código fuente)
│   ├── api/                  # Clientes Ahrefs + Google Ads
│   ├── analysis/             # Clustering + Scoring
│   ├── cli/                  # Comandos CLI
│   ├── mcp/                  # MCP Server
│   ├── output/               # Writers (CSV, JSON, MD)
│   ├── utils/                # Utilidades (retry, cache, etc)
│   ├── config.ts             # Carga de configuración
│   └── types.ts              # Tipos TypeScript
│
├── 📦 dist/ (generado con npm run build)
│   └── [código JavaScript compilado]
│
├── 📂 examples/
│   ├── urls.txt              # URLs de ejemplo
│   └── mcp-config.json       # Config MCP para Claude
│
└── 📂 output/ (generado al ejecutar)
    ├── keywords.csv
    ├── keywords.json
    └── report.md
```

## 🎯 Objetivos del Proyecto

✅ **Sustituir scraping por APIs oficiales**
- Ahrefs API v3 para organic keywords
- Google Ads API para métricas de búsqueda

✅ **Especialización sector dental España**
- 12 tratamientos clasificados automáticamente
- 50+ ciudades españolas detectadas
- Intención comercial (precio, financiación, urgencias)

✅ **Scoring inteligente 0-100**
- Boosts para local + tratamientos core
- Penalizaciones por KD y competencia

✅ **Outputs múltiples**
- CSV para análisis en Excel
- JSON para integraciones
- Markdown para reportes legibles

✅ **CLI + MCP Server**
- Uso por línea de comandos
- Integración con Claude Desktop

## 🚀 Listo para Producción

Una vez configurado y probado, la herramienta está lista para:

1. **Análisis de competidores**: Obtener keywords de URLs competidoras
2. **Investigación de mercado**: Descubrir oportunidades de keywords
3. **Planificación de contenido**: Priorizar keywords según score
4. **SEO local**: Identificar keywords con intención local
5. **Estrategia de Ads**: Estimar CPCs y competencia

## 📞 Soporte

- **Documentación**: Ver README.md
- **Guía rápida**: Ver QUICKSTART.md
- **Problemas técnicos**: Revisar logs (LOG_LEVEL=debug en .env)

---

**¡Éxito con tu investigación de keywords!** 🦷🚀
