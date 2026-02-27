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
  isTargetPage?: boolean;
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

interface TopPage {
  url: string;
  traffic: number;
  keywords: number;
  topKeyword?: string;
  topKeywordPosition?: number;
  ur?: number;
  referringDomains?: number;
}

interface DomainStats {
  domain: string;
  domainRating: number;
  metrics: { orgTraffic: number; orgKeywords: number; trafficValueUsd: number };
  backlinks: { live: number; allTime: number; liveRefdomains: number; allTimeRefdomains: number; newLast30: number; lostLast30: number };
  topPages: TopPage[];
  referringDomains: Array<{ domain: string; domainRating: number; linksToTarget: number; trafficDomain: number }>;
  subfolders: Array<{ path: string; traffic: number; pages: number }>;
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

type KwCategory = 'idea' | 'question' | 'comparison' | 'related';

interface ExplorerKw {
  keyword: string;
  volume: number;
  cpcEur: number;
  difficulty: number;
  trafficPotential: number;
  category: KwCategory;
}

interface ExplorerResult {
  seed: string;
  country: string;
  overview: { keyword: string; volume: number; cpcEur: number; difficulty: number; trafficPotential: number } | null;
  keywords: ExplorerKw[];
}

const EXPLORER_COUNTRIES = [
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'AR', label: '🇦🇷 Argentina' },
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'US', label: '🇺🇸 Estados Unidos' },
  { code: 'GB', label: '🇬🇧 Reino Unido' },
  { code: 'DE', label: '🇩🇪 Alemania' },
  { code: 'FR', label: '🇫🇷 Francia' },
];

