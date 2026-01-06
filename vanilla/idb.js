// idb.js - Vanilla Version (Final Submission)
// This file contains the core logic without React dependencies for automated testing.

const idb = {
  db: null,

  // 1. Open Database
  openCostsDB: function (databaseName, databaseVersion) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("costs")) {
          db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };

      request.onerror = (event) => {
        reject("Error opening database: " + event.target.error);
      };
    });
  },

  // 2. Add Cost Item
  addCost: function (cost) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database is not open.");
        return;
      }
      const now = new Date();
      const costItem = {
        sum: cost.sum,
        currency: cost.currency,
        category: cost.category,
        description: cost.description,
        date: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };

      const transaction = this.db.transaction(["costs"], "readwrite");
      const store = transaction.objectStore("costs");
      const request = store.add(costItem);

      request.onsuccess = () => {
        resolve(costItem);
      };

      request.onerror = (event) => {
        reject("Error adding cost: " + event.target.error);
      };
    });
  },

  // 3. Get Report (Includes Rate Calculation Logic)
  getReport: async function (year, month, targetCurrency) {
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Filter by date
    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    // --- Exchange Rate Logic ---
    let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
    
    // Attempt to fetch from LocalStorage if environment supports it
    if (typeof localStorage !== 'undefined') {
        const apiUrl = localStorage.getItem("exchangeRatesUrl");
        if (apiUrl) {
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    rates = await response.json();
                }
            } catch (e) { 
                console.error("Error fetching rates in vanilla idb", e); 
            }
        }
    }

    let totalSum = 0;

    // Calculate Total Sum
    filteredCosts.forEach(cost => {
      const rate = rates[cost.currency] || 1; 
      // Convert to Base (USD)
      const costInUSD = cost.sum / rate;
      // Convert to Target
      const costInTarget = costInUSD * rates[targetCurrency];
      
      totalSum += costInTarget;
    });

    // Return Report Object
    return {
      year: year,
      month: month,
      // Return original cost objects as per requirements
      costs: filteredCosts.map(c => ({
          sum: c.sum,
          currency: c.currency,
          category: c.category,
          description: c.description,
          date: { day: c.date.getDate() }
      })),
      total: {
        currency: targetCurrency,
        total: parseFloat(totalSum.toFixed(2))
      }
    };
  }
};