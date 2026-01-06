// src/AddCostForm.js
import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Paper, Grid, Alert, Snackbar } from '@mui/material';
import { idb } from './idb';

// Constants for dropdown options
const CATEGORIES = ['FOOD', 'HEALTH', 'EDUCATION', 'TRAVEL', 'HOUSING', 'OTHER'];
const CURRENCIES = ['USD', 'ILS', 'GBP', 'EURO'];

export default function AddCostForm({ onCostAdded }) {
  // --- Local State for Form Fields ---
  const [sum, setSum] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  
  // State for the success notification popup
  const [openAlert, setOpenAlert] = useState(false);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    
    // Basic Validation
    if (!sum || !description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Call DAL to add cost to IndexedDB
      await idb.addCost({
        sum: Number(sum), // Convert string input to number
        category,
        currency,
        description
      });

      // Reset form fields upon success
      setSum('');
      setDescription('');
      setCategory('FOOD');
      setOpenAlert(true); // Show success message
      
      // Trigger parent update (refresh charts)
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
          {/* Sum Input */}
          <Grid item xs={12} sm={6}>
            <TextField 
                fullWidth label="Sum" type="number" 
                value={sum} onChange={(e) => setSum(e.target.value)} required 
            />
          </Grid>
          {/* Currency Select */}
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          {/* Category Select */}
          <Grid item xs={12}>
            <TextField select fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          {/* Description Input */}
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Grid>
        </Grid>
        
        {/* Submit Button */}
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>Add Cost</Button>
      </Box>

      {/* Success Notification */}
      <Snackbar open={openAlert} autoHideDuration={3000} onClose={() => setOpenAlert(false)}>
        <Alert severity="success">Item added successfully!</Alert>
      </Snackbar>
    </Paper>
  );
}