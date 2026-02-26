# 🎯 EMPIEZA AQUÍ - Setup Completo

## ✅ Estado del Proyecto

**La herramienta está 100% implementada y lista para usar.**

Solo necesitas **configurar tus credenciales de API** y ya estará funcional.

---

## 🚀 Setup en 4 Pasos (30 minutos)

### Paso 1: Instalar Dependencias (2 min)

```bash
cd "C:\Users\WoodSearch3\Desktop\Herramienta KW Research"
npm install
```

Esto instalará todas las librerías necesarias.

---

### Paso 2: Obtener Credenciales (25 min)

Necesitas **6 credenciales** de 2 servicios:

#### 📍 Ahrefs (1 credencial)
- **AHREFS_API_KEY** → Ver sección abajo

#### 📍 Google Ads (5 credenciales)
- **DEVELOPER_TOKEN**
- **CLIENT_ID**
- **CLIENT_SECRET**
- **REFRESH_TOKEN**
- **CUSTOMER_ID**

**👉 Guía completa paso a paso:**
- **[CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md)** ← LEE ESTO PRIMERO

---

### Paso 3: Configurar .env (1 min)

Ya he creado el archivo `.env` por ti. Solo necesitas **editarlo** y pegar tus credenciales:

```bash
# Abrir con editor de texto
notepad .env
```

Reemplaza los placeholders `PEGAR_TU_...` con tus credenciales reales:

```env
AHREFS_API_KEY=tu_key_real_aqui
GOOGLE_ADS_DEVELOPER_TOKEN=tu_token_real
GOOGLE_ADS_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=tu_secret_real
GOOGLE_ADS_REFRESH_TOKEN=tu_refresh_token_real
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

---

### Paso 4: Verificar y Compilar (2 min)

```bash
# 1. Verificar credenciales
npm run verify

# Si todo está OK:
# ✅ TODAS LAS CREDENCIALES VERIFICADAS
# 🚀 La herramienta está lista para usar!

# 2. Compilar
npm run build
```

---

## 🎉 ¡Listo! Pruébalo

```bash
# Analizar una URL (reemplaza con una real de Ahrefs)
npm start -- url --url https://example.com/implantes-dentales --limit 50

# Verás el progreso:
# Step 1/6: Fetching organic keywords from Ahrefs...
# ✓ Fetched 50 keywords from Ahrefs
# Step 2/6: Normalizing and deduplicating keywords...
# ...
# ✅ Analysis complete!
```

**Resultados en:** `./output/`
- `keywords.csv` - Para Excel
- `keywords.json` - Datos estructurados
- `report.md` - Reporte legible

---

## 📖 Documentación Disponible

| Archivo | Descripción | Para quién |
|---------|-------------|------------|
| **[CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md)** | Guía paso a paso para obtener todas las credenciales | ⭐ Esencial |
| [QUICKSTART.md](QUICKSTART.md) | Guía rápida de uso | Después del setup |
| [README.md](README.md) | Documentación completa | Referencia |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Detalles técnicos | Avanzado |

---

## 🔑 Resumen: Credenciales Necesarias

### 1. AHREFS_API_KEY

**¿Dónde obtenerla?**
1. https://ahrefs.com/ → Login
2. Settings → API access
3. Copiar tu API key

**Requisito:** Cuenta Ahrefs (Standard, Advanced o Enterprise)

---

### 2-6. Google Ads (5 credenciales)

**¿Dónde obtenerlas?**

Sigue la guía completa en **[CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md)**

Resumen:
- **Developer Token** → Google Ads (ads.google.com)
- **Client ID + Secret** → Google Cloud Console (console.cloud.google.com)
- **Refresh Token** → OAuth Playground (developers.google.com/oauthplayground)
- **Customer ID** → Google Ads (arriba a la derecha)

**Requisito:** Cuenta Google Ads (puede ser gratis, sin gasto)

---

## ⚠️ ¿No tienes alguna cuenta?

### Sin Ahrefs
- **Alternativa**: Prueba gratis 7 días en https://ahrefs.com/
- **O**: Usa otra API (Semrush, Moz) adaptando el código

### Sin Google Ads
- **Crear cuenta**: Es gratis → https://ads.google.com/
- No necesitas gastar dinero, solo tener cuenta
- **Alternativa**: La herramienta funcionará solo con Ahrefs (menos datos)

---

## 🐛 Problemas Comunes

### "npm: command not found"
→ Instala Node.js: https://nodejs.org/ (versión LTS)

### "Missing required environment variable"
→ Edita el archivo `.env` y completa todas las credenciales

### Script "verify" falla
→ Revisa que las credenciales en `.env` sean correctas
→ Especialmente verifica el **REFRESH_TOKEN** (suele ser el problemático)

### "No keywords found"
→ La URL que estás probando no existe en Ahrefs
→ Prueba con una URL que tenga tráfico orgánico real

---

## 📊 Ejemplo de Uso Real

```bash
# 1. Analizar página de competidor
npm start -- url \
  --url https://clinica-dental-ejemplo.com/implantes-dentales-madrid \
  --limit 200 \
  --out ./analisis-competidor

# 2. Ver top oportunidades
cat ./analisis-competidor/report.md

# 3. Abrir en Excel para análisis detallado
start ./analisis-competidor/keywords.csv
```

---

## 🎯 Checklist Final

Antes de contactarme para resolver dudas, verifica:

- [ ] Node.js instalado (v18+)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` editado con credenciales reales
- [ ] Ejecutado `npm run verify` con éxito
- [ ] Compilado con `npm run build`
- [ ] Probado con URL real de Ahrefs

Si todos los checks están ✅, la herramienta funciona!

---

## 💡 ¿Qué hace esta herramienta?

Dada una URL de competidor:

1. **Obtiene** todas las keywords orgánicas por las que rankea (Ahrefs)
2. **Enriquece** con volumen, CPC y competencia (Google Ads)
3. **Clasifica** por tratamiento dental (implantes, ortodoncia, etc.)
4. **Detecta** intención local (ciudades) y comercial (precio, financiación)
5. **Puntúa** cada keyword (0-100) con boosts inteligentes
6. **Genera** reportes priorizados en CSV, JSON y Markdown

**Resultado:** Sabes exactamente qué keywords atacar primero para tu clínica dental 🦷

---

## 🆘 Necesitas Ayuda

### Para configurar credenciales
→ [CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md) (súper detallado)

### Para usar la herramienta
→ [QUICKSTART.md](QUICKSTART.md)

### Documentación completa
→ [README.md](README.md)

### Dudas técnicas
→ [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

**¡A por ello! Una vez configurado, tendrás una herramienta profesional de análisis de keywords.** 🚀
