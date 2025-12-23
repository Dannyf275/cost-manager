// src/Reports.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { idb } from './idb';

// קבועים לחודשים וצבעים
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2023, 2024, 2025, 2026];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

export default function Reports({ refreshTrigger }) {
    // --- State Variables ---
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [pieData, setPieData] = useState([]); // נתונים לגרף עוגה
    const [barData, setBarData] = useState([]); // נתונים לגרף עמודות

    // --- Data Fetching Logic ---
    useEffect(() => {
        const updateGraphData = async () => {
            try {
                // המטבע שאליו ננרמל את כל התצוגה (אפשר לשנות ל-"USD" אם רוצים)
                const TARGET_CURRENCY = "ILS"; 

                // --- 1. הכנת נתונים לגרף עוגה (Pie) ---
                const report = await idb.getReport(selectedYear, selectedMonth, TARGET_CURRENCY);
                const categoryMap = {};
                
                report.costs.forEach(cost => {
                    // תיקון חשוב: אנו משתמשים ב-calculatedSum המומר, ולא בסכום המקורי
                    const val = Number(cost.calculatedSum); 
                    categoryMap[cost.category] = (categoryMap[cost.category] || 0) + val;
                });

                // המרה למבנה ש-Recharts מבין
                const pData = Object.keys(categoryMap).map(cat => ({
                    name: cat,
                    value: parseFloat(categoryMap[cat].toFixed(2))
                }));
                setPieData(pData);

                // --- 2. הכנת נתונים לגרף עמודות (Bar) ---
                const yearlyCosts = await idb.getCostsByYear(selectedYear, TARGET_CURRENCY);
                const monthlyTotals = Array(12).fill(0);
                
                yearlyCosts.forEach(cost => {
                    // סכימת הערכים המומרים לכל חודש
                    monthlyTotals[cost.month - 1] += Number(cost.calculatedSum);
                });

                const bData = monthlyTotals.map((total, index) => ({
                    name: MONTHS[index].substring(0, 3), // קיצור שם החודש (Jan, Feb)
                    amount: parseFloat(total.toFixed(2))
                }));
                setBarData(bData);

            } catch (error) {
                console.error("Error fetching report data:", error);
            }
        };

        updateGraphData();
    }, [selectedYear, selectedMonth, refreshTrigger]);

    // --- Rendering (התצוגה) ---
    return (
        <Box sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
                Reports & Analytics (ILS)
            </Typography>

            {/* אזור הבחירה (Select) - שנה וחודש */}
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

            {/* התיקון הגדול לגרפים:
               Grid container עם direction="column".
               זה מכריח את הגרפים להסתדר אחד מתחת לשני, ולתפוס את כל הרוחב הזמין.
               כך הם לא נדחסים ולא נחתכים.
            */}
            <Grid container spacing={6} direction="column" alignItems="stretch">
                
                {/* --- גרף 1: עוגה (Pie Chart) --- */}
                <Grid item xs={12}>
                    {/* גובה 600px נותן לגרף הרבה מקום */}
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
                                            // החזרנו לרדיוס 150 כדי שהטקסטים בצדדים לא יחרגו מהמסגרת
                                            outerRadius={150} 
                                            fill="#8884d8" 
                                            dataKey="value" 
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} ILS`} />
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

                {/* --- גרף 2: עמודות (Bar Chart) --- */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Annual Overview ({selectedYear})
                        </Typography>
                        
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={barData} 
                                    // שוליים תחתונים גדולים (bottom: 60) כדי למנוע חיתוך של שמות החודשים
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }} 
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {/* ציר ה-X עם טקסט אלכסוני ופונט קטן כדי למנוע חפיפה */}
                                    <XAxis 
                                        dataKey="name" 
                                        interval={0} 
                                        angle={-45}  
                                        textAnchor="end"
                                        tick={{ fontSize: 12 }} 
                                    />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value} ILS`} />
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                    <Bar dataKey="amount" name="Total Cost (ILS)" fill="#1976d2" barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}