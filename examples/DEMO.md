# 🎬 DEMO - Herramienta KW Research

Esta es una **demostración visual** de cómo funciona la herramienta con datos de ejemplo del sector dental español.

## 🖥️ Ejecución del CLI

### Comando ejecutado:
```bash
npm start -- url \
  --url https://example.com/implantes-dentales \
  --country ES \
  --lang es \
  --limit 30 \
  --out ./examples/demo-output
```

### Output en consola:

```
🔍 Starting keyword research pipeline

Step 1/6: Fetching organic keywords from Ahrefs...
→ Connecting to Ahrefs API v3...
→ Fetching page 1 (limit: 30)...
✓ Fetched 30 keywords from Ahrefs

Step 2/6: Normalizing and deduplicating keywords...
→ Normalizing case, removing accents...
→ Grouping duplicates...
✓ After deduplication: 30 unique keywords

Step 3/6: Enriching with Google Ads metrics...
→ Connecting to Google Ads API...
→ Fetching historical metrics (batch 1/1)...
→ Cache hits: 5, Cache misses: 25
✓ Enriched 30 keywords with Google Ads data

Step 4/6: Classifying treatments and detecting intent...
→ Detecting dental treatments...
→ Detecting local intent (cities, neighborhoods)...
→ Detecting commercial intent (precio, financiación)...
✓ Classification complete

Step 5/6: Calculating scores...
→ Applying scoring formula (volume, CPC, KD, competition)...
→ Applying boosts (local +10, core +10, commercial +5)...
→ Average score: 71
→ High-score keywords (>70): 15 found
✓ Scoring complete

Step 6/6: Clustering by treatment...
→ Grouping by treatment...
→ Calculating cluster metrics...
✓ Created 12 clusters

Writing outputs...
→ ./examples/demo-output/keywords.csv
→ ./examples/demo-output/keywords.json
→ ./examples/demo-output/report.md

✅ Analysis complete!

📊 Results:
   - Total keywords: 30
   - High-score keywords (>70): 15
   - Treatment clusters: 12
   - Processing time: 45.23s

📁 Outputs written to: ./examples/demo-output
   - keywords.csv
   - keywords.json
   - report.md
```

---

## 📊 Resultados Generados

### 1️⃣ keywords.csv (Excel)

Archivo CSV con todas las keywords y métricas:

| Keyword | Volume | CPC | Competition | Score | Treatment | Intent |
|---------|--------|-----|-------------|-------|-----------|--------|
| dentista urgencias madrid 24h | 650 | 4.10€ | HIGH | **88** | urgencias | Local + Comercial ⭐ |
| implantes dentales madrid | 1500 | 3.20€ | HIGH | **85** | implantes | Local ⭐ |
| implantes dentales precio | 1350 | 3.00€ | HIGH | **84** | implantes | Comercial |
| blanqueamiento dental precio | 1200 | 2.20€ | MEDIUM | **82** | blanqueamiento | Comercial |
| ... | ... | ... | ... | ... | ... | ... |

**Puedes abrirlo en Excel para:**
- Ordenar por score
- Filtrar por tratamiento
- Analizar por ciudad
- Calcular totales de volumen

---

### 2️⃣ keywords.json (Datos estructurados)

Archivo JSON con toda la información:

```json
{
  "metadata": {
    "url": "https://example.com/implantes-dentales",
    "country": "ES",
    "totalKeywords": 30,
    "processingTime": 45230
  },
  "keywords": [
    {
      "keyword": "dentista urgencias madrid 24h",
      "score": 88,
      "avgMonthlySearches": 650,
      "cpcMicros": 4100000,
      "treatment": "urgencias",
      "hasLocalIntent": true,
      "city": "madrid",
      "hasCommercialIntent": true,
      "commercialSignals": ["urgencias", "24h"],
      "scoreBreakdown": {
        "volume": 26.0,
        "cpc": 16.4,
        "kd": 10.5,
        "competition": 10.0,
        "boosts": 15,
        "total": 88
      }
    },
    ...
  ],
  "clusters": [
    {
      "treatment": "implantes",
      "count": 7,
      "avgScore": 78,
      "totalVolume": 4710
    },
    ...
  ]
}
```

**Puedes usarlo para:**
- Integraciones con otras herramientas
- Análisis programático
- Importar a bases de datos
- Visualizaciones custom

---

### 3️⃣ report.md (Reporte legible)

Archivo Markdown con análisis y recomendaciones:

```markdown
# Keyword Research Report - Dental España

**Total Keywords:** 30
**Processing Time:** 45.23s

## 🎯 Top Opportunities (Score > 70)

Found 15 high-potential keywords:

| Keyword | Volume | Score | Treatment | Intent |
|---------|--------|-------|-----------|--------|
| dentista urgencias madrid 24h | 650 | 88 | urgencias | Local + Comercial |
| implantes dentales madrid | 1500 | 85 | implantes | Local |
| ...

## 📊 Clusters by Treatment

### Implantes (7 keywords, avg score: 78)
Total Volume: 4,710 | Core Treatment ⭐

**Top Keywords:**
- implantes dentales madrid (Score: 85, Volume: 1500)
- implantes dentales precio (Score: 84, Volume: 1350)
- ...

## 💡 Recommendations
- Focus on local SEO: 11 keywords with city targeting
- Core treatments: 12 keywords for implantes/ortodoncia
- Priority: Urgencias 24h Madrid (Score 88)
```

---

## 🎯 Análisis de los Resultados

### Top 5 Oportunidades

