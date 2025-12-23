// src/App.js
import React, { useEffect, useState } from 'react';
// ייבוא רכיבי עיצוב מ-Material UI
import { Container, Typography, Box, CircularProgress, Button, Toolbar, AppBar } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // אייקון גלגל שיניים
import { idb } from './idb'; // ייבוא שכבת הנתונים
import AddCostForm from './AddCostForm'; // קומפוננטת הטופס
import Reports from './Reports'; // קומפוננטת הגרפים
import Settings from './Settings'; // קומפוננטת ההגדרות

function App() {
  // משתני State לניהול מצב האפליקציה
  const [dbReady, setDbReady] = useState(false); // האם מסד הנתונים נטען?
  const [error, setError] = useState(null);      // האם יש שגיאה?
  const [updateTrigger, setUpdateTrigger] = useState(0); // מונה שמשמש לרענון הגרפים
  const [openSettings, setOpenSettings] = useState(false); // האם חלון ההגדרות פתוח?

  // useEffect שרץ פעם אחת בטעינת האפליקציה כדי לפתוח את ה-DB
  useEffect(() => {
    idb.openCostsDB("costsdb", 1)
      .then(() => {
        setDbReady(true); // סימון שה-DB מוכן
        console.log("DB Initialized");
      })
      .catch((err) => {
        setError("Error Opening DB: " + err); // שמירת השגיאה לתצוגה
        console.error(err);
      });
  }, []);

  // פונקציה שמועברת לטופס ונקראת כאשר נוצרת הוצאה חדשה
  const handleCostAdded = () => {
    // עדכון המונה גורם לקומפוננטות התלויות בו (כמו Reports) להתרענן מחדש
    setUpdateTrigger(prev => prev + 1);
  };

  // תצוגה במקרה של שגיאה
  if (error) return <Typography color="error">{error}</Typography>;
  
  // תצוגת טעינה (ספינר) עד שה-DB מוכן
  if (!dbReady) return <Box sx={{ display:'flex', justifyContent:'center', mt:10 }}><CircularProgress /></Box>;

  // התצוגה הראשית
  return (
    <>
      {/* סרגל עליון (AppBar) */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cost Manager
          </Typography>
          {/* כפתור הגדרות שפותח את ה-Dialog */}
          <Button color="inherit" startIcon={<SettingsIcon />} onClick={() => setOpenSettings(true)}>
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      {/* מיכל התוכן הראשי */}
      <Container maxWidth="lg">
        {/* טופס הוספת הוצאה - מקבל את פונקציית העדכון כ-Prop */}
        <AddCostForm onCostAdded={handleCostAdded} />
        
        {/* מרווח אנכי */}
        <Box sx={{ my: 4 }} /> 
        
        {/* אזור הדוחות - מקבל את הטריגר כדי לדעת מתי להתעדכן */}
        <Reports refreshTrigger={updateTrigger} />
      </Container>

      {/* חלון ההגדרות (נסתר כברירת מחדל) */}
      <Settings open={openSettings} onClose={() => setOpenSettings(false)} />
    </>
  );
}

export default App;