'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { NewsReport, NewsItem, TelegramMessage } from '@/lib/news/types';

// ─── Sub-section definitions ──────────────────────────────────────────────────

type MainTab = 'ia' | 'seo';
type IASubTab = 'general' | 'marketing' | 'tools' | 'seoLocal';
type SEOSubTab = 'general' | 'google' | 'telegram1' | 'telegram2';

const IA_TABS: { id: IASubTab; label: string; emoji: string; desc: string }[] = [
  { id: 'general',   label: 'IA General',     emoji: '🤖', desc: 'Tendencias globales en inteligencia artificial' },
  { id: 'marketing', label: 'IA & Marketing',  emoji: '📣', desc: 'IA aplicada al marketing digital' },
  { id: 'tools',     label: 'Herramientas IA', emoji: '🛠️', desc: 'Nuevas herramientas y lanzamientos' },
  { id: 'seoLocal',  label: 'IA & SEO Local',  emoji: '📍', desc: 'IA aplicada al SEO local y posicionamiento' },
];

const SEO_TABS: { id: SEOSubTab; label: string; emoji: string; desc: string }[] = [
  { id: 'general',   label: 'SEO Local',         emoji: '🗺️', desc: 'Noticias y tendencias de SEO local' },
  { id: 'google',    label: 'Google Updates',     emoji: '🔍', desc: 'Actualizaciones y novedades de Google' },
  { id: 'telegram1', label: 'Telegram Grupo 1',   emoji: '💬', desc: 'Resumen de tu primer grupo de SEO local' },
  { id: 'telegram2', label: 'Telegram Grupo 2',   emoji: '💬', desc: 'Resumen de tu segundo grupo de SEO local' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatWeek(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} – ${e.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  } catch {
    return '';
  }
}

// ─── News Card ─────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '14px 16px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        marginBottom: '10px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', lineHeight: 1.4, marginBottom: '6px' }}>
            {item.title}
          </div>
          {item.description && (
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', marginBottom: '4px' }}>
            {item.source}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
            {formatDate(item.publishedAt)}
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── AI Summary Box ───────────────────────────────────────────────────────────

function SummaryBox({ summary, loading }: { summary: string; loading?: boolean }) {
  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #93c5fd', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1d4ed8' }}>
          <span style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>⏳</span>
          <span style={{ fontWeight: 600 }}>Generando resumen con IA...</span>
        </div>
      </div>
    );
  }
  if (!summary) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #93c5fd', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>✨</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1d4ed8' }}>Resumen IA de la semana</span>
      </div>
      <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {summary}
      </div>
    </div>
  );
}

// ─── Telegram Messages Panel ──────────────────────────────────────────────────

