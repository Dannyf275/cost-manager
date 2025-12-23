// src/App.js
import React, { useEffect, useState } from 'react';
// ייבוא רכיבי עיצוב מ-MUI (Material UI)
import { Container, Typography, Box, CircularProgress, Button, Toolbar, AppBar } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // אייקון גלגל שיניים
// ייבוא הקבצים הפנימיים שלנו
import { idb } from './idb';
import AddCostForm from './AddCostForm';
import Reports from './Reports';
import Settings from './Settings';

function App() {
  // --- ניהול ה-State (המצב) של האפליקציה ---

  // dbReady: האם החיבור למסד הנתונים הצליח?
  const [dbReady, setDbReady] = useState(false);
  
  // error: שומר הודעת שגיאה אם משהו נכשל בטעינה
  const [error, setError] = useState(null);
  
  // updateTrigger: משתנה שמשמש לאיתות לגרפים להתעדכן. 
  // בכל פעם שנוספת הוצאה, נגדיל את המספר הזה ב-1.
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // openSettings: האם חלון ההגדרות פתוח כרגע?
  const [openSettings, setOpenSettings] = useState(false);

  // --- אתחול (Initialization) ---
  
  // useEffect שרץ פעם אחת בטעינת האפליקציה
  useEffect(() => {
    // פתיחת מסד הנתונים (גרסה 1)
    idb.openCostsDB("costsdb", 1)
      .then(() => {
        setDbReady(true); // סימון שה-DB מוכן לעבודה
      })
      .catch((err) => {
        setError("Error Opening DB: " + err); // הצגת שגיאה למשתמש
      });
  }, []);

  // --- פונקציות עזר ---

  // פונקציה זו מועברת לטופס ונקראת לאחר שנוספה הוצאה בהצלחה
  const handleCostAdded = () => {
    setUpdateTrigger(prev => prev + 1); // רענון הגרפים
  };

  // --- תצוגה מותנית (לפני שהאפליקציה עולה) ---

  if (error) return <Typography color="error">{error}</Typography>;
  if (!dbReady) return <Box sx={{ display:'flex', justifyContent:'center', mt:10 }}><CircularProgress /></Box>;

  // --- התצוגה הראשית ---
  return (
    <>
      {/* סרגל עליון (AppBar) */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cost Manager
          </Typography>
          {/* כפתור הגדרות */}
          <Button color="inherit" startIcon={<SettingsIcon />} onClick={() => setOpenSettings(true)}>
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      {/* Container הראשי:
          הגדרת maxWidth="xl" מאפשרת לאתר להתפרס לרוחב רחב מאוד (כמעט מלא),
          מה שנותן לגרפים הרבה מקום לנשום.
      */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        {/* מרכוז הטופס:
            אנו עוטפים את הטופס כדי להגביל את רוחבו ל-800px ולמרכז אותו.
            זה אסתטי יותר מאשר טופס שנמתח מקצה לקצה.
        */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: '800px' }}>
                <AddCostForm onCostAdded={handleCostAdded} />
            </Box>
        </Box>
        
        {/* מרווח אנכי בין הטופס לגרפים */}
        <Box sx={{ my: 6 }} /> 
        
        {/* קומפוננטת הגרפים:
            היא תקבל את הרוחב המלא של ה-Container.
            אנו מעבירים לה את refreshTrigger כדי שתדע מתי להתעדכן.
        */}
        <Reports refreshTrigger={updateTrigger} />

      </Container>

      {/* חלון ההגדרות (נסתר כברירת מחדל) */}
      <Settings open={openSettings} onClose={() => setOpenSettings(false)} />
    </>
  );
}

export default App;