// src/idb.js
// This file acts as the Data Access Layer (DAL) for the application.
// It wraps IndexedDB's event-based API in Promises to allow for modern async/await syntax.

export const idb = {
  // Holds the reference to the open database connection
  db: null,

  /**
   * Opens the IndexedDB database.
   * If the database or object store does not exist, it creates them.
   * @param {string} databaseName - The name of the database.
   * @param {number} databaseVersion - The version of the database.
   * @returns {Promise} - Resolves with the idb object instance.
   */
  openCostsDB: function (databaseName, databaseVersion) {
    return new Promise((resolve, reject) => {
      // Attempt to open the database
      const request = indexedDB.open(databaseName, databaseVersion);

      // This event triggers only if the database is being created or the version is higher
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Check if the 'costs' object store (table) already exists
        if (!db.objectStoreNames.contains("costs")) {
          // Create the object store with an auto-incrementing primary key 'id'
          db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
        }
      };

      // Event triggered when the database opens successfully
      request.onsuccess = (event) => {
        this.db = event.target.result; // Store the db connection
        resolve(this); // Resolve the promise to allow chaining
      };

      // Event triggered if there is an error opening the database
      request.onerror = (event) => {
        reject("Error opening database: " + event.target.error);
      };
    });
  },

  /**
   * Adds a new cost item to the 'costs' object store.
   * @param {Object} cost - The cost object containing sum, currency, category, etc.
   * @returns {Promise} - Resolves with the added cost object.
   */
  addCost: async function (cost) {
    // Validation: Ensure database is open
    if (!this.db) throw new Error("Database is not open.");

    return new Promise((resolve, reject) => {
      const now = new Date();
      // Prepare the object for storage, adding derived date fields for easier querying later
      const costItem = {
        sum: cost.sum,
        currency: cost.currency,
        category: cost.category,
        description: cost.description,
        date: now,           // Full Date object
        month: now.getMonth() + 1, // Store month (1-12) explicitly for filtering
        year: now.getFullYear(),   // Store year explicitly for filtering
      };

      // Create a read-write transaction for the 'costs' store
      const transaction = this.db.transaction(["costs"], "readwrite");
      const store = transaction.objectStore("costs");
      
      // Perform the add operation
      const request = store.add(costItem);

      request.onsuccess = () => resolve(costItem); // Return the added item on success
      request.onerror = (event) => reject("Error adding cost: " + event.target.error);
    });
  },

  /**
   * Internal helper function to fetch exchange rates.
   * Tries to fetch from a user-defined URL (localStorage), otherwise uses defaults.
   * @returns {Promise<Object>} - An object containing currency rates.
   */
  _getRates: async function() {
      // Default hardcoded rates (Base: USD = 1)
      let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
      
      // Check if the user has saved a custom API URL in LocalStorage
      const apiUrl = localStorage.getItem("exchangeRatesUrl");
      if (apiUrl) {
          try {
              // Attempt to fetch fresh rates from the network
              const response = await fetch(apiUrl);
              if (response.ok) {
                  rates = await response.json(); // Update rates with server data
              }
          } catch (error) { 
              // If fetch fails, silently fall back to default rates
              console.error("Rate fetch error, using defaults", error); 
          }
      }
      return rates;
  },

  /**
   * Retrieves all costs for a specific year and calculates their value in a target currency.
   * Used primarily for the Bar Chart.
   * @param {number} year - The year to filter by.
   * @param {string} targetCurrency - The currency to convert amounts to (default: USD).
   * @returns {Promise<Array>} - Array of cost objects with a new 'calculatedSum' field.
   */
  getCostsByYear: async function(year, targetCurrency = "USD") {
    if (!this.db) return []; 
    
    // Create a read-only transaction for fetching data
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // Fetch all records from the store
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Filter results in memory for the requested year
    const yearlyCosts = allCosts.filter(c => c.year === year);
    
    // Fetch current exchange rates
    const rates = await this._getRates();

    // Map over costs to calculate the normalized sum
    return yearlyCosts.map(cost => {
        // Determine rate for the cost's original currency
        const rate = rates[cost.currency] || 1;
        
        // Convert to Base (USD) then to Target Currency
        const valInUSD = cost.sum / rate;
        const valInTarget = valInUSD * rates[targetCurrency];
        
        // Return cost object extended with the calculated value
        return {
            ...cost,
            calculatedSum: valInTarget // This field is used by the charts
        };
    });
  },

  /**
   * Generates a detailed monthly report.
   * Includes normalization of all costs to the target currency.
   * @param {number} year - The year.
   * @param {number} month - The month.
   * @param {string} targetCurrency - The currency for the report totals.
   * @returns {Promise<Object>} - Object containing the costs array and total sum.
   */
  getReport: async function (year, month, targetCurrency) {
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // Fetch all data
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Filter for the specific month and year
    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    const rates = await this._getRates();

    let totalSum = 0;

    // Process each cost item to calculate values
    const costsWithCalculation = filteredCosts.map(cost => {
      const currentRate = rates[cost.currency] || 1; 
      
      // Perform conversion
      const costInUSD = cost.sum / currentRate;
      const costInTarget = costInUSD * rates[targetCurrency];
      
      // Accumulate total
      totalSum += costInTarget;

      // Return the structure required by the project specs, plus calculatedSum for internal UI use
      return {
          sum: cost.sum,
          currency: cost.currency,
          category: cost.category,
          description: cost.description,
          date: { day: cost.date ? cost.date.getDate() : 1 },
          calculatedSum: costInTarget 
      };
    });

    // Return the final report object
    return {
      year: year,
      month: month,
      costs: costsWithCalculation,
      total: {
        currency: targetCurrency,
        total: parseFloat(totalSum.toFixed(2)) // Round to 2 decimal places
      }
    };
  }
};