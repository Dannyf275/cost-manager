// cost_table.js
// Component to display cost history and enable deletion.

import React, { useEffect, useState } from 'react';
import { 
    Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Box 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { idb } from './idb';

const CURRENCY_SYMBOLS = {
    'USD': '$',
    'ILS': '₪',
    'GBP': '£',
    'EURO': '€'
};

export default function CostTable({ refreshTrigger, onCostDeleted }) {
    const [costs, setCosts] = useState([]);

    // Fetch costs on load or trigger update.
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await idb.getAllCosts();
                setCosts(data);
            } catch (err) {
                console.error("Error fetching costs", err);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    // Handle delete action.
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await idb.deleteCost(id);
                if (onCostDeleted) onCostDeleted();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    return (
        <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom align="center">
                History & Management
            </Typography>
            <TableContainer component={Paper} elevation={3} sx={{ maxHeight: 400 }}>
                <Table stickyHeader aria-label="costs table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Sum</TableCell>
                            <TableCell>Currency</TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {costs.length > 0 ? (
                            costs.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        {new Date(row.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{row.category}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.sum}</TableCell>
                                    <TableCell>
                                        {row.currency} ({CURRENCY_SYMBOLS[row.currency]})
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton 
                                            aria-label="delete" 
                                            color="error" 
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No costs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}