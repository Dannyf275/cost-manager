// add_cost_form.js
// Component for adding new costs to the database.

import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Paper, Grid, Alert, Snackbar } from '@mui/material';
import { idb } from './idb';

const CATEGORIES = ['FOOD', 'HEALTH', 'EDUCATION', 'TRAVEL', 'HOUSING', 'OTHER'];
const CURRENCIES = ['USD', 'ILS', 'GBP', 'EURO'];

const CURRENCY_SYMBOLS = {
    'USD': '$',
    'ILS': '₪',
    'GBP': '£',
    'EURO': '€'
};

export default function AddCostForm({ onCostAdded }) {
  // State for form fields.
  const [sum, setSum] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [openAlert, setOpenAlert] = useState(false);

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sum || !description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await idb.addCost({
        sum: Number(sum),
        category,
        currency,
        description
      });

      // Clear form on success.
      setSum('');
      setDescription('');
      setCategory('FOOD');
      setOpenAlert(true);
      
      // Notify parent to refresh.
      if (onCostAdded) onCostAdded();

    } catch (error) {
      console.error("Failed to add cost", error);
      alert("Error adding cost: " + error.message);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Add New Cost</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField 
                fullWidth label="Sum" type="number" 
                value={sum} onChange={(e) => setSum(e.target.value)} required 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                      {opt} ({CURRENCY_SYMBOLS[opt]})
                  </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField select fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Grid>
        </Grid>
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>Add Cost</Button>
      </Box>
      <Snackbar open={openAlert} autoHideDuration={3000} onClose={() => setOpenAlert(false)}>
        <Alert severity="success">Item added successfully!</Alert>
      </Snackbar>
    </Paper>
  );
}