// idb.js (Vanilla)
// Standalone version for testing logic without module system.

// Define exception locally for standalone use.
function CostManagerException(message) {
    this.message = message;
}

// Define the idb object globally or as a const.
const idb = {
  db: null,

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
        reject(new CostManagerException("Error opening database: " + event.target.error));
      };
    });
  },

  addCost: function (cost) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new CostManagerException("Database is not open."));
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
        reject(new CostManagerException("Error adding cost: " + event.target.error));
      };
    });
  },

  deleteCost: function(id) {
    return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new CostManagerException("Database not open"));
            return;
        }
        const transaction = this.db.transaction(["costs"], "readwrite");
        const store = transaction.objectStore("costs");
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(new CostManagerException("Error deleting cost"));
    });
  },

  getReport: async function (year, month, targetCurrency) {
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new CostManagerException(request.error));
    });

    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
    
    if (typeof localStorage !== 'undefined') {
        const apiUrl = localStorage.getItem("exchangeRatesUrl");
        if (apiUrl) {
            try {
                const response = await fetch(apiUrl);
                if (response.status === 200) {
                    rates = await response.json();
                }
            } catch (e) { 
                console.error("Error fetching rates in vanilla idb", e); 
            }
        }
    }

    let totalSum = 0;

    filteredCosts.forEach(cost => {
      const rate = rates[cost.currency] || 1; 
      const costInUSD = cost.sum / rate;
      const costInTarget = costInUSD * rates[targetCurrency];
      
      totalSum += costInTarget;
    });

    return {
      year: year,
      month: month,
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