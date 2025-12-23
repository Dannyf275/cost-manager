// src/Settings.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from '@mui/material';

// קומפוננטה המקבלת פרופ האם היא פתוחה (open) ופונקציה לסגירה (onClose)
export default function Settings({ open, onClose }) {
  const [url, setUrl] = useState('');

  // בעת פתיחת החלון, נבדוק אם יש כבר כתובת שמורה ב-localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("exchangeRatesUrl");
    if (savedUrl) {
      setUrl(savedUrl);
    }
  }, [open]);

  // שמירת הכתובת כאשר המשתמש לוחץ על Save
  const handleSave = () => {
    if (url) {
      // שמירה באחסון המקומי של הדפדפן
      localStorage.setItem("exchangeRatesUrl", url);
      alert("URL saved successfully!");
      onClose(); // סגירת החלון
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
          Enter the URL for fetching currency exchange rates (JSON format).
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Exchange Rates URL"
          type="url"
          fullWidth
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://gist.githubusercontent.com/..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}