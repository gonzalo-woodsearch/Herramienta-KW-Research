'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';

type LocalLevel = 'none' | 'national' | 'regional' | 'city' | 'neighborhood' | 'ultralocal';
type IntentType = 'transaccional' | 'informacional' | 'comercial' | 'local' | 'general';

interface Keyword {
  keyword: string;
  position?: number;
  traffic?: number;
  ahrefsVolume?: number;
  url: string;
  treatment?: string | null;
  hasLocalIntent?: boolean;
  localLevel?: LocalLevel;
  city?: string;
  neighborhood?: string;
  region?: string;
  localScore?: number;
  hasCommercialIntent?: boolean;
  intentType?: IntentType;
  score?: number;
}

const INTENT_META: Record<IntentType, { label: string; color: string; bg: string; border: string; desc: string }> = {
  transaccional: { label: 'Transaccional', color: '#15803d', bg: '#f0fdf4', border: '#86efac', desc: 'Usuario listo para contratar' },
  informacional: { label: 'Informacional', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', desc: 'Usuario buscando información' },
  comercial:     { label: 'Comercial',     color: '#c2410c', bg: '#fff7ed', border: '#fdba74', desc: 'Usuario comparando precios' },
  local:         { label: 'Local',         color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd', desc: 'Búsqueda con intención geográfica' },
  general:       { label: 'General',       color: '#475569', bg: '#f8fafc', border: '#cbd5e1', desc: 'Intención no clasificada' },
};

interface Cluster {
  treatment: string;
  count: number;
  avgScore: number;
  totalVolume: number;
}

interface AnalysisResult {
  keywords: Keyword[];
  clusters: Cluster[];
  metadata: {
    url: string;
    country: string;
    totalKeywords: number;
    highScoreKeywords: number;
    processingTime: number;
  };
}

function getPositionClass(pos?: number): string {
  if (!pos) return 'posGray';
  if (pos <= 3) return 'posGreen';
  if (pos <= 10) return 'posYellow';
  return 'posRed';
}

const LOCAL_LEVEL_LABELS: Record<LocalLevel, { label: string; emoji: string; cls: string }> = {
  ultralocal: { label: 'Ultra-local', emoji: '🎯', cls: 'localUltra' },
  neighborhood: { label: 'Barrio',     emoji: '🏘️', cls: 'localHood'  },
  city:         { label: 'Ciudad',     emoji: '🏙️', cls: 'localCity'  },
  regional:     { label: 'Regional',   emoji: '🗺️', cls: 'localReg'   },
  national:     { label: 'Nacional',   emoji: '📍', cls: 'localNat'   },
  none:         { label: '',           emoji: '',   cls: ''            },
};

function getScoreColor(score?: number): string {
  if (!score) return '#e5e7eb';
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function exportCSV(keywords: Keyword[], domain: string) {
  const headers = ['Keyword', 'Posicion', 'Trafico', 'Volumen', 'Tratamiento', 'Local', 'Ciudad', 'Comercial', 'Score', 'URL'];
  const rows = keywords.map(kw => [
    kw.keyword, kw.position || '', kw.traffic || 0, kw.ahrefsVolume || 0,
    kw.treatment || 'sin clasificar', kw.hasLocalIntent ? 'Si' : 'No',
    kw.city || '', kw.hasCommercialIntent ? 'Si' : 'No', kw.score || 0, kw.url,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kw-${domain}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'keywords' | 'clusters' | 'local'>('keywords');
  const [filterTreatment, setFilterTreatment] = useState('all');
  const [filterIntent, setFilterIntent] = useState<IntentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'traffic' | 'position'>('score');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    setFilterTreatment('all'); setFilterIntent('all'); setActiveTab('keywords');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, country: 'ES', lang: 'es', limit }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally { setLoading(false); }
  };

  const domain = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : '';

  const treatments = useMemo(() => {
    if (!result) return [];
    return Array.from(new Set(result.keywords.map(k => k.treatment || 'sin clasificar'))).sort();
  }, [result]);

  const filteredKeywords = useMemo(() => {
    if (!result) return [];
    let kws = result.keywords;
    if (filterTreatment !== 'all') kws = kws.filter(k => (k.treatment || 'sin clasificar') === filterTreatment);
    if (filterIntent !== 'all') kws = kws.filter(k => (k.intentType || 'general') === filterIntent);
    return [...kws].sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'traffic') return (b.traffic || 0) - (a.traffic || 0);
      return (a.position || 999) - (b.position || 999);
    });
  }, [result, filterTreatment, filterIntent, sortBy]);

  const intentCounts = useMemo(() => {
    if (!result) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: result.keywords.length };
    for (const kw of result.keywords) {
      const t = kw.intentType || 'general';
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [result]);

  const maxCount = result ? Math.max(...result.clusters.map(c => c.count), 1) : 1;

  const searchForm = (compact: boolean) => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <span className={styles.inputIcon}>🌐</span>
        <input
          type="url" value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://www.clinicadental.com" required
          className={styles.urlInput}
        />
      </div>
      {!compact && (
        <div className={styles.intentPicker}>
          <span className={styles.intentPickerLabel}>¿Qué tipo de keywords te interesan?</span>
          <div className={styles.intentPickerChips}>
            {([['all', '🔎', 'Todas'], ['transaccional', '🛒', 'Transaccionales'], ['informacional', '📚', 'Informacionales'], ['comercial', '💼', 'Comparativas'], ['local', '📍', 'Locales']] as const).map(([v, emoji, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilterIntent(v as IntentType | 'all')}
                className={filterIntent === v ? styles.intentChipActive : styles.intentChip}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={styles.formControls}>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className={styles.select}>
          <option value={30}>30 keywords</option>
          <option value={50}>50 keywords</option>
          <option value={100}>100 keywords</option>
          <option value={150}>150 keywords</option>
          <option value={200}>200 keywords</option>
        </select>
        <button type="submit" disabled={loading} className={compact ? styles.analyzeBtnSm : styles.analyzeBtn}>
          {loading ? '⏳ Analizando...' : '🔍 Analizar'}
        </button>
      </div>
    </form>
  );

  return (
    <div className={styles.app}>

      {/* Compact header: solo visible cuando hay resultados o está cargando */}
      {(result || loading) && (
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <span className={styles.logoIcon}>🦷</span>
            <div style={{ flex: 1 }}>
              <h1 className={styles.title}>KW ReWoodSearch</h1>
              <p className={styles.subtitle}>Mejor herramienta de análisis de keywords de España</p>
            </div>
          </div>
        </header>
      )}

      <main className={result || loading ? styles.main : styles.mainHero}>

        {/* HERO: pantalla de inicio sin resultados */}
        {!result && !loading && (
          <>
            {/* Fondo animado */}
            <div className={styles.heroBg} aria-hidden="true">
              <div className={styles.heroBlob1} />
              <div className={styles.heroBlob2} />
              <div className={styles.heroBlob3} />
              <div className={styles.heroGrid} />
            </div>

            <div className={styles.hero}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Especializada en el mercado español
              </div>
              <div className={styles.heroLogo}>🦷</div>
              <h1 className={styles.heroTitle}>KW ReWoodSearch</h1>
              <p className={styles.heroSubtitle}>
                Descubre las keywords con más potencial de cualquier web dental en España
              </p>
              <div className={styles.heroCard}>
                {searchForm(false)}
              </div>
            </div>
          </>
        )}

        {/* Búsqueda compacta cuando hay resultados */}
        {(result || loading) && (
          <div className={styles.searchCard}>
            {searchForm(true)}
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <span>❌</span>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}

        {loading && (
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Analizando <strong>{domain}</strong></p>
            <p className={styles.loadingHint}>Puede tardar 10-30 segundos...</p>
          </div>
        )}

        {result && (
          <>
            <div className={styles.domainBanner}>
              <span className={styles.domainIcon}>🏢</span>
              <div>
                <div className={styles.domainName}>{domain}</div>
                <div className={styles.domainSub}>
                  Completado en {(result.metadata.processingTime / 1000).toFixed(1)}s · DataForSEO Labs
                </div>
              </div>
              <button onClick={() => exportCSV(result.keywords, domain)} className={styles.exportBtn}>
                ⬇️ Exportar CSV
              </button>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{result.metadata.totalKeywords}</div>
                <div className={styles.statLbl}>Keywords</div>
              </div>
              <div className={`${styles.statCard} ${styles.statGreen}`}>
                <div className={styles.statNum}>{result.metadata.highScoreKeywords}</div>
                <div className={styles.statLbl}>Alto potencial (&gt;70)</div>
              </div>
              <div className={`${styles.statCard} ${styles.statPurple}`}>
                <div className={styles.statNum}>{result.clusters.length}</div>
                <div className={styles.statLbl}>Tratamientos</div>
              </div>
              <div className={`${styles.statCard} ${styles.statOrange}`}>
                <div className={styles.statNum}>{result.keywords.filter(k => k.hasLocalIntent).length}</div>
                <div className={styles.statLbl}>Intent local</div>
              </div>
            </div>

            <div className={styles.tabs}>
              <button
                className={activeTab === 'keywords' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('keywords')}
              >
                📊 Keywords ({result.keywords.length})
              </button>
              <button
                className={activeTab === 'clusters' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('clusters')}
              >
                🏥 Por tratamiento ({result.clusters.length})
              </button>
              <button
                className={activeTab === 'local' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('local')}
              >
                📍 Intención local ({result.keywords.filter(k => k.hasLocalIntent).length})
              </button>
            </div>

            {activeTab === 'keywords' && (
              <div className={styles.card}>
                {/* FILTER BAR REDISEÑADO */}
                <div className={styles.filterBar}>
                  <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Intención</span>
                    <div className={styles.filterChips}>
                      <button className={filterIntent === 'all' ? styles.chipActive : styles.chip} onClick={() => setFilterIntent('all')}>
                        Todas <span className={styles.chipCount}>{intentCounts.all || 0}</span>
                      </button>
                      {(Object.entries(INTENT_META) as [IntentType, typeof INTENT_META[IntentType]][]).map(([type, meta]) => (
                        intentCounts[type] ? (
                          <button
                            key={type}
                            className={filterIntent === type ? styles.chipActive : styles.chip}
                            onClick={() => setFilterIntent(type)}
                            title={meta.desc}
                          >
                            {type === 'transaccional' ? '🛒' : type === 'informacional' ? '📚' : type === 'comercial' ? '💼' : type === 'local' ? '📍' : '·'}{' '}
                            {meta.label} <span className={styles.chipCount}>{intentCounts[type]}</span>
                          </button>
                        ) : null
                      ))}
                    </div>
                  </div>
                  <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>Tratamiento</span>
                    <div className={styles.filterChips}>
                      <button className={filterTreatment === 'all' ? styles.chipActive : styles.chip} onClick={() => setFilterTreatment('all')}>
                        Todos <span className={styles.chipCount}>{result.keywords.length}</span>
                      </button>
                      {treatments.map(t => (
                        <button key={t} className={filterTreatment === t ? styles.chipActive : styles.chip} onClick={() => setFilterTreatment(t)}>
                          {t} <span className={styles.chipCount}>{result.keywords.filter(k => (k.treatment || 'sin clasificar') === t).length}</span>
                        </button>
                      ))}
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={styles.sortSelect}>
                      <option value="score">↕ Score</option>
                      <option value="traffic">↕ Tráfico</option>
                      <option value="position">↕ Posición</option>
                    </select>
                  </div>
                  <div className={styles.filterSummary}>
                    Mostrando <strong>{filteredKeywords.length}</strong> de <strong>{result.keywords.length}</strong> keywords
                    {filterIntent !== 'all' && <span className={styles.filterTag}>· {INTENT_META[filterIntent].label}</span>}
                    {filterTreatment !== 'all' && <span className={styles.filterTag}>· {filterTreatment}</span>}
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.thNum}>#</th>
                        <th>Keyword</th>
                        <th>Pos.</th>
                        <th>Tráfico</th>
                        <th>Tratamiento</th>
                        <th>Intención</th>
                        <th>Localidad</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw, idx) => (
                        <tr key={idx} className={styles.tableRow}>
                          <td className={styles.rowNum}>{idx + 1}</td>
                          <td className={styles.kwCell}>
                            <div className={styles.kwText}>{kw.keyword}</div>
                            <div className={styles.kwUrl}>{kw.url}</div>
                          </td>
                          <td>
                            <span className={`${styles.posBadge} ${styles[getPositionClass(kw.position)]}`}>
                              #{kw.position || '?'}
                            </span>
                          </td>
                          <td className={styles.numCell}>{(kw.traffic || 0).toLocaleString()}</td>
                          <td>
                            {kw.treatment
                              ? <span className={styles.treatBadge}>{kw.treatment}</span>
                              : <span className={styles.unclsBadge}>—</span>
                            }
                          </td>
                          <td>
                            {(() => {
                              const it = (kw.intentType || 'general') as IntentType;
                              const meta = INTENT_META[it];
                              const emoji = it === 'transaccional' ? '🛒' : it === 'informacional' ? '📚' : it === 'comercial' ? '💼' : it === 'local' ? '📍' : '·';
                              return (
                                <span className={styles.intentBadge} style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
                                  {emoji} {meta.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td>
                            {kw.localLevel && kw.localLevel !== 'none' && (() => {
                              const lvl = LOCAL_LEVEL_LABELS[kw.localLevel];
                              const place = kw.neighborhood || kw.city || kw.region;
                              return (
                                <span className={`${styles.localLevelBadge} ${styles[lvl.cls]}`}>
                                  {lvl.emoji} {place || lvl.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className={styles.scoreCell}>
                            <div className={styles.scoreBar}>
                              <div
                                className={styles.scoreBarFill}
                                style={{ width: `${kw.score || 0}%`, background: getScoreColor(kw.score) }}
                              />
                            </div>
                            <span className={styles.scoreNum}>{kw.score || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tableFooter}>
                  Mostrando {filteredKeywords.length} de {result.keywords.length} keywords
                </div>
              </div>
            )}

            {activeTab === 'clusters' && (
              <div className={styles.clustersGrid}>
                {[...result.clusters].sort((a, b) => b.count - a.count).map((cluster, idx) => (
                  <div key={idx} className={styles.clusterCard}>
                    <div className={styles.clusterHeader}>
                      <span className={styles.clusterName}>{cluster.treatment}</span>
                      <span className={styles.clusterCount}>{cluster.count} kw</span>
                    </div>
                    <div className={styles.clusterBar}>
                      <div
                        className={styles.clusterBarFill}
                        style={{ width: `${(cluster.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <div className={styles.clusterMeta}>
                      <span>Score: <strong>{cluster.avgScore.toFixed(0)}</strong></span>
                      <span>Volumen: <strong>{(cluster.totalVolume || 0).toLocaleString()}</strong></span>
                    </div>
                    <div className={styles.clusterKwList}>
                      {result.keywords
                        .filter(k => k.treatment === cluster.treatment)
                        .slice(0, 5)
                        .map((kw, i) => (
                          <div key={i} className={styles.clusterKwItem}>
                            <span className={styles.clusterKwPos}>#{kw.position || '?'}</span>
                            <span className={styles.clusterKwName}>{kw.keyword}</span>
                            <span className={styles.clusterKwTraffic}>{kw.traffic || 0}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'local' && (() => {
              const localKws = result.keywords
                .filter(k => k.hasLocalIntent)
                .sort((a, b) => (b.localScore || 0) - (a.localScore || 0) || (b.score || 0) - (a.score || 0));

              const levelGroups: Record<string, typeof localKws> = {
                ultralocal: localKws.filter(k => k.localLevel === 'ultralocal'),
                neighborhood: localKws.filter(k => k.localLevel === 'neighborhood'),
                city: localKws.filter(k => k.localLevel === 'city'),
                regional: localKws.filter(k => k.localLevel === 'regional'),
                national: localKws.filter(k => k.localLevel === 'national'),
              };

              return (
                <div>
                  <div className={styles.localLegend}>
                    {Object.entries(LOCAL_LEVEL_LABELS).filter(([k]) => k !== 'none').map(([key, info]) => {
                      const count = levelGroups[key]?.length || 0;
                      return count > 0 ? (
                        <span key={key} className={`${styles.localLevelBadge} ${styles[info.cls]}`}>
                          {info.emoji} {info.label}: {count}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className={styles.card}>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.thNum}>#</th>
                            <th>Keyword</th>
                            <th>Nivel</th>
                            <th>Lugar</th>
                            <th>Pos.</th>
                            <th>Tráfico</th>
                            <th>Tratamiento</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localKws.map((kw, idx) => {
                            const lvl = kw.localLevel ? LOCAL_LEVEL_LABELS[kw.localLevel] : null;
                            const place = kw.neighborhood || kw.city || kw.region || '';
                            return (
                              <tr key={idx} className={styles.tableRow}>
                                <td className={styles.rowNum}>{idx + 1}</td>
                                <td className={styles.kwCell}>
                                  <div className={styles.kwText}>{kw.keyword}</div>
                                  <div className={styles.kwUrl}>{kw.url}</div>
                                </td>
                                <td>
                                  {lvl && lvl.cls && (
                                    <span className={`${styles.localLevelBadge} ${styles[lvl.cls]}`}>
                                      {lvl.emoji} {lvl.label}
                                    </span>
                                  )}
                                </td>
                                <td className={styles.numCell} style={{ fontWeight: 600, color: '#1e293b' }}>
                                  {place || '—'}
                                </td>
                                <td>
                                  <span className={`${styles.posBadge} ${styles[getPositionClass(kw.position)]}`}>
                                    #{kw.position || '?'}
                                  </span>
                                </td>
                                <td className={styles.numCell}>{(kw.traffic || 0).toLocaleString()}</td>
                                <td>
                                  {kw.treatment
                                    ? <span className={styles.treatBadge}>{kw.treatment}</span>
                                    : <span className={styles.unclsBadge}>—</span>
                                  }
                                </td>
                                <td className={styles.scoreCell}>
                                  <div className={styles.scoreBar}>
                                    <div
                                      className={styles.scoreBarFill}
                                      style={{ width: `${kw.score || 0}%`, background: getScoreColor(kw.score) }}
                                    />
                                  </div>
                                  <span className={styles.scoreNum}>{kw.score || 0}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.tableFooter}>
                      {localKws.length} keywords con intención local detectada
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
