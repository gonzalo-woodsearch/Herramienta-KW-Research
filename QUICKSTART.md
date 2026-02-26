# 🚀 Quick Start Guide

Guía rápida para empezar a usar la herramienta en 5 minutos.

## 1. Instalar dependencias

```bash
cd "C:\Users\WoodSearch3\Desktop\Herramienta KW Research"
npm install
```

## 2. Configurar credenciales

Crea el archivo `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Edita `.env` y añade tus credenciales:

```env
AHREFS_API_KEY=tu_key_aqui
GOOGLE_ADS_DEVELOPER_TOKEN=tu_token
GOOGLE_ADS_CLIENT_ID=tu_client_id
GOOGLE_ADS_CLIENT_SECRET=tu_secret
GOOGLE_ADS_REFRESH_TOKEN=tu_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

## 3. Compilar el proyecto

```bash
npm run build
```

## 4. Probar con una URL

```bash
npm start -- url --url https://example.com/implantes-dentales --limit 50
```

Los resultados aparecerán en `./output/`:
- `keywords.csv` - Todas las keywords con métricas
- `keywords.json` - Datos estructurados + clusters
- `report.md` - Reporte legible con top oportunidades

## 5. Ver los resultados

```bash
# Windows
notepad output/report.md

# O abrir en Excel
start output/keywords.csv
```

## 🎯 Comandos útiles

```bash
# Análisis completo con 200 keywords
npm start -- url --url https://tuurl.com --limit 200 --out ./resultados

# Ver estadísticas de cache
npm start -- cache --stats

# Limpiar cache
npm start -- cache --clear

# Modo desarrollo (sin compilar)
npm run dev -- url --url https://tuurl.com
```

## 📊 Interpretar los resultados

### Score (0-100)
- **90+**: Oportunidad excepcional → Prioridad máxima
- **70-89**: Alta prioridad → Crear contenido
- **50-69**: Oportunidad media → Considerar
- **< 50**: Baja prioridad → Depende de estrategia

### Clusters
Revisa los clusters en `report.md` para ver qué tratamientos tienen más oportunidades.

### Top Keywords
Las keywords con score > 70 son las mejores oportunidades. Enfócate en:
- Keywords con ciudad específica (local intent)
- Tratamientos core (implantes, ortodoncia)
- Señales comerciales (precio, financiación)

## ⚠️ Problemas comunes

**No encuentra keywords**: La URL debe existir en Ahrefs y tener keywords orgánicas.

**Error de API**: Verifica que tus credenciales en `.env` sean correctas.

**Límite de rate**: Espera unos minutos o ajusta `AHREFS_RATE_LIMIT` en `.env`.

## 🆘 Ayuda

Ver el [README.md](README.md) completo para documentación detallada.

---

¡Listo! Ahora puedes analizar keywords de competidores para tu clínica dental 🦷
