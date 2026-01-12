// app.js
// Main Application Component.
// Coordinates UI layout, state, animations, and data flow.

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Button, Toolbar, AppBar, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { motion } from 'framer-motion';

// Import local components using lowercase filenames.
import { idb } from './idb';
import AddCostForm from './add_cost_form';
import Reports from './reports';
import Settings from './settings';
import CostTable from './cost_table';

/**
 * AnimatedSection Component.
 * Wraps children to provide scroll-triggered fade/scale animations.
 * @param {Object} props - Component props containing children.
 */
const AnimatedSection = ({ children }) => {
  return (
    <motion.div
      // Start state: invisible and shifted down.
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      // Visible state: opaque and in position.
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      // Exit state (when scrolling out): fade out.
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      // Viewport config: trigger every time (once: false) when 30% visible.
      viewport={{ once: false, amount: 0.3 }}
      // Transition config: smooth ease-out.
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  // State for DB readiness.
  const [dbReady, setDbReady] = useState(false);
  // State for error handling.
  const [error, setError] = useState(null);
  // State trigger to force updates in child components.
  const [updateTrigger, setUpdateTrigger] = useState(0);
  // State for Settings dialog visibility.
  const [openSettings, setOpenSettings] = useState(false);

  // Initialize DB on mount.
  useEffect(() => {
    idb.openCostsDB("costsdb", 1)
      .then(() => {
        setDbReady(true);
      })
      .catch((err) => {
        // Display error message from exception.
        setError("Error Opening DB: " + err.message);
      });
  }, []);

  // Handler to refresh data when cost is added/deleted.
  const handleDataChange = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  // Render error state if needed.
  if (error) return <Typography color="error" align="center" sx={{ mt: 4 }}>{error}</Typography>;
  
  // Render loading state while DB opens.
  if (!dbReady) return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={60} thickness={4} />
    </Box>
  );

  return (
    <>
      {/* Header Bar with Glassmorphism effect */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: 'rgba(25, 118, 210, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1100
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 1 }}>
            <AccountBalanceWalletIcon fontSize="large" />
          </IconButton>
          
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold', 
              letterSpacing: '1px', 
              textShadow: '0 2px 4px rgba(0,0,0,0.2)' 
            }}
          >
            Cost Manager
          </Typography>

          <Button 
            color="inherit" 
            startIcon={<SettingsIcon />} 
            onClick={() => setOpenSettings(true)}
            sx={{ 
              borderRadius: '20px', 
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 15 }}>
          {/* Animated Form Section */}
          <AnimatedSection>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: '800px' }}>
                    <AddCostForm onCostAdded={handleDataChange} />
                </Box>
            </Box>
          </AnimatedSection>
          
          <Box sx={{ my: 8 }} /> 
          
          {/* Animated Reports Section */}
          <AnimatedSection>
            <Reports refreshTrigger={updateTrigger} />
          </AnimatedSection>

          <Box sx={{ my: 8 }} /> 

          {/* Animated History Table Section */}
          <AnimatedSection>
            <CostTable refreshTrigger={updateTrigger} onCostDeleted={handleDataChange} />
          </AnimatedSection>

      </Container>

      {/* Settings Dialog */}
      <Settings open={openSettings} onClose={() => setOpenSettings(false)} />
    </>
  );
}

export default App;