const CAT_META: Record<KwCategory, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  idea:       { label: 'Idea',      emoji: '💡', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  question:   { label: 'Pregunta',  emoji: '❓', color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
  comparison: { label: 'Comp.',     emoji: '💰', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  related:    { label: 'Relacionada', emoji: '🔗', color: '#0f766e', bg: '#f0fdfa', border: '#5eead4' },
};

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

function exportExcel(keywords: Keyword[], domain: string, targetUrl: string) {
  const date = new Date().toISOString().split('T')[0];
  const intentColors: Record<string, string> = {
    transaccional: '#dcfce7', informacional: '#dbeafe',
    comercial: '#ffedd5', local: '#f3e8ff', general: '#f1f5f9',
  };
  const totalKws = keywords.length;
  const highScore = keywords.filter(k => (k.score || 0) > 70).length;
  const localKws = keywords.filter(k => k.hasLocalIntent).length;
  const targetKws = keywords.filter(k => k.isTargetPage !== false).length;

  const rows = keywords.map((kw, i) => {
    const ibg = intentColors[kw.intentType || 'general'] || '#f1f5f9';
    const s = kw.score || 0;
    const sbg = s >= 80 ? '#dcfce7' : s >= 60 ? '#dbeafe' : s >= 40 ? '#fef9c3' : '#fee2e2';
    const place = kw.neighborhood || kw.city || kw.region || '';
    const kwSafe = kw.keyword.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const urlSafe = kw.url.replace(/&/g, '&amp;');
    return `<tr>
      <td style="text-align:center;color:#94a3b8;background:#fafafa">${i + 1}</td>
      <td style="font-weight:600;min-width:200px">${kwSafe}</td>
      <td style="text-align:center;font-weight:700">${kw.position || '—'}</td>
      <td style="text-align:right">${(kw.traffic || 0).toLocaleString()}</td>
      <td style="text-align:right">${(kw.ahrefsVolume || 0).toLocaleString()}</td>
      <td style="background:${ibg};text-align:center;font-weight:600">${kw.intentType || 'general'}</td>
      <td style="font-weight:500">${kw.treatment || '—'}</td>
      <td>${place || '—'}</td>
      <td style="background:${sbg};text-align:center;font-weight:700">${s}</td>
      <td style="color:#64748b;font-size:11px;max-width:220px;word-break:break-all">${urlSafe}</td>
      <td style="text-align:center;font-weight:700;color:#4f46e5">${kw.isTargetPage !== false ? '✓' : ''}</td>
    </tr>`;
  }).join('');

  const html = `<html><head><meta charset="UTF-8"><style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #e2e8f0; padding: 6px 10px; vertical-align: middle; }
    th { background: #1e1b4b; color: white; font-weight: 600; text-align: left; }
    tr:nth-child(even) td { background-color: #fafafa; }
    tr:hover td { background-color: #f0f4ff !important; }
  </style></head><body><table>
    <tr><td colspan="11" style="background:#1e1b4b;color:white;font-size:18px;font-weight:800;padding:14px 12px;border:none;letter-spacing:-0.02em">🦷 KW ReWoodSearch — Análisis de Keywords</td></tr>
    <tr>
      <td colspan="4" style="background:#f8fafc;font-weight:600;color:#374151">Dominio: ${domain}</td>
      <td colspan="4" style="background:#f8fafc;font-weight:600;color:#374151">URL analizada: ${targetUrl.replace(/&/g, '&amp;')}</td>
      <td colspan="3" style="background:#f8fafc;font-weight:600;color:#374151">Fecha: ${date}</td>
    </tr>
    <tr>
      <td colspan="3" style="background:#eff6ff;font-weight:700;color:#1d4ed8">Total keywords: ${totalKws}</td>
      <td colspan="2" style="background:#f0fdf4;font-weight:700;color:#15803d">Alta oportunidad (&gt;70): ${highScore}</td>
      <td colspan="2" style="background:#faf5ff;font-weight:700;color:#7c3aed">Intención local: ${localKws}</td>
      <td colspan="2" style="background:#fff7ed;font-weight:700;color:#c2410c">Esta URL: ${targetKws}</td>
      <td colspan="2" style="background:#f8fafc;font-weight:700;color:#475569">Otras páginas: ${totalKws - targetKws}</td>
    </tr>
    <tr style="height:6px"><td colspan="11" style="border:none;background:white"></td></tr>
    <tr>
      <th style="width:36px">#</th>
      <th>Keyword</th>
      <th>Posición</th>
      <th>Tráfico</th>
      <th>Volumen</th>
      <th>Intención</th>
      <th>Tratamiento</th>
      <th>Localidad</th>
      <th>Score</th>
      <th>Página URL</th>
      <th>Esta URL</th>
    </tr>
    ${rows}
  </table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kw-${domain}-${date}.xls`;
  a.click();
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'keywords' | 'clusters' | 'local' | 'domain' | 'explorer'>('keywords');
  const [filterTreatment, setFilterTreatment] = useState('all');
  const [filterIntent, setFilterIntent] = useState<IntentType | 'all'>('all');
  const [filterPage, setFilterPage] = useState<'all' | 'target' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'traffic' | 'position'>('score');
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [domainStatsLoading, setDomainStatsLoading] = useState(false);
  const [domainStatsError, setDomainStatsError] = useState('');

  // Keywords Explorer state
  const [explorerKw, setExplorerKw] = useState('');
  const [explorerCountry, setExplorerCountry] = useState('ES');
  const [explorerLimit, setExplorerLimit] = useState(50);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerError, setExplorerError] = useState('');
  const [explorerResult, setExplorerResult] = useState<ExplorerResult | null>(null);
  const [explorerSubTab, setExplorerSubTab] = useState<'all' | 'questions' | 'comparisons' | 'related'>('all');
  // Hero mode + drill-down navigation
  const [heroMode, setHeroMode] = useState<'url' | 'kw'>('url');
  const [explorerBreadcrumb, setExplorerBreadcrumb] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    setFilterTreatment('all'); setFilterIntent('all'); setFilterPage('all'); setActiveTab('keywords');
    setDomainStats(null); setDomainStatsError(''); setDomainStatsLoading(true);

    // Fire domain-stats request in parallel (non-blocking)
    const statsPromise = fetch('/api/domain-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, country: 'ES' }),
    });

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
    } finally {
      setLoading(false);
    }

    // Handle domain stats independently
    statsPromise
      .then(r => r.json())
      .then(data => {
        if (data.error === 'AHREFS_NOT_CONFIGURED') {
          setDomainStatsError('not_configured');
        } else if (data.error) {
          setDomainStatsError(data.error);
        } else {
          setDomainStats(data);
        }
      })
      .catch(() => setDomainStatsError('connection_error'))
      .finally(() => setDomainStatsLoading(false));
  };

  const doExplore = async (keyword: string) => {
    setExplorerError('');
    setExplorerResult(null);
    setExplorerLoading(true);
    setExplorerSubTab('all');
    try {
      const res = await fetch('/api/keywords-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, country: explorerCountry, limit: explorerLimit }),
      });
      const data = await res.json();
      if (data.error === 'AHREFS_NOT_CONFIGURED') {
        setExplorerError('not_configured');
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        setExplorerResult(data);
      }
    } catch (err: any) {
      setExplorerError(err.message || 'Error al buscar ideas');
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorerKw.trim()) return;
    setExplorerBreadcrumb([]);
    doExplore(explorerKw.trim());
  };

  const drillIntoKeyword = (kw: string) => {
    setExplorerBreadcrumb(prev => [...prev, explorerKw]);
    setExplorerKw(kw);
    doExplore(kw);
  };

  const navigateBreadcrumb = (idx: number) => {
    if (idx < 0) {
      setExplorerBreadcrumb([]);
      setExplorerResult(null);
      setExplorerError('');
      setExplorerKw('');
      return;
    }
    const target = explorerBreadcrumb[idx];
    setExplorerBreadcrumb(explorerBreadcrumb.slice(0, idx));
    setExplorerKw(target);
    doExplore(target);
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
    if (filterPage === 'target') kws = kws.filter(k => k.isTargetPage !== false);
    if (filterPage === 'other') kws = kws.filter(k => k.isTargetPage === false);
    return [...kws].sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'traffic') return (b.traffic || 0) - (a.traffic || 0);
      return (a.position || 999) - (b.position || 999);
    });
  }, [result, filterTreatment, filterIntent, filterPage, sortBy]);

  const intentCounts = useMemo(() => {
    if (!result) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: result.keywords.length };
    for (const kw of result.keywords) {
      const t = kw.intentType || 'general';
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [result]);

  const pageCounts = useMemo(() => {
    if (!result) return { target: 0, other: 0 };
    const other = result.keywords.filter(k => k.isTargetPage === false).length;
    return { target: result.keywords.length - other, other };
  }, [result]);

  const kwLengthStats = useMemo(() => {
    if (!result) return { short: 0, medium: 0, longTail: 0, total: 0 };
    const kws = result.keywords;
    const short = kws.filter(k => k.keyword.split(' ').length <= 2).length;
    const medium = kws.filter(k => { const w = k.keyword.split(' ').length; return w >= 3 && w <= 4; }).length;
    const longTail = kws.filter(k => k.keyword.split(' ').length >= 5).length;
    return { short, medium, longTail, total: kws.length };
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

  const explorerSearchForm = (compact: boolean) => (
    <form onSubmit={handleExplore} className={styles.form}>
      <div className={styles.inputWrapper}>
        <span className={styles.inputIcon}>🔍</span>
        <input
          type="text"
          value={explorerKw}
          onChange={e => setExplorerKw(e.target.value)}
          placeholder="ej: implantes dentales, ortodoncia..."
          required
          className={styles.urlInput}
          disabled={explorerLoading}
        />
      </div>
      <div className={styles.formControls}>
        <select value={explorerCountry} onChange={e => setExplorerCountry(e.target.value)} className={styles.select}>
          {EXPLORER_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <select value={explorerLimit} onChange={e => setExplorerLimit(Number(e.target.value))} className={styles.select}>
          <option value={30}>30 ideas</option>
          <option value={50}>50 ideas</option>
          <option value={100}>100 ideas</option>
          <option value={200}>200 ideas</option>
        </select>
        <button type="submit" disabled={explorerLoading || !explorerKw.trim()} className={compact ? styles.analyzeBtnSm : styles.analyzeBtn}>
          {explorerLoading ? '⏳ Buscando...' : '🔍 Explorar'}
        </button>
      </div>
    </form>
  );

  const renderExplorerContent = () => {
    const explorerFiltered = explorerResult
      ? explorerResult.keywords.filter(kw => {
          if (explorerSubTab === 'questions') return kw.category === 'question';
          if (explorerSubTab === 'comparisons') return kw.category === 'comparison';
          if (explorerSubTab === 'related') return kw.category === 'related';
          return true;
        })
      : [];
    const qCount = explorerResult ? explorerResult.keywords.filter(k => k.category === 'question').length : 0;
    const cmpCount = explorerResult ? explorerResult.keywords.filter(k => k.category === 'comparison').length : 0;
    const relCount = explorerResult ? explorerResult.keywords.filter(k => k.category === 'related').length : 0;
    const getKdClass = (kd: number) => kd >= 60 ? 'kdHigh' : kd >= 30 ? 'kdMed' : 'kdLow';

    return (
      <>
        {explorerError === 'not_configured' && (
          <div className={styles.errorBox}>
            <span>🔑</span>
            <div>
              <strong>Ahrefs API no configurada</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                Configura <code>AHREFS_API_KEY</code> en las variables de entorno para usar el Explorador de Keywords.
              </p>
            </div>
          </div>
        )}
        {explorerError && explorerError !== 'not_configured' && (
          <div className={styles.errorBox}><span>❌</span><div><strong>Error:</strong> {explorerError}</div></div>
        )}
        {explorerLoading && (
          <div className={styles.loadingCard} style={{ padding: '2rem' }}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Buscando ideas para <strong>"{explorerKw}"</strong></p>
            <p className={styles.loadingHint}>Consultando Ahrefs Keywords Explorer...</p>
          </div>
        )}
        {!explorerResult && !explorerLoading && !explorerError && (
          <div className={styles.explorerEmptyState}>
            <div className={styles.explorerEmptyIcon}>🔍</div>
            <div className={styles.explorerEmptyTitle}>Busca ideas de keywords</div>
            <div className={styles.explorerEmptyDesc}>
              Escribe una keyword semilla y descubre ideas relacionadas con volumen, CPC y dificultad real.
            </div>
          </div>
        )}
        {explorerResult && !explorerLoading && (
          <>
            {explorerResult.overview && (
              <div className={styles.explorerOverviewCard}>
                <div className={styles.explorerOverviewTitle}>
                  <span>📊</span> Métricas de <strong>"{explorerResult.seed}"</strong>
                </div>
                <div className={styles.explorerOverviewStats}>
                  <div className={styles.explorerOverviewStat}>
                    <span className={styles.explorerOverviewNum}>{explorerResult.overview.volume.toLocaleString()}</span>
                    <span className={styles.explorerOverviewLbl}>Búsquedas/mes</span>
                  </div>
                  <div className={styles.explorerOverviewStat}>
                    <span className={styles.explorerOverviewNum}>{explorerResult.overview.cpcEur.toFixed(2)}€</span>
                    <span className={styles.explorerOverviewLbl}>CPC estimado</span>
                  </div>
                  <div className={styles.explorerOverviewStat}>
                    <span className={`${styles.explorerOverviewNum} ${styles[getKdClass(explorerResult.overview.difficulty)]}`}>
                      {explorerResult.overview.difficulty}
                    </span>
                    <span className={styles.explorerOverviewLbl}>Dificultad (KD)</span>
                  </div>
                  <div className={styles.explorerOverviewStat}>
                    <span className={styles.explorerOverviewNum}>{explorerResult.overview.trafficPotential.toLocaleString()}</span>
                    <span className={styles.explorerOverviewLbl}>Tráfico potencial</span>
                  </div>
                </div>
              </div>
            )}
            <div className={styles.explorerSubTabs}>
              <button className={explorerSubTab === 'all' ? styles.explorerSubTabActive : styles.explorerSubTab} onClick={() => setExplorerSubTab('all')}>
                Todas <span className={styles.explorerSubTabCount}>{explorerResult.keywords.length}</span>
              </button>
              {qCount > 0 && (
                <button className={explorerSubTab === 'questions' ? styles.explorerSubTabActive : styles.explorerSubTab} onClick={() => setExplorerSubTab('questions')}>
                  ❓ Preguntas <span className={styles.explorerSubTabCount}>{qCount}</span>
                </button>
              )}
              {cmpCount > 0 && (
                <button className={explorerSubTab === 'comparisons' ? styles.explorerSubTabActive : styles.explorerSubTab} onClick={() => setExplorerSubTab('comparisons')}>
                  💰 Comparativas <span className={styles.explorerSubTabCount}>{cmpCount}</span>
                </button>
              )}
              {relCount > 0 && (
                <button className={explorerSubTab === 'related' ? styles.explorerSubTabActive : styles.explorerSubTab} onClick={() => setExplorerSubTab('related')}>
                  🔗 También rankan <span className={styles.explorerSubTabCount}>{relCount}</span>
                </button>
              )}
            </div>
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thNum}>#</th>
                      <th>Keyword</th>
                      <th>Volumen</th>
                      <th>CPC</th>
                      <th>Dificultad</th>
                      <th>Tráf. Pot.</th>
                      <th>Tipo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {explorerFiltered.map((kw, idx) => {
                      const cat = CAT_META[kw.category];
                      return (
                        <tr key={idx} className={styles.tableRow}>
                          <td className={styles.rowNum}>{idx + 1}</td>
                          <td className={styles.kwCell}>
                            <div className={styles.kwText}>{kw.keyword}</div>
                          </td>
                          <td className={styles.numCell}>{kw.volume.toLocaleString()}</td>
                          <td className={styles.numCell}>{kw.cpcEur > 0 ? `${kw.cpcEur.toFixed(2)}€` : '—'}</td>
                          <td>
                            <span className={`${styles.kdBadge} ${styles[getKdClass(kw.difficulty)]}`}>
                              {kw.difficulty}
                            </span>
                          </td>
                          <td className={styles.numCell}>{kw.trafficPotential > 0 ? kw.trafficPotential.toLocaleString() : '—'}</td>
                          <td>
                            <span className={styles.catBadge} style={{ color: cat.color, background: cat.bg, borderColor: cat.border }}>
                              {cat.emoji} {cat.label}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.drillBtn}
                              onClick={() => drillIntoKeyword(kw.keyword)}
                              title={`Explorar "${kw.keyword}"`}
                            >
                              🔍
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableFooter}>
                {explorerFiltered.length} keywords · Ahrefs Keywords Explorer · {explorerResult.country}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  const isExplorerPage = heroMode === 'kw' && !result && !loading &&
    (explorerResult !== null || explorerLoading || explorerError !== '');

  return (
    <div className={styles.app}>

      {/* Header: visible en resultados URL o en página del explorador */}
      {(result || loading || isExplorerPage) && (
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <span className={styles.logoIcon}>🦷</span>
            <div style={{ flex: 1 }}>
              <h1 className={styles.title}>KW ReWoodSearch</h1>
              <p className={styles.subtitle}>Mejor herramienta de análisis de keywords de España</p>
            </div>
            {isExplorerPage && !result && (
              <button
                className={styles.headerSwitchBtn}
                onClick={() => { setHeroMode('url'); setExplorerResult(null); setExplorerBreadcrumb([]); setExplorerError(''); }}
              >
                🌐 Analizar URL
              </button>
            )}
          </div>
        </header>
      )}

      <main className={(result || loading || isExplorerPage) ? styles.main : styles.mainHero}>

        {/* HERO: pantalla de inicio sin resultados */}
        {!result && !loading && !isExplorerPage && (
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
                {heroMode === 'url'
                  ? 'Descubre las keywords con más potencial de cualquier web dental en España'
                  : 'Busca el volumen, CPC y dificultad de cualquier keyword y explora ideas relacionadas'
                }
              </p>
              <div className={styles.heroCard}>
                {/* Mode switcher */}
                <div className={styles.heroModeSwitcher}>
                  <button
                    type="button"
                    onClick={() => setHeroMode('url')}
                    className={heroMode === 'url' ? styles.heroModeActive : styles.heroMode}
                  >
                    🌐 Analizar URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroMode('kw')}
                    className={heroMode === 'kw' ? styles.heroModeActive : styles.heroMode}
                  >
                    🔍 Explorar Keywords
                  </button>
                </div>
                {heroMode === 'url' ? searchForm(false) : explorerSearchForm(false)}
              </div>
            </div>
          </>
        )}

        {/* Búsqueda compacta URL cuando hay resultados */}
        {(result || loading) && (
          <div className={styles.searchCard}>
            {searchForm(true)}
          </div>
        )}

        {/* STANDALONE EXPLORER PAGE */}
        {isExplorerPage && !result && !loading && (
          <>
            {/* Compact explorer search */}
            <div className={styles.searchCard}>
              {explorerSearchForm(true)}
            </div>

            {/* Breadcrumb */}
            {explorerBreadcrumb.length > 0 && (
              <div className={styles.explorerBreadcrumb}>
                <button className={styles.explorerBreadcrumbBtn} onClick={() => navigateBreadcrumb(-1)}>🏠 Inicio</button>
                {explorerBreadcrumb.map((kw, i) => (
                  <span key={i} className={styles.explorerBreadcrumbItem}>
                    <span className={styles.explorerBreadcrumbSep}>›</span>
                    <button className={styles.explorerBreadcrumbBtn} onClick={() => navigateBreadcrumb(i)}>{kw}</button>
                  </span>
                ))}
                <span className={styles.explorerBreadcrumbSep}>›</span>
                <span className={styles.explorerBreadcrumbCurrent}>{explorerResult?.seed || explorerKw}</span>
              </div>
            )}

            {/* Explorer content */}
            <div className={styles.explorerSection}>
              {renderExplorerContent()}
            </div>
          </>
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
              <button onClick={() => exportExcel(result.keywords, domain, url)} className={styles.exportBtn}>
                📊 Exportar Excel
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
              <button
                className={activeTab === 'domain' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('domain')}
              >
                🏠 Dominio {domainStatsLoading ? '⏳' : domainStats ? '' : ''}
              </button>
              <button
                className={activeTab === 'explorer' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('explorer')}
              >
                🔍 Explorador
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
                  {pageCounts.other > 0 && (
                    <div className={styles.filterRow}>
                      <span className={styles.filterLabel}>Página</span>
                      <div className={styles.filterChips}>
                        <button className={filterPage === 'all' ? styles.chipActive : styles.chip} onClick={() => setFilterPage('all')}>
                          🌐 Todo el dominio <span className={styles.chipCount}>{result.keywords.length}</span>
                        </button>
                        <button className={filterPage === 'target' ? styles.chipActive : styles.chip} onClick={() => setFilterPage('target')}>
                          📌 Esta URL <span className={styles.chipCount}>{pageCounts.target}</span>
                        </button>
                        <button className={filterPage === 'other' ? styles.chipActive : styles.chip} onClick={() => setFilterPage('other')}>
                          📄 Otras páginas <span className={styles.chipCount}>{pageCounts.other}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={styles.filterSummary}>
                    Mostrando <strong>{filteredKeywords.length}</strong> de <strong>{result.keywords.length}</strong> keywords
                    {filterPage === 'target' && <span className={styles.filterTag}>· Esta URL</span>}
                    {filterPage === 'other' && <span className={styles.filterTag}>· Otras páginas</span>}
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
                            <div className={styles.kwUrl}>
                              {kw.isTargetPage === false && <span className={styles.otherPageTag}>Otra página · </span>}
                              {kw.url}
                            </div>
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

            {activeTab === 'domain' && (
              <div>
                {domainStatsLoading && (
                  <div className={styles.loadingCard} style={{ padding: '2rem' }}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Cargando análisis de dominio...</p>
                    <p className={styles.loadingHint}>Consultando Ahrefs Site Explorer</p>
                  </div>
                )}

                {domainStatsError === 'not_configured' && (
                  <div className={styles.errorBox}>
                    <span>🔑</span>
                    <div>
                      <strong>Ahrefs API no configurada</strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Configura <code>AHREFS_API_KEY</code> en las variables de entorno para activar el análisis de dominio completo.
                      </p>
                    </div>
                  </div>
                )}

                {domainStatsError && domainStatsError !== 'not_configured' && (
                  <div className={styles.errorBox}>
                    <span>❌</span>
                    <div><strong>Error Ahrefs:</strong> {domainStatsError}</div>
                  </div>
                )}

                {domainStats && !domainStatsLoading && (() => {
                  const { backlinks, metrics, topPages, referringDomains: refDomains, subfolders } = domainStats;
                  const maxSubTraffic = Math.max(...subfolders.map(s => s.traffic), 1);
                  const maxRefDR = Math.max(...refDomains.map(r => r.domainRating), 1);

                  // DR color
                  const drColor = domainStats.domainRating >= 70 ? '#10b981'
                    : domainStats.domainRating >= 50 ? '#3b82f6'
                    : domainStats.domainRating >= 30 ? '#f59e0b'
                    : '#94a3b8';

                  return (
                    <div className={styles.domainTabContent}>
                      {/* TOP METRICS ROW */}
                      <div className={styles.domainMetricsRow}>
                        <div className={styles.drCard}>
                          <div className={styles.drCircle} style={{ borderColor: drColor, color: drColor }}>
                            <span className={styles.drNum}>{domainStats.domainRating}</span>
                            <span className={styles.drLabel}>DR</span>
                          </div>
                          <div className={styles.drDesc}>Domain Rating</div>
                        </div>
                        <div className={styles.domainMetricCard}>
                          <div className={styles.dmNum}>{metrics.orgTraffic.toLocaleString()}</div>
                          <div className={styles.dmLbl}>Tráfico orgánico/mes</div>
                        </div>
                        <div className={styles.domainMetricCard}>
                          <div className={styles.dmNum}>{metrics.orgKeywords.toLocaleString()}</div>
                          <div className={styles.dmLbl}>Keywords orgánicas</div>
                        </div>
                        <div className={styles.domainMetricCard}>
                          <div className={styles.dmNum}>${metrics.trafficValueUsd.toLocaleString()}</div>
                          <div className={styles.dmLbl}>Valor del tráfico</div>
                        </div>
                        <div className={styles.domainMetricCard}>
                          <div className={styles.dmNum}>{backlinks.liveRefdomains.toLocaleString()}</div>
                          <div className={styles.dmLbl}>Dominios referentes</div>
                        </div>
                      </div>

                      {/* BACKLINKS + SUBFOLDERS */}
                      <div className={styles.domainTwoCol}>
                        {/* Backlinks card */}
                        <div className={styles.card} style={{ padding: '1.25rem' }}>
                          <h3 className={styles.sectionTitle}>🔗 Backlinks</h3>
                          <div className={styles.blGrid}>
                            <div className={styles.blStat}>
                              <span className={styles.blNum}>{backlinks.live.toLocaleString()}</span>
                              <span className={styles.blLbl}>En vivo</span>
                            </div>
                            <div className={styles.blStat}>
                              <span className={styles.blNum} style={{ color: '#94a3b8' }}>{backlinks.allTime.toLocaleString()}</span>
                              <span className={styles.blLbl}>Histórico total</span>
                            </div>
                            <div className={styles.blStat}>
                              <span className={styles.blNum} style={{ color: '#10b981' }}>+{backlinks.newLast30.toLocaleString()}</span>
                              <span className={styles.blLbl}>Nuevos (30d)</span>
                            </div>
                            <div className={styles.blStat}>
                              <span className={styles.blNum} style={{ color: '#ef4444' }}>-{backlinks.lostLast30.toLocaleString()}</span>
                              <span className={styles.blLbl}>Perdidos (30d)</span>
                            </div>
                          </div>

                          <h3 className={styles.sectionTitle} style={{ marginTop: '1rem' }}>📊 KWs por longitud</h3>
                          <div className={styles.kwLenBars}>
                            {[
                              { label: '1-2 palabras', count: kwLengthStats.short, color: '#3b82f6' },
                              { label: '3-4 palabras', count: kwLengthStats.medium, color: '#8b5cf6' },
                              { label: '5+ palabras (long-tail)', count: kwLengthStats.longTail, color: '#10b981' },
                            ].map(({ label, count, color }) => (
                              <div key={label} className={styles.kwLenRow}>
                                <span className={styles.kwLenLabel}>{label}</span>
                                <div className={styles.kwLenBarWrap}>
                                  <div className={styles.kwLenBar} style={{ width: `${kwLengthStats.total > 0 ? (count / kwLengthStats.total) * 100 : 0}%`, background: color }} />
                                </div>
                                <span className={styles.kwLenCount}>{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subfolder distribution */}
                        <div className={styles.card} style={{ padding: '1.25rem' }}>
                          <h3 className={styles.sectionTitle}>📁 Distribución por subcarpeta</h3>
                          {subfolders.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sin datos de subcarpetas</p>
                          ) : (
                            <div className={styles.subfolderList}>
                              {subfolders.slice(0, 10).map(sf => (
                                <div key={sf.path} className={styles.subfolderRow}>
                                  <span className={styles.subfolderPath}>{sf.path}</span>
                                  <div className={styles.subfolderBarWrap}>
                                    <div
                                      className={styles.subfolderBar}
                                      style={{ width: `${(sf.traffic / maxSubTraffic) * 100}%` }}
                                    />
                                  </div>
                                  <span className={styles.subfolderTraffic}>{sf.traffic.toLocaleString()}</span>
                                  <span className={styles.subfolderPages}>{sf.pages}p</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* TOP PAGES */}
                      <div className={styles.card} style={{ marginBottom: '1rem' }}>
                        <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>🏆 Top páginas orgánicas</h3>
                        </div>
                        <div className={styles.tableWrapper}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th className={styles.thNum}>#</th>
                                <th>URL</th>
                                <th>Tráfico</th>
                                <th>Keywords</th>
                                <th>Top Keyword</th>
                                <th>Pos.</th>
                                <th>UR</th>
                                <th>Ref. Dom.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topPages.map((page, idx) => (
                                <tr key={idx} className={styles.tableRow}>
                                  <td className={styles.rowNum}>{idx + 1}</td>
                                  <td className={styles.kwCell}>
                                    <a href={page.url} target="_blank" rel="noopener noreferrer"
                                      style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}
                                      title={page.url}>
                                      {page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </a>
                                  </td>
                                  <td className={styles.numCell}>{page.traffic.toLocaleString()}</td>
                                  <td className={styles.numCell}>{page.keywords.toLocaleString()}</td>
                                  <td style={{ maxWidth: '180px', fontSize: '0.83rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {page.topKeyword || '—'}
                                  </td>
                                  <td>
                                    {page.topKeywordPosition ? (
                                      <span className={`${styles.posBadge} ${styles[getPositionClass(page.topKeywordPosition)]}`}>
                                        #{page.topKeywordPosition}
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td className={styles.numCell}>{page.ur != null ? Math.round(page.ur) : '—'}</td>
                                  <td className={styles.numCell}>{page.referringDomains != null ? page.referringDomains.toLocaleString() : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* REFERRING DOMAINS */}
                      {refDomains.length > 0 && (
                        <div className={styles.card}>
                          <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>🌐 Dominios referentes top (por DR)</h3>
                          </div>
                          <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                              <thead>
                                <tr>
                                  <th className={styles.thNum}>#</th>
                                  <th>Dominio</th>
                                  <th>DR</th>
                                  <th>Backlinks</th>
                                  <th>Tráfico dom.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {refDomains.map((rd, idx) => (
                                  <tr key={idx} className={styles.tableRow}>
                                    <td className={styles.rowNum}>{idx + 1}</td>
                                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{rd.domain}</td>
                                    <td>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: rd.domainRating >= 70 ? '#dcfce7' : rd.domainRating >= 50 ? '#dbeafe' : rd.domainRating >= 30 ? '#fef9c3' : '#f1f5f9',
                                        color: rd.domainRating >= 70 ? '#15803d' : rd.domainRating >= 50 ? '#1d4ed8' : rd.domainRating >= 30 ? '#a16207' : '#64748b',
                                      }}>{rd.domainRating}</span>
                                    </td>
                                    <td className={styles.numCell}>{rd.linksToTarget.toLocaleString()}</td>
                                    <td className={styles.numCell}>{rd.trafficDomain.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'explorer' && (
              <div className={styles.explorerSection}>
                {/* Search Form (tab version) */}
                <div className={styles.explorerFormCard}>
                  <div className={styles.explorerFormHeader}>
                    <span className={styles.explorerFormIcon}>🔍</span>
                    <div>
                      <div className={styles.explorerFormTitle}>Explorador de Keywords</div>
                      <div className={styles.explorerFormSubtitle}>Descubre nuevas ideas con volumen, CPC y dificultad real de Ahrefs</div>
                    </div>
                  </div>
                  {explorerSearchForm(false)}
                </div>
                {/* Breadcrumb when drilling */}
                {explorerBreadcrumb.length > 0 && (
                  <div className={styles.explorerBreadcrumb}>
                    <button className={styles.explorerBreadcrumbBtn} onClick={() => navigateBreadcrumb(-1)}>🏠 Inicio</button>
                    {explorerBreadcrumb.map((kw, i) => (
                      <span key={i} className={styles.explorerBreadcrumbItem}>
                        <span className={styles.explorerBreadcrumbSep}>›</span>
                        <button className={styles.explorerBreadcrumbBtn} onClick={() => navigateBreadcrumb(i)}>{kw}</button>
                      </span>
                    ))}
                    <span className={styles.explorerBreadcrumbSep}>›</span>
                    <span className={styles.explorerBreadcrumbCurrent}>{explorerResult?.seed || explorerKw}</span>
                  </div>
                )}
                {renderExplorerContent()}
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
