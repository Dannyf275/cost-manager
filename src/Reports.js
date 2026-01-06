// reports.js
// Component for rendering Pie and Bar charts with currency selection.

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { idb } from './idb';

// Constants arrays using array literals.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2023, 2024, 2025, 2026];
const CURRENCIES = ['USD', 'ILS', 'GBP', 'EURO'];

// Currency symbols map.
const CURRENCY_SYMBOLS = {
    'USD': '$',
    'ILS': '₪',
    'GBP': '£',
    'EURO': '€'
};

// Categories and colors.
const CATEGORIES = ['FOOD', 'HEALTH', 'EDUCATION', 'TRAVEL', 'HOUSING', 'OTHER'];
const CATEGORY_COLORS = {
    'FOOD': '#0088FE',
    'HEALTH': '#00C49F',
    'EDUCATION': '#FFBB28',
    'TRAVEL': '#FF8042',
    'HOUSING': '#AF19FF',
    'OTHER': '#FF4560'
};

export default function Reports({ refreshTrigger }) {
    // State hooks.
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    const [pieData, setPieData] = useState([]); 
    const [barData, setBarData] = useState([]); 

    useEffect(() => {
        const updateGraphData = async () => {
            try {
                const TARGET_CURRENCY = selectedCurrency;

                // --- 1. Pie Chart Data Construction ---
                const report = await idb.getReport(selectedYear, selectedMonth, TARGET_CURRENCY);
                const categoryMap = {};
                
                // Aggregate data.
                report.costs.forEach(cost => {
                    const val = Number(cost.calculatedSum); 
                    categoryMap[cost.category] = (categoryMap[cost.category] || 0) + val;
                });

                // Convert map to array.
                const pData = Object.keys(categoryMap).map(cat => ({
                    name: cat,
                    value: parseFloat(categoryMap[cat].toFixed(2))
                }));
                setPieData(pData);

                // --- 2. Bar Chart Data Construction ---
                const yearlyCosts = await idb.getCostsByYear(selectedYear, TARGET_CURRENCY);
                
                // Construct monthly data array using a loop to avoid 'new Array()'.
                const monthlyData = [];
                for (let i = 0; i < 12; i++) {
                    const monthObj = { name: MONTHS[i].substring(0, 3) };
                    // Initialize all categories to 0.
                    CATEGORIES.forEach(cat => { monthObj[cat] = 0; });
                    monthlyData.push(monthObj);
                }

                // Populate monthly data.
                yearlyCosts.forEach(cost => {
                    const monthIndex = cost.month - 1;
                    if (monthlyData[monthIndex]) {
                        monthlyData[monthIndex][cost.category] += Number(cost.calculatedSum);
                    }
                });

                // Round values for display.
                const bData = monthlyData.map(item => {
                    const newItem = { ...item };
                    CATEGORIES.forEach(cat => {
                        newItem[cat] = parseFloat(newItem[cat].toFixed(2));
                    });
                    return newItem;
                });

                setBarData(bData);

            } catch (error) {
                console.error("Error fetching report data:", error);
            }
        };

        updateGraphData();
    }, [selectedYear, selectedMonth, selectedCurrency, refreshTrigger]);

    // Determine current currency symbol.
    const currentSymbol = CURRENCY_SYMBOLS[selectedCurrency];

    return (
        <Box sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
                Reports & Analytics ({selectedCurrency} {currentSymbol})
            </Typography>

            {/* Filter Controls */}
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
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Currency</InputLabel>
                            <Select value={selectedCurrency} label="Currency" onChange={(e) => setSelectedCurrency(e.target.value)}>
                                {CURRENCIES.map(c => (
                                    <MenuItem key={c} value={c}>
                                        {c} ({CURRENCY_SYMBOLS[c]})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Stacked Charts Layout */}
            <Grid container spacing={6} direction="column" alignItems="stretch">
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
                                            outerRadius={150} 
                                            fill="#8884d8" 
                                            dataKey="value" 
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} ${selectedCurrency} (${currentSymbol})`} />
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
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Annual Overview by Category ({selectedYear})
                        </Typography>
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={barData} 
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }} 
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="name" 
                                        interval={0} 
                                        angle={-45}
                                        textAnchor="end"
                                        tick={{ fontSize: 12 }} 
                                    />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [`${value} ${selectedCurrency} (${currentSymbol})`, name]} />
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                    {CATEGORIES.map((cat) => (
                                        <Bar 
                                            key={cat} 
                                            dataKey={cat} 
                                            stackId="a" 
                                            fill={CATEGORY_COLORS[cat]} 
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}