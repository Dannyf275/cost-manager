// src/Reports.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
// ייבוא רכיבי הגרפים
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { idb } from './idb';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2023, 2024, 2025, 2026];
// פלטת צבעים עבור ה-Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

export default function Reports({ refreshTrigger }) {
    // State לבחירת שנה וחודש לתצוגה
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    
    // State להחזקת הנתונים המעובדים עבור הגרפים
    const [pieData, setPieData] = useState([]);
    const [barData, setBarData] = useState([]);

    // useEffect המופעל בכל פעם שמשתנה השנה, החודש, או ה-Trigger שהגיע מהאפליקציה
    useEffect(() => {
        const updateGraphData = async () => {
            try {
                // --- חלק א': הכנת נתונים לגרף עוגה (Pie) ---
                // שליפת הדוח לחודש הספציפי
                const report = await idb.getReport(selectedYear, selectedMonth, "ILS");
                const categoryMap = {};
                
                // סכימת ההוצאות לפי קטגוריות
                report.costs.forEach(cost => {
                    const val = Number(cost.sum);
                    // אם הקטגוריה קיימת מוסיפים לה, אחרת יוצרים חדשה
                    categoryMap[cost.category] = (categoryMap[cost.category] || 0) + val;
                });

                // המרת האובייקט למערך שהגרף יודע לקרוא
                const pData = Object.keys(categoryMap).map(cat => ({
                    name: cat,
                    value: categoryMap[cat]
                }));
                setPieData(pData);

                // --- חלק ב': הכנת נתונים לגרף עמודות (Bar) ---
                // שליפת כל ההוצאות של השנה
                const yearlyCosts = await idb.getCostsByYear(selectedYear);
                // יצירת מערך מאותחל באפסים עבור 12 חודשים
                const monthlyTotals = Array(12).fill(0);
                
                yearlyCosts.forEach(cost => {
                    // cost.month הוא 1-12, המערך הוא 0-11 ולכן מפחיתים 1
                    monthlyTotals[cost.month - 1] += Number(cost.sum);
                });

                // המרת המערך למבנה עבור הגרף (שם חודש + סכום)
                const bData = monthlyTotals.map((total, index) => ({
                    name: MONTHS[index].substring(0, 3), // שלושת האותיות הראשונות של החודש
                    amount: total
                }));
                setBarData(bData);

            } catch (error) {
                console.error("Error fetching report data:", error);
            }
        };

        updateGraphData();
    }, [selectedYear, selectedMonth, refreshTrigger]); // התלויות של ה-Hook

    return (
        <Box sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
                Reports & Analytics
            </Typography>

            {/* אזור הבחירה - שנה וחודש */}
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

            <Grid container spacing={4}>
                {/* גרף עוגה - רוחב מלא */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 500, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Monthly Expenses Breakdown ({MONTHS[selectedMonth-1]})
                        </Typography>
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer>
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
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value.toFixed(2)}`} />
                                        <Legend />
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

                {/* גרף עמודות - רוחב מלא */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, height: 500, display: 'flex', flexDirection: 'column' }}>
                        <Typography align="center" variant="h6" gutterBottom>
                            Annual Overview ({selectedYear})
                        </Typography>
                        <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="amount" name="Total Cost" fill="#1976d2" barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}