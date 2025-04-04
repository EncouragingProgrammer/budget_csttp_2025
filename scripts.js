/* File: scripts.js */

// Get references to DOM elements for the forms, table, and chart canvas
const budgetForm = document.getElementById('budget-form');
const transactionForm = document.getElementById('transaction-form');
const budgetTableBody = document.querySelector('#budget-table tbody');
const chartCanvas = document.getElementById('budgetChart');
let chart; // Will hold our Chart.js instance

/**
 * Helper function to retrieve JSON-parsed data from localStorage.
 * If no data exists, return an empty array.
 */
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Helper function to save data (as JSON string) to localStorage.
 */
function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Normalize a category name:
 * Capitalize first letter, lowercase the rest.
 * Example: "STEAK" → "Steak"
 */
function normalizeCategory(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  

/**
 * Main function to update the budget table and bar chart.
 * This is called on page load, and after any changes.
 */
function updateTableAndChart() {
  const categories = getData('categories');     // All budget categories
  const transactions = getData('transactions'); // All recorded transactions

  // Calculate total actual spending per category
  const actualMap = {};
  for (const tx of transactions) {
    if (!actualMap[tx.category]) actualMap[tx.category] = 0;
    actualMap[tx.category] += parseFloat(tx.amount);
  }

  // Clear the budget table before repopulating
  budgetTableBody.innerHTML = '';

  // Arrays for building the chart
  const labels = [], budgeted = [], actual = [], bgColors = [];

  // Loop through each category and populate table + chart arrays
  for (const cat of categories) {
    const spent = actualMap[cat.name] || 0; // Get spent amount or default to 0
    budgetTableBody.innerHTML += `
      <tr>
        <td>${cat.name}</td>
        <td>$${cat.amount.toFixed(2)}</td>
        <td>$${spent.toFixed(2)}</td>
      </tr>
    `;
    labels.push(cat.name);
    budgeted.push(cat.amount);
    actual.push(spent);
    bgColors.push(spent > cat.amount ? 'red' : 'green'); // Red if over budget
  }

  // Destroy previous chart instance if it exists, to avoid duplication
  if (chart) chart.destroy();

  // Create new bar chart with Chart.js
  chart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Budgeted',
          data: budgeted,
          backgroundColor: 'blue' // All budget bars are blue
        },
        {
          label: 'Actual',
          data: actual,
          backgroundColor: bgColors // Green if under, red if over
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } } // Always start chart at 0
    }
  });
}

/**
 * Event handler for submitting a new budget category.
 * Adds the category and budgeted amount to localStorage.
 */
budgetForm.addEventListener('submit', e => {
    e.preventDefault();
  
    // Normalize name (e.g., 'STEAK' → 'Steak')
    const rawName = document.getElementById('category-name').value.trim();
    const name = normalizeCategory(rawName);
    const amount = parseFloat(document.getElementById('budget-amount').value);
    if (!name || isNaN(amount)) return;
  
    const categories = getData('categories');
  
    // Check for existing category using lowercase comparison
    const existing = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  
    if (existing) {
      existing.name = name;     // Update name to normalized format (e.g., "steak" → "Steak")
      existing.amount = amount; // Update budgeted amount
    } else {
      categories.push({ name, amount }); // Add new category
    }
  
    setData('categories', categories);
    budgetForm.reset();
    updateTableAndChart();
  });
  

/**
 * Event handler for submitting a new transaction.
 * Saves the transaction, and auto-creates a category if it doesn't exist.
 */
transactionForm.addEventListener('submit', e => {
    e.preventDefault();
  
    const rawCategory = document.getElementById('transaction-category').value.trim();
    const category = normalizeCategory(rawCategory);
  
    const transaction = {
      date: document.getElementById('transaction-date').value,
      amount: parseFloat(document.getElementById('transaction-amount').value),
      category,
      location: document.getElementById('transaction-location').value,
      store: document.getElementById('transaction-store').value,
      id: document.getElementById('transaction-id').value
    };
  
    if (!category || isNaN(transaction.amount)) return;
  
    const categories = getData('categories');
    const existing = categories.find(cat => cat.name.toLowerCase() === category.toLowerCase());
  
    if (!existing) {
      categories.push({ name: category, amount: 0 }); // Add missing category with $0 budget
      setData('categories', categories);
    }
  
    const transactions = getData('transactions');
    transactions.push(transaction);
    setData('transactions', transactions);
  
    transactionForm.reset();
    updateTableAndChart();
  });
  
