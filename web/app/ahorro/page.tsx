'use client';

import { useEffect, useMemo, useState } from 'react';

type ExpenseEntry = {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
};

type TrackerData = {
  income: number;
  fixed: number;
  goal: number;
  variableBudget: number;
  records: ExpenseEntry[];
};

const STORAGE_KEY = 'ahorro-tracker-v1';

const today = () => new Date().toISOString().slice(0, 10);

function formatEuros(value: number) {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

export default function AhorroTracker() {
  const [income, setIncome] = useState(1280);
  const [fixed, setFixed] = useState(134);
  const [goal, setGoal] = useState(700);
  const [variableBudget, setVariableBudget] = useState(250);
  const [records, setRecords] = useState<ExpenseEntry[]>([]);
  const [entryCategory, setEntryCategory] = useState('Ocio');
  const [entryAmount, setEntryAmount] = useState(20);
  const [entryNote, setEntryNote] = useState('');
  const [entryDate, setEntryDate] = useState(today());
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TrackerData;
      if (parsed) {
        setIncome(parsed.income || 1280);
        setFixed(parsed.fixed || 134);
        setGoal(parsed.goal || 700);
        setVariableBudget(parsed.variableBudget || 250);
        setRecords(parsed.records || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const data: TrackerData = { income, fixed, goal, variableBudget, records };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [income, fixed, goal, variableBudget, records]);

  const totalExpense = useMemo(() => records.reduce((sum, item) => sum + item.amount, 0), [records]);
  const plannedTotal = fixed + variableBudget;
  const savings = Math.max(0, income - plannedTotal);
  const available = Math.max(0, income - totalExpense - fixed);
  const progress = Math.min(100, (savings / goal) * 100);

  const addRecord = () => {
    if (entryAmount <= 0 || !entryCategory.trim()) {
      setMessage('Ingresa categoría y monto positivo.');
      return;
    }
    const newEntry: ExpenseEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category: entryCategory.trim(),
      amount: Number(entryAmount),
      note: entryNote.trim(),
      date: entryDate,
    };
    setRecords(prev => [newEntry, ...prev]);
    setEntryNote('');
    setMessage('Gasto guardado.');
    setTimeout(() => setMessage(''), 1800);
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const clearAll = () => {
    setRecords([]);
    setMessage('Registros borrados.');
    setTimeout(() => setMessage(''), 1800);
  };

  const reportText = useMemo(() => {
    const lines = [
      `📊 Informe rápido - ${new Date().toLocaleDateString('es-ES')}`,
      `Ingresos: ${formatEuros(income)}`,
      `Ahorro ideal: ${formatEuros(goal)}`,
      `Gastos fijos: ${formatEuros(fixed)}`,
      `Presupuesto variable: ${formatEuros(variableBudget)}`,
      `Total gastado: ${formatEuros(totalExpense)}`,
      `Ahorro potencial (planificado): ${formatEuros(savings)}`,
      `Ahorro real (ingreso - gastos totales): ${formatEuros(income - totalExpense)}`,
      `Balance disponible: ${formatEuros(available)}`,
      `Progreso objetivo: ${progress.toFixed(1)}%`,
      '---',
      'Gastos recientes:',
      ...records.slice(0, 6).map(r => `${r.date} · ${r.category} · ${formatEuros(r.amount)} ${r.note ? `· ${r.note}` : ''}`),
    ];
    return lines.join('\n');
  }, [income, fixed, goal, variableBudget, totalExpense, savings, available, progress, records]);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '14px 12px', fontFamily: 'Inter, system-ui, Segoe UI, sans-serif', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, color: '#6366f1', fontWeight: 700 }}>Mini app de ahorro</p>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.6rem' }}>Control financiero rápido</h1>
        </div>
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', background: '#eef2ff', borderRadius: 10, padding: '5px 10px' }}>Móvil + Desktop</span>
      </div>

      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>1) Ajusta tus metas</h2>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Ingreso mensual
            <input type="number" value={income} onChange={e => setIncome(Number(e.target.value) || 0)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Gastos fijos (gym, dieta, etc.)
            <input type="number" value={fixed} onChange={e => setFixed(Number(e.target.value) || 0)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Presupuesto variable (ocio + gasolina)
            <input type="number" value={variableBudget} onChange={e => setVariableBudget(Number(e.target.value) || 0)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Objetivo ahorro mensual
            <input type="number" value={goal} onChange={e => setGoal(Number(e.target.value) || 0)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>2) Tu resumen de mes</h2>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', padding: 10 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>Ahorro planificado</div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{formatEuros(savings)}</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', padding: 10 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>Disponible después de gastos</div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{formatEuros(available)}</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', padding: 10, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Progreso objetivo ahorro</div>
            <div style={{ height: 14, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#4f46e5', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{progress.toFixed(1)}% de {formatEuros(goal)}</div>
          </div>
        </div>
      </section>

      <section style={{ background: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>3) Registra un gasto</h2>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Categoría
            <select value={entryCategory} onChange={e => setEntryCategory(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }}>
              <option>Ocio</option>
              <option>Comida</option>
              <option>Gasolina</option>
              <option>Ropa</option>
              <option>Otro</option>
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Monto
            <input type="number" min={0} value={entryAmount} onChange={e => setEntryAmount(Number(e.target.value) || 0)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, gridColumn: '1 / -1' }}>
            Nota
            <input type="text" value={entryNote} onChange={e => setEntryNote(e.target.value)} placeholder="Ej. cena con amigos" style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Fecha
            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1px solid #cbd5e1', padding: '8px 10px' }} />
          </label>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={addRecord} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 9, padding: '9px 12px', fontWeight: 700, cursor: 'pointer' }}>Guardar gasto</button>
          <button onClick={clearAll} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: 9, padding: '9px 12px', cursor: 'pointer' }}>Borrar registros</button>
        </div>
        {message ? <div style={{ marginTop: 8, color: '#111827' }}>{message}</div> : null}
      </section>

      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>4) Gastos registrados</h2>
          <span style={{ color: '#475569', fontSize: 12 }}>{records.length} gastos</span>
        </div>
        {records.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No hay gastos guardados aún.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {records.slice(0, 20).map(record => (
              <div key={record.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#f9fafb', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{record.category} · {formatEuros(record.amount)}</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>{record.date} {record.note ? `· ${record.note}` : ''}</div>
                </div>
                <button onClick={() => deleteRecord(record.id)} style={{ border: 'none', background: '#ef4444', color: 'white', borderRadius: 6, padding: '5px 8px', fontWeight: 700, cursor: 'pointer' }}>X</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>5) Reporte rápido</h2>
        <textarea value={reportText} readOnly rows={12} style={{ width: '100%', borderRadius: 10, border: '1px solid #cbd5e1', padding: 10, fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco' }} />
      </section>

      <section style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: 12, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Consejo rápido</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#1f2937' }}>
          <li>Transfiere tu ahorro automáticamente justo el día de nómina.</li>
          <li>Lleva tu registro de gastos cada día (5 min).</li>
          <li>Revisa el reporte semanal y ajusta el ocio para mantenerte en presupuesto.</li>
          <li>Empieza inversión mensual con 50€ en ETF global una vez tengas 3 meses de fondo.</li>
        </ul>
      </section>
    </main>
  );
}
