const STORAGE_KEY = 'ahorro-app-v5';

const params = {
  income: document.querySelector('#income'),
  fixed: document.querySelector('#fixed'),
  variable: document.querySelector('#variableBudget'),
  goal: document.querySelector('#goal'),
  savings: document.querySelector('#savings'),
  savings2: document.querySelector('#savings2'),
  available: document.querySelector('#available'),
  totalExpense: document.querySelector('#totalExpense'),
  remaining: document.querySelector('#remainingVariable'),
  progressPct: document.querySelector('#progressPct'),
  progressBar: document.querySelector('#bar'),
  progressText: document.querySelector('#progressText'),
  sixMonthGoal: document.querySelector('#sixMonthGoal'),
  monthlyTarget: document.querySelector('#monthlyTarget'),
  sixMonthSavings: document.querySelector('#sixMonthSavings'),
  sixMonthProgress: document.querySelector('#sixMonthProgress'),
  records: document.querySelector('#records'),
  count: document.querySelector('#count'),
  report: document.querySelector('#report'),
  message: document.querySelector('#message'),
  copy: document.querySelector('#copy'),
  category: document.querySelector('#category'),
  amount: document.querySelector('#amount'),
  note: document.querySelector('#note'),
  date: document.querySelector('#date'),
  save: document.querySelector('#save'),
  clear: document.querySelector('#clear'),
  checklist: document.querySelector('#checklist'),
  addTask: document.querySelector('#addTask'),
  clearTasks: document.querySelector('#clearTasks'),
  goAdd: document.querySelector('#goAdd'),
  goMeta: document.querySelector('#goMeta'),
  goReport: document.querySelector('#goReport')
};

const state = {
  income: 1280,
  fixed: 134,
  variableBudget: 250,
  goal: 700,
  sixMonthGoal: 4200,
  monthlyTarget: 700,
  records: [],
  tasks: [
    { id: 't1', text: 'Transferir ahorro automático', done: false },
    { id: 't2', text: 'Registrar gastos del día', done: false },
    { id: 't3', text: 'Revisar presupuesto semanal', done: false }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  if (params.date) params.date.value = new Date().toISOString().slice(0, 10);
  load();
  bindEvents();
  render();
});

function formatMoney(v) { return `${Number(v).toFixed(2).replace('.', ',')} €`; }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
      if (!Array.isArray(state.records)) state.records = [];
      if (!Array.isArray(state.tasks)) state.tasks = [];
    }
  } catch (e) { console.error(e); }

  params.income.value = state.income;
  params.fixed.value = state.fixed;
  params.variable.value = state.variableBudget;
  params.goal.value = state.goal;
  params.sixMonthGoal.value = state.sixMonthGoal;
  params.monthlyTarget.value = state.monthlyTarget;
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function render() {
  const totalExpense = state.records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const planned = Number(state.fixed) + Number(state.variableBudget);
  const savings = Math.max(0, Number(state.income) - planned);
  const available = Math.max(0, Number(state.income) - totalExpense - Number(state.fixed));
  const progress = state.goal ? Math.min(100, (savings / Number(state.goal || 1)) * 100) : 0;
  const sixMonthSavings = Number(state.monthlyTarget) * 6;
  const sixMonthProgress = state.sixMonthGoal ? Math.min(100, (sixMonthSavings / Number(state.sixMonthGoal || 1)) * 100) : 0;

  params.savings.textContent = formatMoney(savings);
  if (params.savings2) params.savings2.textContent = formatMoney(savings);
  params.available.textContent = formatMoney(available);
  params.totalExpense.textContent = formatMoney(totalExpense);
  params.remaining.textContent = formatMoney(Math.max(0, Number(state.variableBudget) - totalExpense));
  params.progressPct.textContent = `${progress.toFixed(0)} %`;
  params.progressBar.style.width = `${progress}%`;
  params.progressText.textContent = `${progress.toFixed(1)}% de ${formatMoney(state.goal)}`;
  params.sixMonthSavings.textContent = formatMoney(sixMonthSavings);
  params.sixMonthProgress.textContent = `${sixMonthProgress.toFixed(1)} %`;

  params.count.textContent = `${state.records.length} gasto${state.records.length === 1 ? '' : 's'}`;

  params.records.innerHTML = state.records
    .slice(0, 30)
    .map(r => `<div class='record'><div><strong>${r.category} · ${formatMoney(r.amount)}</strong><br><small>${r.date}${r.note ? ' · ' + r.note : ''}</small></div><button class='delete' data-id='${r.id}'>X</button></div>`)
    .join('');

  params.checklist.innerHTML = state.tasks
    .map(t => `<div class='check-item'><label><input type='checkbox' data-id='${t.id}' ${t.done ? 'checked' : ''}><span>${t.text}</span></label><button class='delete-task' data-id='${t.id}'>X</button></div>`)
    .join('');

  params.report.value = [
    `📊 Informe - ${new Date().toLocaleDateString('es-ES')}`,
    `Ingresos: ${formatMoney(state.income)}`,
    `Meta ahorro: ${formatMoney(state.goal)}`,
    `Gastos fijos: ${formatMoney(state.fixed)}`,
    `Variable: ${formatMoney(state.variableBudget)}`,
    `Total gasto: ${formatMoney(totalExpense)}`,
    `Ahorro proyectado: ${formatMoney(savings)}`,
    `Balance disponible: ${formatMoney(available)}`,
    `Progreso: ${progress.toFixed(1)}%`,
    `Meta 6m: ${formatMoney(state.sixMonthGoal)}`,
    `Ahorro 6m: ${formatMoney(sixMonthSavings)} (${sixMonthProgress.toFixed(1)}%)`,
    '---',
    'Gastos recientes:',
    ...state.records.slice(0, 8).map(r => `${r.date} · ${r.category} · ${formatMoney(r.amount)}${r.note ? ' · ' + r.note : ''}`)
  ].join('\n');

  save();
}

