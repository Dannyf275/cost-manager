// src/App.js
import React, { useEffect, useState } from 'react';
// Import Material UI components for layout and styling
import { Container, Typography, Box, CircularProgress, Button, Toolbar, AppBar } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // Icon for the settings button
// Import local components and logic
import { idb } from './idb';
import AddCostForm from './AddCostForm';
import Reports from './Reports';
import Settings from './Settings';

function App() {
  // --- State Management ---
  
  // Tracks if the database connection has been established
  const [dbReady, setDbReady] = useState(false);
  
  // Tracks initialization errors
  const [error, setError] = useState(null);
  
  // A numeric counter used to trigger re-renders in child components (Reports)
  // When a cost is added, this number increments, forcing the reports to refresh.
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Controls the visibility of the Settings dialog
  const [openSettings, setOpenSettings] = useState(false);

  // --- Initialization ---
  
  // Effect runs once on mount to open the database connection
  useEffect(() => {
    idb.openCostsDB("costsdb", 1)
      .then(() => {
        setDbReady(true); // DB is ready for interactions
      })
      .catch((err) => {
        setError("Error Opening DB: " + err); // Handle failure
      });
  }, []);

  // --- Handlers ---

  // Callback passed to AddCostForm. Called when a new item is successfully added.
  const handleCostAdded = () => {
    setUpdateTrigger(prev => prev + 1); // Increment trigger to refresh charts
  };

  // --- Conditional Rendering ---

  // If there is an error, display it and stop rendering
  if (error) return <Typography color="error">{error}</Typography>;
  
  // If DB is connecting, show a loading spinner
  if (!dbReady) return <Box sx={{ display:'flex', justifyContent:'center', mt:10 }}><CircularProgress /></Box>;

  // --- Main Render ---
  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cost Manager
          </Typography>
          {/* Settings Button */}
          <Button color="inherit" startIcon={<SettingsIcon />} onClick={() => setOpenSettings(true)}>
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Layout Container. 
          maxWidth="xl" ensures the content spans almost the full width of the screen,
          preventing charts from appearing cramped.
      */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        {/* Form Container:
            Centered and restricted to 800px width for better aesthetics.
        */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: '800px' }}>
                <AddCostForm onCostAdded={handleCostAdded} />
            </Box>
        </Box>
        
        {/* Vertical spacer */}
        <Box sx={{ my: 6 }} /> 
        
        {/* Reports Section:
            Passes the refreshTrigger so charts update automatically on data changes.
        */}
        <Reports refreshTrigger={updateTrigger} />

      </Container>

      {/* Settings Dialog Component */}
      <Settings open={openSettings} onClose={() => setOpenSettings(false)} />
    </>
  );
}

export default App;