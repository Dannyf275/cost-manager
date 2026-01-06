// idb.js
// Data Access Layer (DAL) responsible for IndexedDB interactions and logic.
// Follows strict rules: semicolons, const/let, and custom exceptions.

// Import the custom exception class.
import CostManagerException from './cost_manager_exception';

// Define the namespace object for database operations.
export const idb = {
  // Property to hold the active database connection.
  db: null,

  /**
   * Opens the IndexedDB database.
   * @param {string} databaseName - The name of the database.
   * @param {number} databaseVersion - The version of the database.
   * @returns {Promise} - Resolves with the idb instance upon success.
   */
  openCostsDB: function (databaseName, databaseVersion) {
    // Return a new Promise to handle the async database opening operation.
    return new Promise((resolve, reject) => {
      // Attempt to open the database.
      const request = indexedDB.open(databaseName, databaseVersion);

      // Event handler for database upgrades (creation or version change).
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Check if the 'costs' object store exists; if not, create it.
        if (!db.objectStoreNames.contains("costs")) {
          // Create object store with auto-incrementing key 'id'.
          db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
        }
      };

      // Event handler for successful database opening.
      request.onsuccess = (event) => {
        // Store the result (database connection) in the 'db' property.
        this.db = event.target.result;
        // Resolve the promise with the current 'idb' object.
        resolve(this);
      };

      // Event handler for errors during opening.
      request.onerror = (event) => {
        // Reject with a custom CostManagerException.
        reject(new CostManagerException("Error opening database: " + event.target.error));
      };
    });
  },

  /**
   * Adds a cost item to the database.
   * @param {Object} cost - The cost data.
   * @returns {Promise} - Resolves with the added cost item.
   */
  addCost: async function (cost) {
    // Validate that the database connection is open.
    if (!this.db) {
        throw new CostManagerException("Database is not open.");
    }

    // Return a Promise for the add transaction.
    return new Promise((resolve, reject) => {
      const now = new Date();
      // Create the cost object to be stored, derived from input.
      const costItem = {
        sum: cost.sum,
        currency: cost.currency,
        category: cost.category,
        description: cost.description,
        date: now,
        month: now.getMonth() + 1, // Store month (1-12) explicitly.
        year: now.getFullYear(),   // Store year explicitly.
      };

      // Create a read-write transaction on the 'costs' store.
      const transaction = this.db.transaction(["costs"], "readwrite");
      const store = transaction.objectStore("costs");
      // Add the item to the store.
      const request = store.add(costItem);

      // Resolve on success.
      request.onsuccess = () => resolve(costItem);
      // Reject on error with custom exception.
      request.onerror = (event) => {
          reject(new CostManagerException("Error adding cost: " + event.target.error));
      };
    });
  },

  /**
   * Deletes a cost item by ID.
   * @param {number} id - The ID of the cost to delete.
   * @returns {Promise} - Resolves true on success.
   */
  deleteCost: function(id) {
    // Return a Promise for the delete transaction.
    return new Promise((resolve, reject) => {
        // Validate DB connection.
        if (!this.db) {
            reject(new CostManagerException("Database not open"));
            return;
        }
        // Create transaction.
        const transaction = this.db.transaction(["costs"], "readwrite");
        const store = transaction.objectStore("costs");
        // Perform delete.
        const request = store.delete(id);

        // Resolve on success.
        request.onsuccess = () => resolve(true);
        // Reject on error.
        request.onerror = (e) => reject(new CostManagerException("Error deleting cost"));
    });
  },

  /**
   * Helper to get exchange rates from server or defaults.
   * @returns {Promise<Object>} - The rates object.
   */
  _getRates: async function() {
      // Define default rates using object literal.
      let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
      
      // Check local storage for a custom URL.
      const apiUrl = localStorage.getItem("exchangeRatesUrl");
      
      if (apiUrl) {
          try {
              // Fetch rates from the URL.
              const response = await fetch(apiUrl);
              // Verify status code is exactly 200 as per language rules.
              if (response.status === 200) {
                  rates = await response.json();
              }
          } catch (error) { 
              console.error("Rate fetch error, using defaults", error); 
          }
      }
      return rates;
  },

  /**
   * Retrieves costs by year with normalized currency calculation.
   * @param {number} year - The year to filter.
   * @param {string} targetCurrency - The currency to calculate sums in.
   * @returns {Promise<Array>} - Array of costs with calculatedSum.
   */
  getCostsByYear: async function(year, targetCurrency = "USD") {
    // Return empty array if DB not initialized.
    if (!this.db) return []; 
    
    // Create read-only transaction.
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // Fetch all records.
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new CostManagerException(request.error));
    });

    // Filter costs by year.
    const yearlyCosts = allCosts.filter(c => c.year === year);
    // Get exchange rates asynchronously.
    const rates = await this._getRates();

    // Map results to include the calculated sum.
    return yearlyCosts.map(cost => {
        const rate = rates[cost.currency] || 1;
        // Normalize to base (USD) then to target.
        const valInUSD = cost.sum / rate;
        const valInTarget = valInUSD * rates[targetCurrency];
        
        return {
            ...cost,
            calculatedSum: valInTarget 
        };
    });
  },

  /**
   * Generates a monthly report.
   * @param {number} year 
   * @param {number} month 
   * @param {string} targetCurrency 
   * @returns {Promise<Object>}
   */
  getReport: async function (year, month, targetCurrency) {
    // Return empty structure if DB not open.
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // Fetch all costs.
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new CostManagerException(request.error));
    });

    // Filter by year and month.
    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    const rates = await this._getRates();
    let totalSum = 0;

    // Calculate sums for each item.
    const costsWithCalculation = filteredCosts.map(cost => {
      const currentRate = rates[cost.currency] || 1; 
      const costInUSD = cost.sum / currentRate;
      const costInTarget = costInUSD * rates[targetCurrency];
      
      totalSum += costInTarget;

      return {
          sum: cost.sum,
          currency: cost.currency,
          category: cost.category,
          description: cost.description,
          date: { day: cost.date ? cost.date.getDate() : 1 },
          calculatedSum: costInTarget
      };
    });

    // Return final report object.
    return {
      year: year,
      month: month,
      costs: costsWithCalculation,
      total: {
        currency: targetCurrency,
        total: parseFloat(totalSum.toFixed(2))
      }
    };
  },

  /**
   * Retrieves all costs (for history table).
   * @returns {Promise<Array>}
   */
  getAllCosts: async function() {
    if (!this.db) return [];
    
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            // Sort results by date descending.
            const result = request.result.sort((a, b) => b.date - a.date);
            resolve(result);
        };
        request.onerror = () => reject(new CostManagerException(request.error));
    });
  }
};