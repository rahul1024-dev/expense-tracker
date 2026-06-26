/* ============================================================
   Expense Tracker — JavaScript
   ============================================================ */

/* ── State ────────────────────────────────────────────────── */
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

/* ── DOM References ───────────────────────────────────────── */
const descriptionInput   = document.getElementById('description');
const amountInput        = document.getElementById('amount');
const typeSelect         = document.getElementById('transaction-type');
const categorySelect     = document.getElementById('category');
const addBtn             = document.getElementById('add-transaction-btn');
const transactionList    = document.getElementById('transaction-list');
const emptyState         = document.getElementById('empty-state');
const filterSelect       = document.getElementById('filter-type');
const balanceAmount      = document.getElementById('balance-amount');
const totalIncome        = document.getElementById('total-income');
const totalExpense       = document.getElementById('total-expense');

/* ── Helpers ──────────────────────────────────────────────── */
function formatCurrency(value) {
  return '₹' + Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateId() {
  return '_' + Math.random().toString(36).slice(2, 10);
}

/* ── Totals & Balance ─────────────────────────────────────── */
function updateSummary() {
  const income  = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  if (balanceAmount) {
    balanceAmount.textContent = formatCurrency(balance);
    balanceAmount.style.webkitTextFillColor = balance >= 0 ? '' : '#ff6b8a';
  }
  if (totalIncome)  totalIncome.textContent  = formatCurrency(income);
  if (totalExpense) totalExpense.textContent  = formatCurrency(expense);
}

/* ── Render a single transaction <li> ─────────────────────── */
function createTransactionElement(transaction) {
  const { id, description, amount, type, category, date } = transaction;

  const li = document.createElement('li');
  li.className = `transaction-item transaction-item--${type}`;
  li.dataset.id   = id;
  li.dataset.type = type;

  const sign = type === 'income' ? '+' : '-';

  li.innerHTML = `
    <div class="transaction-item__info">
      <span class="transaction-item__description">${escapeHTML(description)}</span>
      <time class="transaction-item__date" datetime="${date}">${formatDate(date)}</time>
    </div>
    <div class="transaction-item__meta">
      <span class="transaction-item__badge transaction-item__badge--${type}">
        ${type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
      <span class="transaction-item__category">
      ${category}
      </span>
      <span class="transaction-item__amount">${sign}${formatCurrency(amount)}</span>
      <button
        class="btn btn--icon transaction-item__delete"
        aria-label="Delete transaction: ${escapeHTML(description)}"
        data-id="${id}"
      >✕</button>
    </div>
  `;

  li.querySelector('.transaction-item__delete')
    .addEventListener('click', () => deleteTransaction(id));

  return li;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Render List (respects active filter) ─────────────────── */
function renderList() {
  const filter = filterSelect ? filterSelect.value : 'all';

  const visible = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  Array.from(transactionList.querySelectorAll('.transaction-item'))
    .forEach(el => el.remove());

  if (visible.length === 0) {
    emptyState.style.display = '';
  } else {
    emptyState.style.display = 'none';

    [...visible].reverse().forEach(t => {
      transactionList.appendChild(createTransactionElement(t));
    });
  }

  updateSummary();

}

/* ── Add Transaction ──────────────────────────────────────── */
function addTransaction() {
  const description = descriptionInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const type        = typeSelect.value;
  const category    = categorySelect.value;

  /* Validation */
  if (!description) {
    descriptionInput.focus();
    shake(descriptionInput);
    return;
  }
  if (!amount || amount <= 0 || isNaN(amount)) {
    amountInput.focus();
    shake(amountInput);
    return;
  }
  if (!type) {
    shake(typeSelect);
    return;
  }
  if (!category) {
  shake(categorySelect);
  return;
}

 const transaction = {
  id: generateId(),
  description,
  amount,
  type,
  category,
  date: new Date().toISOString()
};

  transactions.push(transaction);

localStorage.setItem(
  'transactions',
  JSON.stringify(transactions)
);

renderList();
clearForm();
}

/* ── Delete Transaction ───────────────────────────────────── */
function deleteTransaction(id) {
  const item = transactionList.querySelector(`[data-id="${id}"]`);

  if (item) {
    item.style.transition = 'opacity 200ms ease, transform 200ms ease';
    item.style.opacity = '0';
    item.style.transform = 'translateX(12px)';

    setTimeout(() => {
      transactions = transactions.filter(t => t.id !== id);

      localStorage.setItem(
        'transactions',
        JSON.stringify(transactions)
      );

      renderList();
    
    }, 200);

  } else {
    transactions = transactions.filter(t => t.id !== id);

    localStorage.setItem(
      'transactions',
      JSON.stringify(transactions)
    );

    renderList();
  }
}

/* ── Clear Form ───────────────────────────────────────────── */
function clearForm() {
  descriptionInput.value = '';
  amountInput.value = '';
  typeSelect.value = '';
  categorySelect.value = '';
  descriptionInput.focus();
}
/* ── Shake Feedback ───────────────────────────────────────── */
function shake(el) {
  el.style.transition = 'transform 60ms ease';
  const steps = ['-6px', '6px', '-4px', '4px', '0px'];
  let i = 0;
  const next = () => {
    if (i >= steps.length) { el.style.transform = ''; return; }
    el.style.transform = `translateX(${steps[i++]})`;
    setTimeout(next, 60);
  };
  next();
}

/* ── Event Listeners ──────────────────────────────────────── */
addBtn.addEventListener('click', addTransaction);

/* Allow Enter key in text / number fields to submit */
[descriptionInput, amountInput].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTransaction();
  });
});

/* Re-render when filter changes */
if (filterSelect) {
  filterSelect.addEventListener('change', renderList);
}

/* ── Init ─────────────────────────────────────────────────── */
renderList();
updateSummary();
// --- REAL-TIME SEARCH TRANSACTIONS FUNCTIONALITY ---

document.addEventListener('DOMContentLoaded', () => {
  
  const searchInput = document.getElementById('search');
  const transactionList = document.getElementById('transaction-list');

  if (searchInput && transactionList) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      // Select all elements matching your specific list items template
      const items = transactionList.querySelectorAll('.transaction-item');

      items.forEach(item => {
        const descriptionEl = item.querySelector('.transaction-item__description');
        if (descriptionEl) {
          const descriptionText = descriptionEl.textContent.toLowerCase();
          
          // Check if the search term matches the description text
          if (descriptionText.includes(searchTerm)) {
            item.style.display = ''; // Reverts to default CSS layout display
          } else {
            item.style.display = 'none'; // Hides the item
          }
        }
      });
    });
  }
}); 
/* ==========================
   Dark Mode
========================== */

const themeToggle = document.getElementById('theme-toggle');

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = '☀️ Light Mode';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');

  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    themeToggle.textContent = '☀️ Light Mode';
  } else {
    localStorage.setItem('theme', 'light');
    themeToggle.textContent = '🌙 Dark Mode';
  }
});
/* ==========================
   Export CSV
========================== */

const exportBtn = document.getElementById('export-btn');

if (exportBtn) {
  exportBtn.addEventListener('click', () => {

    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    let csv =
      'Description,Amount,Type,Category,Date\n';

    transactions.forEach(transaction => {
      csv += `"${transaction.description}",${transaction.amount},"${transaction.type}","${transaction.category}","${transaction.date}"\n`;
    });

    const blob = new Blob([csv], {
      type: 'text/csv'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense-transactions.csv';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
