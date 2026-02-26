'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface Keyword {
  keyword: string;
  position?: number;
  traffic?: number;
  ahrefsVolume?: number;
  url: string;
  treatment?: string | null;
  hasLocalIntent?: boolean;
  city?: string;
  hasCommercialIntent?: boolean;
  commercialSignals?: string[];
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

export default function Home() {
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          country: 'ES',
          lang: 'es',
          limit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el análisis');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return 'badge badge-gray';
    if (score >= 80) return 'badge badge-green';
    if (score >= 70) return 'badge badge-blue';
    return 'badge badge-yellow';
  };

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>🦷 KW Research Tool - Dental España</h1>
        <p className={styles.subtitle}>
          Análisis de keywords con Ahrefs API | Clasificación automática por tratamientos
        </p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="url">URL del competidor</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://clinicadental.com/implantes-dentales"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="limit">Límite de keywords</label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className={styles.select}
              >
                <option value={30}>30 keywords</option>
                <option value={50}>50 keywords</option>
                <option value={100}>100 keywords</option>
                <option value={150}>150 keywords</option>
                <option value={200}>200 keywords</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? '⏳ Analizando...' : '🔍 Analizar'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Obteniendo keywords de Ahrefs...</p>
          <p className={styles.loadingSubtext}>
            Esto puede tardar 10-30 segundos dependiendo del límite
          </p>
        </div>
      )}

      {result && (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{result.metadata.totalKeywords}</div>
              <div className={styles.statLabel}>Keywords</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{result.metadata.highScoreKeywords}</div>
              <div className={styles.statLabel}>High Score (&gt;70)</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{result.clusters.length}</div>
              <div className={styles.statLabel}>Tratamientos</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                {(result.metadata.processingTime / 1000).toFixed(1)}s
              </div>
              <div className={styles.statLabel}>Tiempo</div>
            </div>
          </div>

          <div className="card">
            <h2>📊 Top Keywords</h2>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Posición</th>
                    <th>Tráfico</th>
                    <th>Tratamiento</th>
                    <th>Intención</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.keywords.slice(0, 30).map((kw, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{kw.keyword}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {kw.url}
                        </div>
                      </td>
                      <td>#{kw.position || 'N/A'}</td>
                      <td>{kw.traffic || 0}</td>
                      <td>
                        {kw.treatment ? (
                          <span className="badge badge-blue">{kw.treatment}</span>
                        ) : (
                          <span className="badge badge-gray">sin clasificar</span>
                        )}
                      </td>
                      <td>
                        {kw.hasLocalIntent && (
                          <span className="badge badge-green">
                            📍 {kw.city || 'Local'}
                          </span>
                        )}
                        {kw.hasCommercialIntent && (
                          <span className="badge badge-yellow" style={{ marginLeft: '0.5rem' }}>
                            💰 Comercial
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={getScoreBadge(kw.score)}>
                          {kw.score || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>🏥 Clusters por Tratamiento</h2>
            <div className={styles.clusters}>
              {result.clusters.map((cluster, idx) => (
                <div key={idx} className={styles.cluster}>
                  <div className={styles.clusterTitle}>{cluster.treatment}</div>
                  <div className={styles.clusterStats}>
                    <div>{cluster.count} keywords</div>
                    <div>Score promedio: {cluster.avgScore.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
