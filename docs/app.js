const STORAGE_KEY = 'ahorro-app-v1';

const incomeInput = document.querySelector('#income');
const fixedInput = document.querySelector('#fixed');
const variableInput = document.querySelector('#variableBudget');
const goalInput = document.querySelector('#goal');
const savingsEl = document.querySelector('#savings');
const availableEl = document.querySelector('#available');
const bar = document.querySelector('#bar');
const progressText = document.querySelector('#progressText');
const countEl = document.querySelector('#count');
const recordsEl = document.querySelector('#records');
const reportEl = document.querySelector('#report');
const messageEl = document.querySelector('#message');
const copyBtn = document.querySelector('#copy');

const categoryInput = document.querySelector('#category');
const amountInput = document.querySelector('#amount');
const noteInput = document.querySelector('#note');
const dateInput = document.querySelector('#date');
const saveBtn = document.querySelector('#save');
const clearBtn = document.querySelector('#clear');

let data = { income:1280, fixed:134, variableBudget:250, goal:700, records: [] };

dateInput.value = new Date().toISOString().slice(0,10);

function formatMoney(v){ return v.toFixed(2).replace('.', ',') + ' €'; }

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ data = JSON.parse(raw); }
  } catch(e){ console.error(e); }
  incomeInput.value = data.income;
  fixedInput.value = data.fixed;
  variableInput.value = data.variableBudget;
  goalInput.value = data.goal;
  render();
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function render(){
  const totalExpense = data.records.reduce((sum, r)=>sum+r.amount,0);
  const planned = data.fixed + data.variableBudget;
  const savings = Math.max(0, data.income - planned);
  const available = Math.max(0, data.income - totalExpense - data.fixed);
  const progress = data.goal ? Math.min(100, (savings/data.goal)*100) : 0;

  savingsEl.textContent = formatMoney(savings);
  availableEl.textContent = formatMoney(available);
  bar.style.width = `${progress}%`;
  progressText.textContent = `${progress.toFixed(1)}% de ${formatMoney(data.goal)}`;

  countEl.textContent = `${data.records.length} gasto${data.records.length===1?'':'s'}`;

  recordsEl.innerHTML = data.records.map(r =>
    `<div class='record'><div><strong>${r.category} · ${formatMoney(r.amount)}</strong><br><small>${r.date}${r.note? ' · '+r.note : ''}</small></div><button class='delete' data-id='${r.id}'>X</button></div>`
  ).join('');

  const report = [
    `📊 Informe rápido - ${new Date().toLocaleDateString('es-ES')}`,
    `Ingresos: ${formatMoney(data.income)}`,
    `Meta ahorros: ${formatMoney(data.goal)}`,
    `Gastos fijos: ${formatMoney(data.fixed)}`,
    `Presupuesto variable: ${formatMoney(data.variableBudget)}`,
    `Gasto total: ${formatMoney(totalExpense)}`,
    `Ahorro planificado: ${formatMoney(savings)}`,
    `Ahorro real: ${formatMoney(data.income - totalExpense)}`,
    `Balance disponible: ${formatMoney(available)}`,
    `Progreso: ${progress.toFixed(1)}%`,
    '---',
    'Gastos recientes:',
    ...data.records.slice(0, 8).map(r => `${r.date} · ${r.category} · ${formatMoney(r.amount)}${r.note? ' · '+r.note: ''}`)
  ].join('\n');
  reportEl.value = report;
  saveData();
}

function addRecord(){
  const amount = Number(amountInput.value);
  if(!amount || amount <=0){ messageEl.textContent='Monto debe ser mayor que 0'; return; }
  const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, category: categoryInput.value, amount, note: noteInput.value.trim(), date: dateInput.value };
  data.records.unshift(record);
  messageEl.textContent='Gasto guardado';
  amountInput.value='20';
  noteInput.value='';
  setTimeout(()=>messageEl.textContent='',1400);
  render();
}

function clearRecords(){ data.records=[]; render(); messageEl.textContent='Registros borrados'; setTimeout(()=>messageEl.textContent='',1400); }

incomeInput.addEventListener('change', ()=>{ data.income = Number(incomeInput.value)||0; render(); });
fixedInput.addEventListener('change', ()=>{ data.fixed = Number(fixedInput.value)||0; render(); });
variableInput.addEventListener('change', ()=>{ data.variableBudget = Number(variableInput.value)||0; render(); });
goalInput.addEventListener('change', ()=>{ data.goal = Number(goalInput.value)||0; render(); });
saveBtn.addEventListener('click', addRecord);
clearBtn.addEventListener('click', clearRecords);
recordsEl.addEventListener('click', (e)=>{ if(e.target.classList.contains('delete')){ const id = e.target.getAttribute('data-id'); data.records = data.records.filter(r=>r.id!==id); render(); }});
copyBtn.addEventListener('click', ()=>{ navigator.clipboard.writeText(reportEl.value).then(()=>{ messageEl.textContent='Reporte copiado'; setTimeout(()=>messageEl.textContent='',1400); });});

load();
render();
