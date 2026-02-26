# 🦷 Keyword Research Tool - Dental España

Herramienta profesional de investigación de keywords para clínicas dentales en España que combina **Ahrefs API v3** + **Google Ads API** para obtener datos reales de keywords orgánicas y métricas de búsqueda.

## 🎯 Features

- ✅ **NO scraping** - Usa APIs oficiales exclusivamente
- 🔍 **Ahrefs API v3** - Obtiene keywords orgánicas reales por URL
- 📊 **Google Ads API** - Enriquece con volumen, CPC y competencia
- 🦷 **Clustering Dental** - Clasifica automáticamente 12+ tratamientos dentales
- 📍 **Detección Local** - Identifica ciudades, barrios e intención local
- 💰 **Detección Comercial** - Detecta señales de intención de compra
- 🎯 **Scoring Inteligente** - Sistema de puntuación 0-100 con boosts específicos
- 📁 **Múltiples Outputs** - CSV, JSON y Markdown
- 🔧 **CLI + MCP Server** - Uso por línea de comandos o integración con Claude

## 📋 Prerequisitos

- Node.js 18+
- Cuenta **Ahrefs** con acceso a API v3
- Cuenta **Google Ads** con acceso a API

## 🚀 Instalación

```bash
# Clonar/descargar el proyecto
cd "Herramienta KW Research"

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Compilar TypeScript
npm run build
```

## ⚙️ Configuración

Crea un archivo `.env` con tus credenciales:

```env
# Ahrefs API v3
AHREFS_API_KEY=tu_api_key_de_ahrefs

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=tu_developer_token
GOOGLE_ADS_CLIENT_ID=tu_client_id
GOOGLE_ADS_CLIENT_SECRET=tu_client_secret
GOOGLE_ADS_REFRESH_TOKEN=tu_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890

# Opcional: Cache y Rate Limiting
CACHE_TTL_AHREFS=86400
CACHE_TTL_GOOGLE_ADS=604800
AHREFS_RATE_LIMIT=10
GOOGLE_ADS_RATE_LIMIT=5
LOG_LEVEL=info
```

### Obtener credenciales Google Ads

1. Crear cuenta Google Ads (si no tienes)
2. Solicitar Developer Token: https://developers.google.com/google-ads/api/docs/get-started/dev-token
3. Configurar OAuth2: https://developers.google.com/google-ads/api/docs/oauth/overview
4. Obtener Refresh Token usando el OAuth2 Playground

## 📖 Uso - CLI

### Comando principal: `kwtool url`

```bash
# Ejemplo básico
npm start -- url --url https://example.com/implantes-dentales

# Con opciones personalizadas
npm start -- url \
  --url https://tudentalclinic.com/ortodoncia-invisible \
  --country ES \
  --lang es \
  --limit 200 \
  --out ./resultados
```

### Opciones disponibles

| Opción | Descripción | Default |
|--------|-------------|---------|
| `--url` | URL exacta a analizar (debe existir en Ahrefs) | **Requerido** |
| `--country` | Código país para targeting (ES, MX, etc.) | `ES` |
| `--lang` | Idioma para Google Ads (es, en, etc.) | `es` |
| `--limit` | Máximo de keywords a obtener | `100` |
| `--out` | Directorio de salida | `./output` |

### Gestión de cache

```bash
# Ver estadísticas de cache
npm start -- cache --stats

# Limpiar cache
npm start -- cache --clear
```

## 📊 Outputs

El comando genera 3 archivos en el directorio especificado:

### 1. `keywords.csv`

CSV con todas las keywords y sus métricas:

```csv
Keyword,Volume,CPC (EUR),Competition,KD,Treatment,Local Intent,City,Commercial Intent,Score,URL,Position
implantes dentales madrid,1500,3.20,HIGH,45,implantes,Yes,madrid,Yes,85,https://...,3
precio ortodoncia invisible,890,2.80,MEDIUM,38,ortodoncia,No,N/A,Yes,78,https://...,5
```

### 2. `keywords.json`

JSON estructurado con metadata, keywords y clusters:

