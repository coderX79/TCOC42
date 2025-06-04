
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { stockAPI } from '../services/api';

function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [timeInterval, setTimeInterval] = useState(5);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common stock symbols to display
  const commonStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  useEffect(() => {
    fetchAvailableStocks();
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchStockData();
    }
  }, [selectedStock, timeInterval]);

  const fetchAvailableStocks = async () => {
    try {
      setLoading(true);
      const data = await stockAPI.getAllStocks();
      setStocks(Array.isArray(data) ? data : commonStocks);
      if ((Array.isArray(data) ? data : commonStocks).length > 0) {
        setSelectedStock((Array.isArray(data) ? data : commonStocks)[0]);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setStocks(commonStocks);
      setSelectedStock(commonStocks[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stockAPI.getStockData(selectedStock, timeInterval);
      
      // Format data for chart
      const chartData = data.priceHistory.map((item, index) => ({
        index: index + 1,
        price: item.price,
        timestamp: new Date(item.lastUpdatedAt).toLocaleTimeString(),
        fullTimestamp: item.lastUpdatedAt
      }));

      setStockData({
        ...data,
        chartData
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stock data');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            boxShadow: 2
          }}
        >
          <Typography variant="body2">
            <strong>Price:</strong> ${payload[0].value.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            <strong>Time:</strong> {data.timestamp}
          </Typography>
          <Typography variant="body2">
            <strong>Point:</strong> {label}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Stock Price Analysis
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Stock</InputLabel>
            <Select
              value={selectedStock}
              label="Select Stock"
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {stocks.map((stock) => (
                <MenuItem key={stock} value={stock}>
                  {stock}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Time Interval (minutes)</InputLabel>
            <Select
              value={timeInterval}
              label="Time Interval (minutes)"
              onChange={(e) => setTimeInterval(e.target.value)}
            >
              <MenuItem value={1}>1 minute</MenuItem>
              <MenuItem value={5}>5 minutes</MenuItem>
              <MenuItem value={10}>10 minutes</MenuItem>
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {stockData && !loading && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {selectedStock} - Price Chart (Last {timeInterval} minutes)
                  </Typography>
                  <Tooltip title={`Average price over ${timeInterval} minutes`}>
                    <Chip
                      label={`Avg: $${stockData.averageStockPrice.toFixed(2)}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Tooltip>
                </Box>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={stockData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="index" 
                      label={{ value: 'Data Points', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#1976d2"
                      strokeWidth={2}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
                    />
                    <ReferenceLine
                      y={stockData.averageStockPrice}
                      stroke="#dc004e"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ value: "Average", position: "topRight" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Symbol
                    </Typography>
                    <Typography variant="h6">
                      {selectedStock}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Average Price
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${stockData.averageStockPrice.toFixed(6)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Data Points
                    </Typography>
                    <Typography variant="h6">
                      {stockData.priceHistory.length}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default StockPage;
