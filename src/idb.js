// src/idb.js
// קובץ זה משמש כשכבת הנתונים (Data Layer) של האפליקציה.
// הוא עוטף את הפונקציות של IndexedDB בתוך Promises כדי לאפשר עבודה נוחה עם async/await.

export const idb = {
  // משתנה המחזיק את החיבור הפתוח למסד הנתונים
  db: null,

  /**
   * פתיחת מסד הנתונים
   * @param {string} databaseName - שם מסד הנתונים
   * @param {number} databaseVersion - גרסת מסד הנתונים
   */
  openCostsDB: function (databaseName, databaseVersion) {
    // החזרת Promise כדי לאפשר למי שקורא לפונקציה להמתין לפתיחה (await)
    return new Promise((resolve, reject) => {
      // ניסיון פתיחת חיבור למסד הנתונים
      const request = indexedDB.open(databaseName, databaseVersion);

      // אירוע זה מתרחש רק כאשר גרסת ה-DB משתנה או כשהוא נוצר לראשונה
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // בדיקה האם טבלת "costs" כבר קיימת, ואם לא - יוצרים אותה
        if (!db.objectStoreNames.contains("costs")) {
          // יצירת Object Store (כמו טבלה) עם מפתח ראשי אוטומטי (Auto Increment)
          db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
        }
      };

      // אירוע המתרחש כשהפתיחה הצליחה
      request.onsuccess = (event) => {
        this.db = event.target.result; // שמירת החיבור במשתנה הגלובלי של האובייקט
        resolve(this); // החזרת האובייקט עצמו להמשך שרשור
      };

      // אירוע המתרחש במקרה של שגיאה
      request.onerror = (event) => {
        reject("Error opening database: " + event.target.error);
      };
    });
  },

  /**
   * הוספת הוצאה חדשה למסד הנתונים
   * @param {Object} cost - אובייקט המכיל את פרטי ההוצאה
   */
  addCost: async function (cost) {
    // בדיקת תקינות: האם החיבור למסד פתוח?
    if (!this.db) throw new Error("Database is not open.");

    return new Promise((resolve, reject) => {
      // יצירת תאריך נוכחי לשמירה עם ההוצאה
      const now = new Date();
      
      // הכנת האובייקט לשמירה, כולל שדות עזר לשליפה נוחה (חודש ושנה)
      const costItem = {
        sum: cost.sum,                 // סכום
        currency: cost.currency,       // מטבע (USD, ILS...)
        category: cost.category,       // קטגוריה
        description: cost.description, // תיאור
        date: now,                     // אובייקט Date מלא
        month: now.getMonth() + 1,     // חודש (1-12) לצורך סינון מהיר
        year: now.getFullYear(),       // שנה (למשל 2025)
      };

      // פתיחת טרנזקציה לכתיבה (readwrite) בטבלת costs
      const transaction = this.db.transaction(["costs"], "readwrite");
      const store = transaction.objectStore("costs");
      
      // ביצוע פעולת ההוספה
      const request = store.add(costItem);

      // טיפול בהצלחה - מחזירים את הפריט שנוסף
      request.onsuccess = () => resolve(costItem);
      
      // טיפול בכישלון
      request.onerror = (event) => reject("Error adding cost: " + event.target.error);
    });
  },

  /**
   * פונקציית עזר לשליפת כל ההוצאות בשנה מסוימת (עבור גרף העמודות)
   * @param {number} year - השנה המבוקשת
   */
  getCostsByYear: async function(year) {
    if (!this.db) return []; // אם אין מסד נתונים, מחזירים מערך ריק
    
    // פתיחת טרנזקציה לקריאה בלבד (readonly)
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    // שליפת כל הנתונים מהטבלה באמצעות getAll
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // סינון בזיכרון של רשומות השייכות לשנה המבוקשת
    return allCosts.filter(c => c.year === year);
  },

  /**
   * הפקת דוח חודשי כולל המרת מטבעות
   * @param {number} year - שנה
   * @param {number} month - חודש
   * @param {string} targetCurrency - המטבע לחישוב הסה"כ
   */
  getReport: async function (year, month, targetCurrency) {
    if (!this.db) return { costs: [], total: { currency: targetCurrency, total: 0 }};

    // שליפת כל הנתונים (כמו בפונקציה הקודמת)
    const transaction = this.db.transaction(["costs"], "readonly");
    const store = transaction.objectStore("costs");
    
    const allCosts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // סינון לפי שנה וחודש
    const filteredCosts = allCosts.filter(cost => 
      cost.year === year && cost.month === month
    );

    // --- התחלת לוגיקת שערי המרה ---
    
    // הגדרת שערי ברירת מחדל (Hardcoded) למקרה שאין חיבור לרשת
    let rates = { "USD": 1, "ILS": 3.4, "EURO": 0.7, "GBP": 0.6 };
    
    // בדיקה האם המשתמש שמר כתובת URL להבאת שערים בהגדרות
    const apiUrl = localStorage.getItem("exchangeRatesUrl");
    
    if (apiUrl) {
        try {
            // ניסיון למשוך שערים מהרשת
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                rates = data; // עדכון השערים בנתונים שהתקבלו מהשרת
                console.log("Using rates from server:", rates);
            }
        } catch (error) {
            console.error("Error fetching rates, using defaults:", error);
        }
    }
    // --- סיום לוגיקת שערי המרה ---

    let totalSum = 0;

    // לולאה לחישוב הסכום הכולל
    filteredCosts.forEach(cost => {
      // מציאת השער של המטבע המקורי (ברירת מחדל 1 אם לא קיים)
      const currentRate = rates[cost.currency] || 1; 
      
      // המרה לדולר (מטבע בסיס) - חלוקה בשער
      const costInUSD = cost.sum / currentRate;
      
      // המרה מדולר למטבע היעד - כפל בשער היעד
      const costInTarget = costInUSD * rates[targetCurrency];
      
      totalSum += costInTarget;
    });

    // החזרת האובייקט הסופי במבנה הנדרש בפרויקט
    return {
      year: year,
      month: month,
      costs: filteredCosts.map(c => ({
          sum: c.sum,
          currency: c.currency,
          category: c.category,
          description: c.description,
          date: { day: c.date.getDate() } // החזרת היום בחודש בלבד
      })),
      total: {
        currency: targetCurrency,
        total: parseFloat(totalSum.toFixed(2)) // עיגול ל-2 ספרות אחרי הנקודה
      }
    };
  }
};