function addRecord() {
  const amount = Number(params.amount.value);
  if (!amount || amount <= 0) { params.message.textContent = 'Monto debe ser mayor que 0'; return; }
  state.records.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, category: params.category.value, amount, note: params.note.value.trim(), date: params.date.value });
  params.message.textContent = 'Gasto guardado';
  params.amount.value = '20';
  params.note.value = '';
  setTimeout(() => { params.message.textContent = ''; }, 1400);
  render();
}

function clearRecords() { state.records = []; params.message.textContent = 'Registros borrados'; setTimeout(() => { params.message.textContent = ''; }, 1400); render(); }

function addTask() { const text = prompt('Nueva tarea semanal'); if (!text) return; state.tasks.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, text, done: false }); render(); }

function clearTasks() { state.tasks = []; render(); }

function toggleTask(id, done) { state.tasks = state.tasks.map(t => t.id === id ? { ...t, done } : t); render(); }

function deleteTask(id) { state.tasks = state.tasks.filter(t => t.id !== id); render(); }

function goTo(node) { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

function bindEvents() {
  params.income.addEventListener('change', () => { state.income = Number(params.income.value) || 0; render(); });
  params.fixed.addEventListener('change', () => { state.fixed = Number(params.fixed.value) || 0; render(); });
  params.variable.addEventListener('change', () => { state.variableBudget = Number(params.variable.value) || 0; render(); });
  params.goal.addEventListener('change', () => { state.goal = Number(params.goal.value) || 0; render(); });
  params.sixMonthGoal.addEventListener('change', () => { state.sixMonthGoal = Number(params.sixMonthGoal.value) || 1; render(); });
  params.monthlyTarget.addEventListener('change', () => { state.monthlyTarget = Number(params.monthlyTarget.value) || 0; render(); });

  params.save.addEventListener('click', addRecord);
  params.clear.addEventListener('click', clearRecords);
  params.addTask.addEventListener('click', addTask);
  params.clearTasks.addEventListener('click', clearTasks);

  params.records.addEventListener('click', (e) => { if (e.target.classList.contains('delete')) { const id = e.target.dataset.id; state.records = state.records.filter(r => r.id !== id); render(); } });
  params.checklist.addEventListener('click', (e) => { if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') toggleTask(e.target.dataset.id, e.target.checked); if (e.target.classList.contains('delete-task')) deleteTask(e.target.dataset.id); });

  params.copy.addEventListener('click', () => { navigator.clipboard.writeText(params.report.value).then(() => { params.message.textContent = 'Reporte copiado'; setTimeout(() => { params.message.textContent = ''; }, 1400); }); });

  params.goAdd.addEventListener('click', () => goTo(params.amount));
  params.goMeta.addEventListener('click', () => goTo(params.income));
  params.goReport.addEventListener('click', () => goTo(params.report));
}

bindEvents();
render();
