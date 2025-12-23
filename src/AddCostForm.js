// src/AddCostForm.js
import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Paper, Grid, Alert, Snackbar } from '@mui/material';
import { idb } from './idb';

// רשימות קבועות עבור תיבות הבחירה
const CATEGORIES = ['FOOD', 'HEALTH', 'EDUCATION', 'TRAVEL', 'HOUSING', 'OTHER'];
const CURRENCIES = ['USD', 'ILS', 'GBP', 'EURO'];

export default function AddCostForm({ onCostAdded }) {
  // State עבור כל שדה בטופס
  const [sum, setSum] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  
  // State להודעת האישור הקופצת (Snackbar)
  const [openAlert, setOpenAlert] = useState(false);

  // פונקציה המטפלת בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault(); // מניעת רענון אוטומטי של הדף
    
    // בדיקה ששדות החובה מולאו
    if (!sum || !description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // קריאה לפונקציה ב-idb.js להוספת הרשומה
      await idb.addCost({
        sum: Number(sum), // המרה למספר
        category,
        currency,
        description
      });

      // איפוס השדות לאחר ההוספה
      setSum('');
      setDescription('');
      setCategory('FOOD');
      setOpenAlert(true); // הצגת הודעת הצלחה
      
      // הפעלת ה-Callback לעדכון שאר האפליקציה (הגרפים)
      if (onCostAdded) onCostAdded();

    } catch (error) {
      console.error("Failed to add cost", error);
      alert("Error adding cost");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Add New Cost</Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {/* שדה סכום */}
          <Grid item xs={12} sm={6}>
            <TextField 
                fullWidth label="Sum" type="number" 
                value={sum} onChange={(e) => setSum(e.target.value)} required 
            />
          </Grid>
          {/* שדה מטבע */}
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          {/* שדה קטגוריה */}
          <Grid item xs={12}>
            <TextField select fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          {/* שדה תיאור */}
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Grid>
        </Grid>
        
        {/* כפתור הוספה */}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>Add Cost</Button>
      </Box>

      {/* רכיב הודעה קופצת להצלחה */}
      <Snackbar open={openAlert} autoHideDuration={3000} onClose={() => setOpenAlert(false)}>
        <Alert severity="success">Item added successfully!</Alert>
      </Snackbar>
    </Paper>
  );
}