function TelegramPanel({
  messages,
  summary,
  groupName,
  groupNum,
}: {
  messages: TelegramMessage[];
  summary: string;
  groupName: string;
  groupNum: 1 | 2;
}) {
  const [manualText, setManualText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [showMessages, setShowMessages] = useState(false);

  const handleManualImport = async () => {
    if (!manualText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch('/api/news/telegram-webhook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: groupNum, messages: manualText }),
      });
      const data = await res.json();
      setImportMsg(`✅ ${data.added} mensajes importados. Regenera el reporte para ver el resumen.`);
      setManualText('');
    } catch {
      setImportMsg('❌ Error al importar mensajes.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <SummaryBox summary={summary} />

      {/* Setup guide */}
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '10px' }}>
          📱 Cómo conectar tu grupo de Telegram ({groupName})
        </div>
        <ol style={{ fontSize: '13px', color: '#78350f', paddingLeft: '18px', lineHeight: 1.8 }}>
          <li>Crea un bot en Telegram con <strong>@BotFather</strong> → /newbot</li>
          <li>Añade el bot a tu grupo como <strong>administrador</strong></li>
          <li>En tu <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>.env</code> añade:<br />
            <code style={{ fontSize: '12px', background: '#fef3c7', padding: '2px 6px', borderRadius: '3px', display: 'block', marginTop: '4px' }}>
              TELEGRAM_BOT_TOKEN=tu-token-del-bot<br />
              TELEGRAM_GROUP{groupNum}_ID=-100XXXXXXXX<br />
              TELEGRAM_WEBHOOK_SECRET=tu-secreto
            </code>
          </li>
          <li>Configura el webhook: <code style={{ fontSize: '12px', background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>https://tuapp.com/api/news/telegram-webhook</code></li>
          <li>Los mensajes se guardarán automáticamente y se resumirán al generar el reporte</li>
        </ol>
      </div>

      {/* Manual import fallback */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '10px' }}>
          📋 Importación manual (alternativa)
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
          Copia y pega mensajes de tu grupo de Telegram (uno por línea):
        </p>
        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder={`Pega aquí los mensajes del grupo ${groupName}...\nCada línea se procesará como un mensaje individual.`}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '10px',
          }}
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleManualImport}
            disabled={importing || !manualText.trim()}
            style={{
              padding: '8px 16px',
              background: importing ? '#9ca3af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: importing ? 'not-allowed' : 'pointer',
            }}
          >
            {importing ? '⏳ Importando...' : '📥 Importar mensajes'}
          </button>
          {importMsg && <span style={{ fontSize: '13px', color: '#374151' }}>{importMsg}</span>}
        </div>
      </div>

      {/* Message history */}
      {messages.length > 0 && (
        <div>
          <button
            onClick={() => setShowMessages(!showMessages)}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#374151', marginBottom: '12px' }}
          >
            {showMessages ? '▲ Ocultar mensajes' : `▼ Ver ${messages.length} mensajes guardados`}
          </button>
          {showMessages && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              {[...messages].reverse().map((msg, i) => (
                <div key={i} style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{msg.sender}</span>
                    <span style={{ color: '#9ca3af', fontSize: '11px' }}>{formatDate(msg.date)}</span>
                  </div>
                  <div style={{ color: '#374151', lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section Panel (news items + summary) ────────────────────────────────────

function SectionPanel({ items, summary }: { items: NewsItem[]; summary: string }) {
  return (
    <div>
      <SummaryBox summary={summary} />
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
          <p style={{ fontWeight: 600, marginBottom: '6px' }}>No hay noticias cargadas aún</p>
          <p style={{ fontSize: '13px' }}>Haz clic en "Generar Reporte" para cargar las noticias de la semana</p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px', fontWeight: 500 }}>
            {items.length} artículos encontrados
          </div>
          {items.map((item, i) => <NewsCard key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NoticiasPage() {
  const [mainTab, setMainTab] = useState<MainTab>('ia');
  const [iaTab, setIATab] = useState<IASubTab>('general');
  const [seoTab, setSEOTab] = useState<SEOSubTab>('general');
  const [report, setReport] = useState<NewsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  // Load cached report on mount
  useEffect(() => {
    fetch('/api/news/report')
      .then(r => r.json())
      .then(data => {
        if (data.report) {
          setReport(data.report);
          setLastGenerated(data.report.generatedAt);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const generateReport = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/news/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setReport(data.report);
      setLastGenerated(data.report.generatedAt);
    } catch (e) {
      setError('Error generando el reporte. Verifica tu ANTHROPIC_API_KEY en el archivo .env.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Render current sub-section ──────────────────────────────────────────

  function renderContent() {
    if (mainTab === 'ia') {
      if (!report) return null;
      const section = report.ia;
      if (iaTab === 'general')   return <SectionPanel items={section.general.items}   summary={section.general.summary} />;
      if (iaTab === 'marketing') return <SectionPanel items={section.marketing.items} summary={section.marketing.summary} />;
      if (iaTab === 'tools')     return <SectionPanel items={section.tools.items}     summary={section.tools.summary} />;
      if (iaTab === 'seoLocal')  return <SectionPanel items={section.seoLocal.items}  summary={section.seoLocal.summary} />;
    } else {
      if (!report) return null;
      const section = report.seoLocal;
      if (seoTab === 'general')   return <SectionPanel items={section.general.items}  summary={section.general.summary} />;
      if (seoTab === 'google')    return <SectionPanel items={section.google.items}   summary={section.google.summary} />;
      if (seoTab === 'telegram1') return (
        <TelegramPanel
          messages={section.telegram1.messages}
          summary={section.telegram1.summary}
          groupName={section.telegram1.groupName}
          groupNum={1}
        />
      );
      if (seoTab === 'telegram2') return (
        <TelegramPanel
          messages={section.telegram2.messages}
          summary={section.telegram2.summary}
          groupName={section.telegram2.groupName}
          groupNum={2}
        />
      );
    }
    return null;
  }

  const currentSubTabs = mainTab === 'ia' ? IA_TABS : SEO_TABS;
  const currentSubTab = mainTab === 'ia' ? iaTab : seoTab;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2563eb 60%, #0891b2 100%)', padding: '28px 32px', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Link href="/" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                ← Volver a KW Research
              </Link>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
                📰 News Intelligence Hub
              </h1>
              <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: '14px' }}>
                Seguimiento semanal de IA y SEO Local — resúmenes automáticos con IA
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => generateReport(true)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? '⏳ Generando reporte...' : '🔄 Generar Reporte Semanal'}
              </button>
              {lastGenerated && (
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Último reporte: {formatDate(lastGenerated)}
                </div>
              )}
            </div>
          </div>
          {error && (
            <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fecaca' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Loading state */}
        {loading && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 600, marginBottom: '8px' }}>
              ⏳ Cargando noticias y generando resúmenes con IA...
            </div>
            <div style={{ fontSize: '13px', color: '#3b82f6' }}>
              Esto puede tardar 30-60 segundos mientras se obtienen noticias de todas las fuentes
            </div>
          </div>
        )}

        {/* Main tabs: IA vs SEO Local */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { id: 'ia' as MainTab,  label: '🤖 Inteligencia Artificial', color: '#7c3aed' },
            { id: 'seo' as MainTab, label: '📍 SEO Local',               color: '#059669' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              style={{
                padding: '14px 28px',
                background: mainTab === tab.id ? tab.color : '#fff',
                color: mainTab === tab.id ? '#fff' : '#374151',
                border: `2px solid ${mainTab === tab.id ? tab.color : '#e5e7eb'}`,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainTab === tab.id ? `0 4px 14px ${tab.color}40` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {currentSubTabs.map(tab => {
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => mainTab === 'ia' ? setIATab(tab.id as IASubTab) : setSEOTab(tab.id as SEOSubTab)}
                title={tab.desc}
                style={{
                  padding: '9px 18px',
                  background: isActive ? (mainTab === 'ia' ? '#7c3aed' : '#059669') : '#fff',
                  color: isActive ? '#fff' : '#374151',
                  border: `1.5px solid ${isActive ? (mainTab === 'ia' ? '#7c3aed' : '#059669') : '#e5e7eb'}`,
                  borderRadius: '8px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section description */}
        {(() => {
          const currentTabInfo = currentSubTabs.find(t => t.id === currentSubTab);
          return currentTabInfo ? (
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{currentTabInfo.emoji}</span>
              <span>{currentTabInfo.desc}</span>
            </div>
          ) : null;
        })()}

        {/* Initial loading */}
        {initialLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
            <p>Cargando datos...</p>
          </div>
        ) : !report ? (
          /* No report yet */
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📰</div>
            <h2 style={{ color: '#111827', marginBottom: '12px', fontSize: '22px' }}>
              Bienvenido al News Intelligence Hub
            </h2>
            <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Haz clic en <strong>"Generar Reporte Semanal"</strong> para obtener las últimas noticias
              de IA y SEO Local, resumidas automáticamente con inteligencia artificial.
            </p>
            <button
              onClick={() => generateReport(false)}
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {loading ? '⏳ Cargando...' : '🚀 Generar mi primer reporte'}
            </button>
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#9ca3af' }}>
              Necesitas configurar ANTHROPIC_API_KEY en tu .env para los resúmenes IA
            </div>
          </div>
        ) : (
          /* Report content */
          <div>
            {/* Week banner */}
            <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>📅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0369a1' }}>
                  Semana del {formatWeek(report.weekStart, report.weekEnd)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Generado el {formatDate(report.generatedAt)} · {
                    mainTab === 'ia'
                      ? Object.values(report.ia).reduce((acc, s) => acc + s.items.length, 0)
                      : report.seoLocal.general.items.length + report.seoLocal.google.items.length
                  } artículos procesados
                </div>
              </div>
            </div>

            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}
