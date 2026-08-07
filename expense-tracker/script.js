// Initialize app
const app = {
    transactions: [],
    settings: {
        username: 'Daacad',
        darkMode: false,
        currency: 'USD',
        language: 'en',
        notifications: true,
        pinLock: false,
        pin: ''
    }
};

// Load data from LocalStorage
function loadData() {
    const saved = localStorage.getItem('expenseTrackerData');
    if (saved) {
        const data = JSON.parse(saved);
        app.transactions = data.transactions || [];
        app.settings = { ...app.settings, ...data.settings };
    }
}

// Save data to LocalStorage
function saveData() {
    localStorage.setItem('expenseTrackerData', JSON.stringify(app));
}

// Format currency
function formatCurrency(amount) {
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
    const symbol = symbols[app.settings.currency] || '$';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// Update dashboard stats
function updateStats() {
    const income = app.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = app.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = income - expense;

    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expense').textContent = formatCurrency(expense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('balance').style.color = balance >= 0 ? '#26a69a' : '#ef5350';
}

// Render transactions
function renderTransactions(filter = 'all') {
    const recentList = document.getElementById('recent-list');
    const allList = document.getElementById('all-transactions');

    let filtered = app.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== 'all') {
        filtered = filtered.filter(t => t.type === filter);
    }

    const recentHTML = filtered.slice(0, 5).map(createTransactionItem).join('');
    const allHTML = filtered.map(createTransactionItem).join('');

    recentList.innerHTML = recentHTML || '<p class="empty-state">No transactions yet. Start by adding an expense or income!</p>';
    allList.innerHTML = allHTML || '<p class="empty-state">No transactions found.</p>';
}

function createTransactionItem(transaction) {
    return `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-details">
                <div class="transaction-category">${transaction.category}</div>
                <div class="transaction-desc">${transaction.description}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
                <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">🗑️</button>
            </div>
        </div>
    `;
}

function deleteTransaction(id) {
    app.transactions = app.transactions.filter(t => t.id !== id);
    saveData();
    updateStats();
    renderTransactions();
    renderTransactions('all');
}

// Page Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) item.classList.add('active');
    });

    // Update page title
    const titles = {
        home: 'Home',
        'add-expense': 'Add Expense',
        'add-income': 'Add Income',
        transactions: 'All Transactions',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[page] || 'Home';
}

// Set today's date as default
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').valueAsDate = new Date(today);
    document.getElementById('income-date').valueAsDate = new Date(today);
}

// Form Handlers
document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const transaction = {
        id: Date.now().toString(),
        type: 'expense',
        amount: document.getElementById('expense-amount').value,
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        date: document.getElementById('expense-date').value,
        timestamp: new Date()
    };
    app.transactions.push(transaction);
    saveData();
    updateStats();
    renderTransactions();
    renderTransactions('all');
    this.reset();
    setDefaultDate();
    navigateTo('home');
    if (app.settings.notifications) {
        showNotification('Expense added successfully!');
    }
});

document.getElementById('income-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const transaction = {
        id: Date.now().toString(),
        type: 'income',
        amount: document.getElementById('income-amount').value,
        category: document.getElementById('income-source').value,
        description: document.getElementById('income-description').value,
        date: document.getElementById('income-date').value,
        timestamp: new Date()
    };
    app.transactions.push(transaction);
    saveData();
    updateStats();
    renderTransactions();
    renderTransactions('all');
    this.reset();
    setDefaultDate();
    navigateTo('home');
    if (app.settings.notifications) {
        showNotification('Income added successfully!');
    }
});

// Quick Add Modal
const modal = document.getElementById('quick-modal');
let quickAddType = 'expense';

document.getElementById('quick-add-expense').addEventListener('click', () => {
    quickAddType = 'expense';
    document.getElementById('modal-title').textContent = 'Quick Add Expense';
    modal.classList.add('active');
});

