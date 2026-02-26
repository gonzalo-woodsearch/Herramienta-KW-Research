# 🔑 Guía Completa de Credenciales

## Resumen Rápido

Necesitas **6 credenciales**:

| Credencial | De dónde | Tiempo | Dificultad |
|------------|----------|--------|------------|
| 1. AHREFS_API_KEY | Ahrefs.com | 2 min | ⭐ Fácil |
| 2. DEVELOPER_TOKEN | Google Ads | 5 min | ⭐⭐ Media |
| 3. CLIENT_ID | Google Cloud | 10 min | ⭐⭐ Media |
| 4. CLIENT_SECRET | Google Cloud | (mismo paso 3) | ⭐⭐ Media |
| 5. REFRESH_TOKEN | OAuth Playground | 5 min | ⭐⭐⭐ Compleja |
| 6. CUSTOMER_ID | Google Ads | 1 min | ⭐ Fácil |

**Tiempo total estimado:** 25-30 minutos

---

## 1️⃣ AHREFS_API_KEY

### Requisitos
- ✅ Cuenta Ahrefs activa (plan Standard, Advanced o Enterprise)
- ❌ El plan **Lite** NO tiene acceso a API

### Pasos

1. **Iniciar sesión en Ahrefs:**
   - https://ahrefs.com/
   - Login con tu cuenta

2. **Ir a configuración de API:**
   - Click en tu avatar (arriba derecha)
   - **Settings** → **API access**
   - O directamente: https://ahrefs.com/api

3. **Generar API Key:**
   - Si ya tienes una key, aparecerá aquí (cópiala)
   - Si no, click en **"Generate API token"**
   - Copiar la key generada

4. **Pegar en .env:**
   ```env
   AHREFS_API_KEY=abc123def456ghi789jkl012mno345pqr678
   ```

### Verificar límites
- Standard: 500 units/mes
- Advanced: 1500 units/mes
- 1 request de organic-keywords ≈ 1 unit
- Para 200 keywords/URL: ~1-2 units

---

## 2️⃣ GOOGLE_ADS_DEVELOPER_TOKEN

### Requisitos
- ✅ Cuenta Google Ads (puede ser nueva, incluso sin gasto)
- ✅ Cuenta verificada con billing (tarjeta añadida)

### Pasos

1. **Ir a Google Ads:**
   - https://ads.google.com/
   - Iniciar sesión

2. **Acceder a API Center:**
   - Click en **Tools & Settings** (🔧 icono de herramientas)
   - En el menú, buscar **Setup** → **API Center**

3. **Solicitar acceso:**
   - Si es tu primera vez:
     - Click en **"Apply for API access"**
     - Llenar formulario breve
     - Aceptar términos

4. **Copiar Developer Token:**
   - Una vez aprobado (instantáneo para cuentas nuevas)
   - Verás tu **Developer token** en la página
   - Copiar el token

5. **Pegar en .env:**
   ```env
   GOOGLE_ADS_DEVELOPER_TOKEN=ABcdEF12GHijKL34MNopQR56STuvWX78
   ```

### ⚠️ Importante: Modo Test vs Producción

**Cuentas nuevas:**
- Token en modo **"test"**
- Solo funciona con tu propia cuenta
- ✅ Suficiente para esta herramienta

**Para producción (si necesitas):**
- Solicitar "Basic Access" o "Standard Access"
- Requiere completar formulario de Google
- Aprobación tarda 24-48 horas
- **NO necesario** si solo analizas tus propias keywords

---

## 3️⃣ & 4️⃣ GOOGLE_ADS_CLIENT_ID + CLIENT_SECRET

### Requisitos
- ✅ Cuenta Google (la misma de Google Ads)

### Pasos Detallados

#### A. Crear Proyecto en Google Cloud

1. **Ir a Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Crear nuevo proyecto:**
   - Click en selector de proyectos (arriba, junto al logo)
   - Click en **"NEW PROJECT"**
   - Nombre del proyecto: `KW-Research-Tool`
   - Click **CREATE**
   - Esperar unos segundos a que se cree

3. **Seleccionar el proyecto:**
   - Asegurarte de que esté seleccionado (arriba)