```json
{
  "metadata": {
    "url": "https://...",
    "country": "ES",
    "timestamp": "2026-02-26T10:30:00Z",
    "totalKeywords": 250
  },
  "keywords": [ ... ],
  "clusters": [
    {
      "treatment": "implantes",
      "count": 45,
      "avgScore": 72,
      "totalVolume": 25000,
      "topKeywords": [ ... ]
    }
  ]
}
```

### 3. `report.md`

Reporte en Markdown legible con:
- Top oportunidades (score > 70)
- Clusters por tratamiento
- Recomendaciones estratégicas

## 🔧 Uso - MCP Server

Integra la herramienta con Claude Desktop u otros clientes MCP.

### Configuración MCP

Añade a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kw-research-dental": {
      "command": "node",
      "args": ["C:/ruta/a/tu/proyecto/dist/mcp/server.js"],
      "env": {
        "AHREFS_API_KEY": "tu_key",
        "GOOGLE_ADS_CLIENT_ID": "tu_client_id",
        "GOOGLE_ADS_CLIENT_SECRET": "tu_secret",
        "GOOGLE_ADS_REFRESH_TOKEN": "tu_token",
        "GOOGLE_ADS_CUSTOMER_ID": "1234567890",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "tu_dev_token"
      }
    }
  }
}
```

### Tools disponibles

#### 1. `ahrefsOrganicKeywordsByUrl`

Obtiene keywords orgánicas de Ahrefs para una URL.

```json
{
  "url": "https://example.com/implantes",
  "country": "es",
  "limit": 100
}
```

#### 2. `googleAdsHistoricalMetrics`

Enriquece keywords con métricas de Google Ads.

```json
{
  "keywords": ["implantes dentales", "ortodoncia invisible"],
  "geo": "ES",
  "lang": "es"
}
```

#### 3. `clusterAndScore`

Analiza keywords: clasifica tratamientos, detecta intención y calcula scores.

```json
{
  "keywords": [ /* array de keyword objects */ ]
}
```

#### 4. `buildReport`

Genera reportes en CSV, JSON y Markdown.

```json
{
  "keywords": [ /* analyzed keywords */ ],
  "clusters": [ /* clusters */ ],
  "url": "https://example.com"
}
```

## 🦷 Tratamientos Dentales Detectados

El sistema clasifica automáticamente estos tratamientos:

| Tratamiento | Keywords ejemplo |
|-------------|------------------|
| **implantes** ⭐ | implantes dentales, cigomáticos, all on 4 |
| **ortodoncia** ⭐ | invisalign, brackets, ortodoncia invisible |
| carillas | carillas dentales, porcelana, composite |
| blanqueamiento | blanqueamiento dental, láser |
| endodoncia | endodoncia, matar nervio |
| periodoncia | encías, gingivitis, periodontitis |
| urgencias | urgencias dentales, 24h |
| limpieza | limpieza dental, higiene bucal |
| extraccion | extraer muela, muelas del juicio |
| cirugia | cirugía oral, maxilofacial |
| protesis | prótesis dental, coronas, puentes |
| odontopediatria | dentista niños, infantil |

⭐ = Tratamientos "core" (boost +10 en scoring)

## 📍 Detección de Intención

### Intención Local

Detecta ciudades, barrios y patrones locales:

- **Ciudades**: Madrid, Barcelona, Valencia, Sevilla, Málaga, etc. (50+ ciudades)
- **Barrios**: Chamberí, Eixample, Ruzafa, etc.
- **Patrones**: "cerca de mí", "zona norte", "abierto hoy", "24h"

**Boost**: +10 puntos si tiene ciudad específica

### Intención Comercial

Detecta señales de intención de compra:

- **Precio**: precio, cuánto cuesta, coste, tarifa
- **Financiación**: financiado, a plazos, sin intereses
- **Ofertas**: oferta, promoción, descuento, primera visita gratis
- **Urgencia**: urgencias, urgente, hoy mismo

**Boost**: +5 puntos si incluye señales prioritarias (precio, financiación, urgencias)

## 🎯 Sistema de Scoring (0-100)

### Fórmula Base

```
Score = (Volume × 40%) + (CPC × 20%) - (KD × 30%) - (Competition × 10%) + Boosts
```

### Componentes

| Componente | Peso | Rango | Descripción |
|------------|------|-------|-------------|
| Volume | 40% | 0-40 pts | Volumen de búsquedas (0-10k/mes) |
| CPC | 20% | 0-20 pts | Coste por clic (0-5€) |
| KD | -30% | 0-30 pts | Keyword Difficulty (penalización) |
| Competition | -10% | 0-10 pts | Competencia Ads (penalización) |
| **Boosts** | +25 pts max | - | Ver tabla abajo |

### Boosts

| Boost | Puntos | Condición |
|-------|--------|-----------|
| Local + Ciudad | +10 | Keyword incluye ciudad específica |
| Tratamiento Core | +10 | Implantes u ortodoncia |
| Comercial | +5 | Incluye precio, financiación o urgencias |

### Interpretación

- **90-100**: Oportunidad excepcional
- **70-89**: Alta prioridad
- **50-69**: Oportunidad media
- **< 50**: Baja prioridad

## 📁 Estructura del Proyecto

```
kw-research/
├── src/
│   ├── api/
│   │   ├── ahrefs/         # Cliente Ahrefs API v3
│   │   ├── google-ads/     # Cliente Google Ads API
│   │   └── cache.ts        # Sistema de cache
│   ├── analysis/
│   │   ├── clustering/     # Normalización, clasificación, clustering
│   │   └── scoring/        # Sistema de scoring + boosts
│   ├── cli/                # CLI commands
│   ├── mcp/                # MCP Server + tools
│   ├── output/             # Writers (CSV, JSON, MD)
│   └── utils/              # Utilities (retry, rate-limiter, logger)
├── dist/                   # Compiled JavaScript
├── examples/               # Ejemplos de uso
├── tests/                  # Tests unitarios
└── output/                 # Resultados por defecto
```

## ⚡ Performance

- **Cache inteligente**: Ahrefs (24h TTL), Google Ads (7d TTL)
- **Rate limiting**: Respeta límites de APIs automáticamente
- **Retry con backoff**: 3 intentos automáticos en caso de error
- **Paginación**: Obtiene hasta el límite especificado automáticamente

## 🐛 Troubleshooting

### Error: "Missing required environment variable"

→ Verifica que tu archivo `.env` tenga todas las variables requeridas.

### Error: "Ahrefs API error: 401"

→ Tu API key de Ahrefs es inválida o ha expirado.

### Error: "No keywords found"

→ La URL no existe en la base de datos de Ahrefs o no tiene keywords orgánicas.

### Error: "Google Ads API error"

→ Verifica tus credenciales OAuth2 y que el refresh token sea válido.

## 📊 Costos Estimados

### Ahrefs API

- **Standard**: ~$99/mes (500 units/mes)
- **Advanced**: ~$179/mes (1500 units/mes)
- **Enterprise**: Custom pricing

1 request a organic-keywords = ~1 unit

### Google Ads API

- **Gratis** para cuentas con gasto activo en Google Ads
- Si no tienes gasto, necesitas cuenta MCC (Centro de cliente)

## 🔒 Seguridad

- ✅ Las credenciales se almacenan en `.env` (excluido de git)
- ✅ Cache en memoria (no persiste datos sensibles)
- ✅ Rate limiting evita abusos de API
- ✅ Logs no incluyen credenciales

## 📝 License

MIT License - Uso libre para proyectos comerciales y personales.

## 🤝 Contribuciones

Pull requests bienvenidos. Para cambios mayores, abre un issue primero.

## 📧 Soporte

Para dudas o problemas:
1. Revisa la sección Troubleshooting
2. Verifica los logs (nivel DEBUG en .env)
3. Abre un issue con detalles del error

---

**Desarrollado para clínicas dentales en España** 🦷🇪🇸

*Powered by Ahrefs API v3 + Google Ads API*
