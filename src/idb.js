// src/idb.js
// קובץ זה אחראי על ניהול מסד הנתונים ועל הלוגיקה העסקית (כמו המרות מטבע).

export const idb = {
  db: null,

  /**
   * פתיחת חיבור ל-IndexedDB
   * יוצר את ה-Object Store אם הוא לא קיים.
   */
  openCostsDB: function (databaseName, databaseVersion) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("costs")) {
          // יצירת טבלה עם מפתח ראשי אוטומטי
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

  /**
   * הוספת הוצאה חדשה.
   * שומר את הסכום והמטבע המקוריים כפי שהוזנו.
   */
  addCost: async function (cost) {
    if (!this.db) throw new Error("Database is not open.");

    return new Promise((resolve, reject) => {
      const now = new Date();
      // יצירת אובייקט לשמירה
      const costItem = {
        sum: cost.sum,
        currency: cost.currency,
        category: cost.category,
        description: cost.description,
        date: now,
        month: now.getMonth() + 1, // שומרים חודש בנפרד לשליפה מהירה
        year: now.getFullYear(),   // שומרים שנה בנפרד
      };

      const transaction = this.db.transaction(["costs"], "readwrite");
      const store = transaction.objectStore("costs");
      const request = store.add(costItem);

      request.onsuccess = () => resolve(costItem);
      request.onerror = (event) => reject("Error adding cost: " + event.target.error);
    });
  },

  /**
   * פונקציה פנימית (Helper) לקבלת שערי המטבע.
   * מנסה למשוך מה-localStorage (אם הוגדר URL), אחרת מחזירה ברירת מחדל.
   */
  _getRates: async function() {
      // שערי ברירת מחדל למקרה שאין אינטרנט או לא הוגדר URL
      let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
      
      const apiUrl = localStorage.getItem("exchangeRatesUrl");
      if (apiUrl) {
          try {
              const response = await fetch(apiUrl);
              if (response.ok) {
                  rates = await response.json(); // עדכון השערים מהשרת
              }
          } catch (error) { 
              console.error("Rate fetch error, using defaults", error); 
          }
      }
      return rates;
  },

  /**
   * שליפת הוצאות לפי שנה (עבור ה-Bar Chart).
   * כולל חישוב המרה למטבע יעד (ברירת מחדל ILS).
   */
  getCostsByYear: async function(year, targetCurrency = "ILS") {
    if (!this.db) return []; 
    
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // שליפת כל הנתונים
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // סינון לפי השנה
    const yearlyCosts = allCosts.filter(c => c.year === year);
    
    // קבלת השערים העדכניים
    const rates = await this._getRates();

    // החזרת הנתונים עם שדה מחושב חדש
    return yearlyCosts.map(cost => {
        // מציאת שער המטבע המקורי (או 1 אם לא נמצא)
        const rate = rates[cost.currency] || 1;
        
        // המרה: (סכום / שער מקור) * שער יעד
        const valInUSD = cost.sum / rate;
        const valInTarget = valInUSD * rates[targetCurrency];
        
        return {
            ...cost,
            calculatedSum: valInTarget // <--- השדה הקריטי לגרפים
        };
    });
  },

  /**
   * הפקת דוח מפורט לחודש מסוים.
   */
  getReport: async function (year, month, targetCurrency) {
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // סינון לפי חודש ושנה
    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    const rates = await this._getRates(); // משיכת שערים

    let totalSum = 0;

    // עיבוד הרשימה והוספת שדות מחושבים
    const costsWithCalculation = filteredCosts.map(cost => {
      const currentRate = rates[cost.currency] || 1; 
      
      // חישוב הערך המומר
      const costInUSD = cost.sum / currentRate;
      const costInTarget = costInUSD * rates[targetCurrency];
      
      totalSum += costInTarget;

      return {
          sum: cost.sum,
          currency: cost.currency,
          category: cost.category,
          description: cost.description,
          date: { day: cost.date ? cost.date.getDate() : 1 },
          calculatedSum: costInTarget // <--- שמירת הערך המומר לשימוש בגרף העוגה
      };
    });

    return {
      year: year,
      month: month,
      costs: costsWithCalculation,
      total: {
        currency: targetCurrency,
        total: parseFloat(totalSum.toFixed(2))
      }
    };
  }
};