#### B. Habilitar Google Ads API

1. **Ir a biblioteca de APIs:**
   - Menú hamburguesa (☰) → **APIs & Services** → **Library**

2. **Buscar Google Ads API:**
   - En el buscador, escribir: `Google Ads API`
   - Click en **"Google Ads API"**

3. **Habilitar:**
   - Click en botón azul **"ENABLE"**
   - Esperar a que se habilite (5-10 segundos)

#### C. Configurar OAuth Consent Screen

1. **Ir a OAuth consent screen:**
   - Menú → **APIs & Services** → **OAuth consent screen**

2. **Configurar:**
   - User Type: Seleccionar **"External"**
   - Click **CREATE**

3. **Llenar información (solo campos obligatorios):**
   - **App name**: `KW Research Tool`
   - **User support email**: Tu email
   - **App logo**: (opcional, dejar vacío)
   - **Application home page**: (opcional, dejar vacío)
   - **Developer contact information**: Tu email

4. **Scopes:**
   - Click **"SAVE AND CONTINUE"**
   - No añadir scopes adicionales
   - Click **"SAVE AND CONTINUE"**

5. **Test users:**
   - Click **"+ ADD USERS"**
   - Añadir tu email (el de Google Ads)
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

6. **Review:**
   - Click **"BACK TO DASHBOARD"**

#### D. Crear Credenciales OAuth

1. **Ir a Credentials:**
   - Menú → **APIs & Services** → **Credentials**

2. **Crear OAuth Client ID:**
   - Click **"+ CREATE CREDENTIALS"**
   - Seleccionar **"OAuth client ID"**

3. **Configurar:**
   - Application type: **"Desktop app"**
   - Name: `KW Research Desktop Client`
   - Click **"CREATE"**

4. **Copiar credenciales:**
   - Aparecerá un modal con:
     ```
     Your Client ID
     123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com

     Your Client Secret
     GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
     ```
   - Click en **"DOWNLOAD JSON"** (guardar por si acaso)
   - Copiar ambos valores

5. **Pegar en .env:**
   ```env
   GOOGLE_ADS_CLIENT_ID=123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```

---

## 5️⃣ GOOGLE_ADS_REFRESH_TOKEN

### Requisitos
- ✅ Client ID y Client Secret del paso anterior

### Pasos con OAuth2 Playground

1. **Ir a OAuth Playground:**
   - https://developers.google.com/oauthplayground/

2. **Configurar tus credenciales:**
   - Click en el icono **⚙️ (Settings)** arriba a la derecha
   - Marcar checkbox: ☑️ **"Use your own OAuth credentials"**
   - Pegar:
     - **OAuth Client ID**: (el del paso anterior)
     - **OAuth Client secret**: (el del paso anterior)
   - Click **"Close"** (la X)

3. **Autorizar API:**
   - En el panel izquierdo "Step 1 - Select & authorize APIs"
   - En el input box, buscar: `adwords`
   - Seleccionar: `https://www.googleapis.com/auth/adwords`
   - Click en botón azul **"Authorize APIs"**

4. **Login con Google:**
   - Te redirigirá a página de Google
   - Seleccionar tu cuenta (la de Google Ads)
   - Verás permisos que solicita la app
   - Click **"Continue"** o **"Allow"**
   - Te redirigirá de vuelta al playground

5. **Obtener tokens:**
   - Estarás en "Step 2 - Exchange authorization code for tokens"
   - Click en botón **"Exchange authorization code for tokens"**
   - Aparecerán en el panel derecho:
     ```json
     {
       "access_token": "ya29.a0...",
       "refresh_token": "1//0abc123...",
       "expires_in": 3599
     }
     ```

6. **Copiar SOLO el refresh_token:**
   - Copiar el valor de **"refresh_token"** (el que empieza con `1//`)
   - ⚠️ **MUY IMPORTANTE**: Es el refresh_token, NO el access_token

7. **Pegar en .env:**
   ```env
   GOOGLE_ADS_REFRESH_TOKEN=1//0abcDEF123ghiJKL456mnoPQR789stuvWXYZ
   ```

### Troubleshooting