document.getElementById('quick-add-income').addEventListener('click', () => {
    quickAddType = 'income';
    document.getElementById('modal-title').textContent = 'Quick Add Income';
    modal.classList.add('active');
});

document.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

document.getElementById('quick-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const transaction = {
        id: Date.now().toString(),
        type: quickAddType,
        amount: document.getElementById('quick-amount').value,
        category: quickAddType === 'expense' ? 'Quick Add' : 'Quick Income',
        description: document.getElementById('quick-desc').value,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date()
    };
    app.transactions.push(transaction);
    saveData();
    updateStats();
    renderTransactions();
    renderTransactions('all');
    modal.classList.remove('active');
    document.getElementById('quick-form').reset();
    if (app.settings.notifications) {
        showNotification(`${quickAddType.charAt(0).toUpperCase() + quickAddType.slice(1)} added quickly!`);
    }
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.page);
    });
});

// Filter transactions
document.getElementById('filter-type').addEventListener('change', (e) => {
    renderTransactions(e.target.value);
});

// Settings
document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
    app.settings.darkMode = e.target.checked;
    document.body.classList.toggle('dark-mode');
    saveData();
});

document.getElementById('currency-select').addEventListener('change', (e) => {
    app.settings.currency = e.target.value;
    saveData();
    updateStats();
    renderTransactions();
    renderTransactions('all');
});

document.getElementById('language-select').addEventListener('change', (e) => {
    app.settings.language = e.target.value;
    saveData();
});

document.getElementById('notifications-toggle').addEventListener('change', (e) => {
    app.settings.notifications = e.target.checked;
    saveData();
});

document.getElementById('pin-lock-toggle').addEventListener('change', (e) => {
    app.settings.pinLock = e.target.checked;
    document.getElementById('pin-section').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('username-input').addEventListener('change', (e) => {
    app.settings.username = e.target.value;
    document.querySelector('.username').textContent = e.target.value;
    saveData();
});

document.getElementById('save-settings-btn').addEventListener('click', () => {
    if (app.settings.pinLock && document.getElementById('pin-input').value) {
        app.settings.pin = document.getElementById('pin-input').value;
    }
    saveData();
    showNotification('Settings saved successfully!');
});

// Data Management
document.getElementById('export-data-btn').addEventListener('click', () => {
    const dataStr = JSON.stringify(app, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Data exported successfully!');
});

document.getElementById('backup-data-btn').addEventListener('click', () => {
    const backup = {
        ...app,
        backupDate: new Date().toISOString()
    };
    localStorage.setItem('expenseTrackerBackup', JSON.stringify(backup));
    showNotification('Backup created successfully!');
});

document.getElementById('delete-all-data-btn').addEventListener('click', () => {
    if (confirm('Are you sure? This will delete ALL your data. This action cannot be undone!')) {
        if (confirm('Are you REALLY sure? Please confirm again.')) {
            app.transactions = [];
            saveData();
            updateStats();
            renderTransactions();
            renderTransactions('all');
            showNotification('All data deleted!');
            navigateTo('home');
        }
    }
});

document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (confirm('Are you sure? This will delete ALL transactions!')) {
        app.transactions = [];
        saveData();
        updateStats();
        renderTransactions();
        renderTransactions('all');
        showNotification('All transactions cleared!');
    }
});

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #26a69a;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize
loadData();
setDefaultDate();
updateStats();
renderTransactions();
renderTransactions('all');

// Apply saved dark mode
if (app.settings.darkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').checked = true;
}

// Apply saved settings
document.getElementById('username-input').value = app.settings.username;
document.querySelector('.username').textContent = app.settings.username;
document.getElementById('currency-select').value = app.settings.currency;
document.getElementById('language-select').value = app.settings.language;
document.getElementById('notifications-toggle').checked = app.settings.notifications;
document.getElementById('pin-lock-toggle').checked = app.settings.pinLock;
if (app.settings.pinLock) {
    document.getElementById('pin-section').style.display = 'block';
}

console.log('Daily Expense Tracker - Phase 1 Initialized');