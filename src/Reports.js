// src/Reports.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
// Import Recharts components for data visualization
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { idb } from './idb';

// Constants for UI display
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2023, 2024, 2025, 2026];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

export default function Reports({ refreshTrigger }) {
    // --- State Variables ---
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [pieData, setPieData] = useState([]); // Data for Pie Chart
    const [barData, setBarData] = useState([]); // Data for Bar Chart

    // --- Data Fetching Logic ---
    useEffect(() => {
        const updateGraphData = async () => {
            try {
                // Define the main currency for display (converted values)
                const TARGET_CURRENCY = "USD"; 

                // --- 1. Prepare Pie Chart Data ---
                // Fetch report for the specific month
                const report = await idb.getReport(selectedYear, selectedMonth, TARGET_CURRENCY);
                const categoryMap = {};
                
                // Aggregate sums by category using the calculated (converted) value
                report.costs.forEach(cost => {
                    const val = Number(cost.calculatedSum); 
                    categoryMap[cost.category] = (categoryMap[cost.category] || 0) + val;
                });

                // Format data for Recharts: [{ name: 'Food', value: 120 }, ...]
                const pData = Object.keys(categoryMap).map(cat => ({
                    name: cat,
                    value: parseFloat(categoryMap[cat].toFixed(2))
                }));
                setPieData(pData);

                // --- 2. Prepare Bar Chart Data ---
                // Fetch costs for the entire year
                const yearlyCosts = await idb.getCostsByYear(selectedYear, TARGET_CURRENCY);
                const monthlyTotals = Array(12).fill(0); // Initialize 12 months with 0
                
                // Aggregate totals per month
                yearlyCosts.forEach(cost => {
                    monthlyTotals[cost.month - 1] += Number(cost.calculatedSum);
                });

                // Format data for Recharts
                const bData = monthlyTotals.map((total, index) => ({
                    name: MONTHS[index].substring(0, 3), // Short month name (e.g., Jan)
                    amount: parseFloat(total.toFixed(2))
                }));
                setBarData(bData);

            } catch (error) {
                console.error("Error fetching report data:", error);
            }
        };

        // Re-run this effect when date changes or when a new item is added (refreshTrigger)
        updateGraphData();
    }, [selectedYear, selectedMonth, refreshTrigger]);

    // --- Rendering ---
    return (
        <Box sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
                Reports & Analytics (USD)
            </Typography>

            {/* Selectors Section (Year/Month) */}
            <Paper elevation={1} sx={{ p: 2, mb: 4, backgroundColor: '#f5f5f5' }}>
                <Grid container spacing={2} justifyContent="center" alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                                {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Month</InputLabel>
                            <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                                {MONTHS.map((m, index) => <MenuItem key={index} value={index + 1}>{m}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Layout: Vertical Stack
                direction="column" ensures charts are stacked vertically,
                utilizing the full width of the screen without cramping.
            */}
            <Grid container spacing={6} direction="column" alignItems="stretch">
                
                {/* --- Pie Chart Section --- */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Monthly Expenses Breakdown ({MONTHS[selectedMonth-1]})
                        </Typography>
                        
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={pieData} 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={150} // Radius adjusted to fit labels within container
                                            fill="#8884d8" 
                                            dataKey="value" 
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} USD`} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Typography color="text.secondary">No data for this month</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* --- Bar Chart Section --- */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Annual Overview ({selectedYear})
                        </Typography>
                        
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={barData} 
                                    // Increased bottom margin to prevent X-Axis labels from being cut off
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }} 
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="name" 
                                        interval={0} 
                                        angle={-45} // Rotate labels to fit
                                        textAnchor="end"
                                        tick={{ fontSize: 12 }} 
                                    />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value} USD`} />
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                    <Bar dataKey="amount" name="Total Cost (USD)" fill="#1976d2" barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}