1. **dentista urgencias madrid 24h** (Score: 88)
   - ✅ Intención local (Madrid)
   - ✅ Intención comercial (urgencias, 24h)
   - ✅ CPC alto (4.10€) = alta intención de compra
   - 💡 **Acción:** Crear landing urgencias 24h específica para Madrid

2. **implantes dentales madrid** (Score: 85)
   - ✅ Tratamiento core (implantes) = +10 boost
   - ✅ Intención local (Madrid) = +10 boost
   - ✅ Volumen alto (1500 búsquedas/mes)
   - 💡 **Acción:** Optimizar página implantes para geo Madrid

3. **implantes dentales precio** (Score: 84)
   - ✅ Tratamiento core (implantes)
   - ✅ Intención comercial (precio) = +5 boost
   - ✅ Volumen muy alto (1350)
   - 💡 **Acción:** Añadir sección de precios transparentes

4. **blanqueamiento dental precio** (Score: 82)
   - ✅ Intención comercial (precio)
   - ✅ Volumen excelente (1200)
   - ✅ CPC bajo (2.20€) = menos competencia
   - 💡 **Acción:** Quick win, crear landing con precios

5. **implantes all on 4 precio** (Score: 80)
   - ✅ Tratamiento core + específico
   - ✅ Intención comercial
   - ✅ CPC muy alto (4.20€) = usuarios muy cualificados
   - 💡 **Acción:** Landing especializada All-on-4

### Distribución por Clusters

```
implantes     ████████████████ 7 kws (23%)  Avg Score: 78 ⭐
ortodoncia    ██████████████   5 kws (17%)  Avg Score: 72 ⭐
carillas      ███████████      4 kws (13%)  Avg Score: 71
blanqueamiento ██████████      4 kws (13%)  Avg Score: 70
urgencias     ███              2 kws (7%)   Avg Score: 83 ⚡
otros         ████████         8 kws (27%)  Avg Score: 63
```

### Intención Local (36%)

**Ciudades detectadas:**
- Madrid: 4 keywords
- Barcelona: 3 keywords
- Valencia: 1 keyword
- Sevilla: 1 keyword
- Málaga: 1 keyword
- Genérica ("cerca de mi"): 1 keyword

### Intención Comercial (43%)

**Señales detectadas:**
- "precio" / "precios": 8 keywords
- "financiación": 1 keyword
- "urgencias": 2 keywords
- "gratis": 1 keyword
- "baratos": 1 keyword

---

## 💻 Usos Prácticos

### 1. Planificación de Contenido
```
→ Identificar gaps: Keywords que competencia tiene y tú no
→ Priorizar: Empezar por score > 75
→ Crear estructura: Una landing por cluster de tratamiento
```

### 2. Estrategia SEO Local
```
→ Crear páginas geo-específicas: /implantes-madrid, /implantes-barcelona
→ Optimizar Google Business Profile por ciudad
→ Content hubs locales
```

### 3. Estrategia de Ads
```
→ Pujar más alto en: Score > 80 (alta conversión esperada)
→ Evitar: Score < 50 (bajo ROI)
→ Long-tail: KD < 30 + Score > 65 (quick wins)
```

### 4. Análisis de Competencia
```
→ Exportar sus keywords
→ Comparar con las tuyas
→ Identificar gaps y oportunidades
```

---

## 🎨 Visualizaciones Posibles

Con estos datos puedes crear:

📊 **Gráfico de dispersión:** Score vs Volumen
📈 **Gráfico de barras:** Keywords por tratamiento
🗺️ **Mapa de calor:** Oportunidades por ciudad
💰 **Matriz:** CPC vs Competition
🎯 **Priorización:** Score + Volumen + Difficulty

---

## 🔄 Workflow Completo

```
1. ANÁLISIS
   └─ Ejecutar herramienta con URL competidor
   └─ Revisar report.md para insights rápidos

2. PRIORIZACIÓN
   └─ Abrir keywords.csv en Excel
   └─ Filtrar score > 70
   └─ Ordenar por volumen DESC

3. PLANNING
   └─ Seleccionar top 10-20 keywords
   └─ Agrupar por intención (informacional, comercial, transaccional)
   └─ Crear mapa de contenido

4. EJECUCIÓN
   └─ Crear/optimizar landing pages
   └─ Implementar SEO on-page
   └─ Configurar campañas Ads

5. MEDICIÓN
   └─ Trackear posiciones (Ahrefs)
   └─ Analizar tráfico (GA4)
   └─ Medir conversiones
   └─ Re-analizar trimestral
```

---

## 📁 Archivos de Demo

Los ejemplos completos están en:

- [`keywords.csv`](demo-output/keywords.csv) - Abrir en Excel
- [`keywords.json`](demo-output/keywords.json) - Ver datos estructurados
- [`report.md`](demo-output/report.md) - Leer reporte completo

---

## ✨ Características Demostradas

✅ **Obtención de keywords** - 30 keywords orgánicas reales
✅ **Enriquecimiento** - Volumen, CPC, competencia de Google Ads
✅ **Clasificación** - 12 tratamientos dentales detectados
✅ **Intención local** - 11 keywords con ciudades españolas
✅ **Intención comercial** - 13 keywords con señales de compra
✅ **Scoring inteligente** - Sistema 0-100 con boosts aplicados
✅ **Clustering** - Agrupación automática por tratamiento
✅ **Outputs múltiples** - CSV (Excel) + JSON (data) + MD (report)

---

**Esto es solo una DEMO con 30 keywords. La herramienta real puede analizar 200, 500 o más keywords por URL.** 🚀
