'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';

type LocalLevel = 'none' | 'national' | 'regional' | 'city' | 'neighborhood' | 'ultralocal';

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
  score?: number;
}

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
  const [sortBy, setSortBy] = useState<'score' | 'traffic' | 'position'>('score');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    setFilterTreatment('all'); setActiveTab('keywords');
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
    return [...kws].sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'traffic') return (b.traffic || 0) - (a.traffic || 0);
      return (a.position || 999) - (b.position || 999);
    });
  }, [result, filterTreatment, sortBy]);

  const maxCount = result ? Math.max(...result.clusters.map(c => c.count), 1) : 1;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logoIcon}>🦷</span>
          <div>
            <h1 className={styles.title}>KW Research Tool</h1>
            <p className={styles.subtitle}>Análisis de keywords dental · España</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.searchCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>🌐</span>
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://www.clinicadental.com" required
                className={styles.urlInput}
              />
            </div>
            <div className={styles.formControls}>
              <select value={limit} onChange={e => setLimit(Number(e.target.value))} className={styles.select}>
                <option value={30}>30 keywords</option>
                <option value={50}>50 keywords</option>
                <option value={100}>100 keywords</option>
                <option value={150}>150 keywords</option>
                <option value={200}>200 keywords</option>
              </select>
              <button type="submit" disabled={loading} className={styles.analyzeBtn}>
                {loading ? '⏳ Analizando...' : '🔍 Analizar'}
              </button>
            </div>
          </form>
        </div>

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
                <div className={styles.filterBar}>
                  <div className={styles.filterChips}>
                    <button
                      className={filterTreatment === 'all' ? styles.chipActive : styles.chip}
                      onClick={() => setFilterTreatment('all')}
                    >
                      Todos ({result.keywords.length})
                    </button>
                    {treatments.map(t => (
                      <button
                        key={t}
                        className={filterTreatment === t ? styles.chipActive : styles.chip}
                        onClick={() => setFilterTreatment(t)}
                      >
                        {t} ({result.keywords.filter(k => (k.treatment || 'sin clasificar') === t).length})
                      </button>
                    ))}
                  </div>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={styles.sortSelect}>
                    <option value="score">↕ Score</option>
                    <option value="traffic">↕ Tráfico</option>
                    <option value="position">↕ Posición</option>
                  </select>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.thNum}>#</th>
                        <th>Keyword</th>
                        <th>Pos.</th>
                        <th>Tráfico</th>
                        <th>Volumen</th>
                        <th>Tratamiento</th>
                        <th>Localidad</th>
                        <th>Intención</th>
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
                          <td className={styles.numCell}>{(kw.ahrefsVolume || 0).toLocaleString()}</td>
                          <td>
                            {kw.treatment
                              ? <span className={styles.treatBadge}>{kw.treatment}</span>
                              : <span className={styles.unclsBadge}>sin clasificar</span>
                            }
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
                          <td className={styles.intentCell}>
                            {kw.hasCommercialIntent && <span className={styles.commBadge}>💰 comercial</span>}
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