**Error: "invalid_client"**
→ El Client ID o Secret no son correctos. Verificar que pegaste bien en settings.

**Error: "access_denied"**
→ No autorizaste los permisos. Repetir paso 4.

**No aparece refresh_token:**
→ Es posible que ya lo hayas generado antes. Para forzar nuevo token:
   - Settings → Marcar ☑️ **"Auto-refresh the token before it expires"**
   - Y marcar ☑️ **"Prompt for consent"**
   - Repetir desde paso 3

---

## 6️⃣ GOOGLE_ADS_CUSTOMER_ID

### Requisitos
- ✅ Cuenta Google Ads

### Pasos

1. **Ir a Google Ads:**
   - https://ads.google.com/
   - Iniciar sesión

2. **Ubicar Customer ID:**
   - Arriba a la derecha, junto a tu nombre
   - Verás un número como: `123-456-7890`
   - Este es tu Customer ID

3. **Quitar guiones:**
   - `123-456-7890` → `1234567890`

4. **Pegar en .env:**
   ```env
   GOOGLE_ADS_CUSTOMER_ID=1234567890
   ```

### ⚠️ Importante

- **SIN guiones**: `1234567890` ✅
- **CON guiones**: `123-456-7890` ❌

---

## ✅ Verificar que todo está correcto

Tu archivo `.env` debe verse así:

```env
# Ahrefs
AHREFS_API_KEY=abc123def456ghi789jkl012mno345pqr678

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=ABcdEF12GHijKL34MNopQR56STuvWX78
GOOGLE_ADS_CLIENT_ID=123456789012-abc123def456.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_ADS_REFRESH_TOKEN=1//0abcDEF123ghiJKL456mnoP
GOOGLE_ADS_CUSTOMER_ID=1234567890

# Opcional
CACHE_TTL_AHREFS=86400
CACHE_TTL_GOOGLE_ADS=604800
AHREFS_RATE_LIMIT=10
GOOGLE_ADS_RATE_LIMIT=5
LOG_LEVEL=info
```

## 🧪 Probar la configuración

Una vez tengas todas las credenciales:

```bash
# 1. Compilar
npm run build

# 2. Probar con una URL (usa una real de Ahrefs)
npm start -- url --url https://example.com/implantes-dentales --limit 10

# 3. Si todo funciona, verás:
# ✓ Fetched 10 keywords from Ahrefs
# ✓ Enriched 10 keywords with Google Ads data
# ✓ Classification complete
# ✓ Scoring complete
# ✅ Analysis complete!
```

## 🐛 Errores Comunes

### "Ahrefs API error: 401 Unauthorized"
→ AHREFS_API_KEY incorrecta o expirada

### "Google Ads API error: AUTHENTICATION_ERROR"
→ Alguna credencial de Google Ads incorrecta. Verificar las 5.

### "Missing required environment variable"
→ Falta una variable en .env o está mal escrita

### "No keywords found"
→ La URL no existe en Ahrefs o no tiene keywords orgánicas

---

## 📊 Costos

### Ahrefs
- **Standard**: $99/mes (500 units)
- **Advanced**: $179/mes (1500 units)
- **Consulta típica**: 1-2 units por URL

### Google Ads
- **API**: GRATIS ✅
- No hay costo por usar la API
- Solo pagas por los anuncios (si los creas)

---

## 🎯 Alternativas si no tienes las cuentas

### Sin Ahrefs
- **Alternativa**: Semrush API, Moz API
- **Limitación**: Tendrías que adaptar el código

### Sin Google Ads
- **Alternativa**: Usar solo Ahrefs (menos datos)
- **Solución**: Comentar el paso de Google Ads en el pipeline

---

## ✉️ ¿Necesitas ayuda?

Si tienes problemas obteniendo alguna credencial:

1. **Ahrefs**: Contactar soporte de Ahrefs
2. **Google Ads**: Ver docs oficiales: https://developers.google.com/google-ads/api/docs/get-started
3. **OAuth2**: Tutorial oficial: https://developers.google.com/identity/protocols/oauth2

---

**Una vez tengas todas las credenciales, la herramienta estará 100% funcional!** 🎉
