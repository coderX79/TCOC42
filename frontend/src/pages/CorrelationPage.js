
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
  Tooltip,
  Paper
} from '@mui/material';
import { stockAPI } from '../services/api';

function CorrelationPage() {
  const [timeInterval, setTimeInterval] = useState(5);
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Common stock symbols for correlation analysis
  const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];

  useEffect(() => {
    fetchCorrelationData();
  }, [timeInterval]);

  const fetchCorrelationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const correlations = await stockAPI.getMultipleCorrelations(stocks, timeInterval);
      
      // Create correlation matrix
      const matrix = [];
      for (let i = 0; i < stocks.length; i++) {
        const row = [];
        for (let j = 0; j < stocks.length; j++) {
          if (i === j) {
            row.push(1);
          } else {
            const correlation = correlations.find(
              c => (c.ticker1 === stocks[i] && c.ticker2 === stocks[j]) ||
                   (c.ticker1 === stocks[j] && c.ticker2 === stocks[i])
            );
            row.push(correlation ? correlation.correlation : 0);
          }
        }
        matrix.push(row);
      }
      
      setCorrelationData(matrix);
    } catch (err) {
      setError(err.message || 'Failed to fetch correlation data');
      setCorrelationData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColorForCorrelation = (correlation) => {
    // Color scale from strong negative (red) to strong positive (green)
    const intensity = Math.abs(correlation);
    const opacity = intensity * 0.8 + 0.2;
    
    if (correlation > 0) {
      return `rgba(76, 175, 80, ${opacity})`; // Green for positive
    } else if (correlation < 0) {
      return `rgba(244, 67, 54, ${opacity})`; // Red for negative
    } else {
      return `rgba(158, 158, 158, ${opacity})`; // Gray for neutral
    }
  };

  const CorrelationCell = ({ value, row, col }) => {
    const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
    
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2">
              {stocks[row]} vs {stocks[col]}
            </Typography>
            <Typography variant="body2">
              Correlation: {value.toFixed(4)}
            </Typography>
            <Typography variant="body2">
              Strength: {Math.abs(value) > 0.7 ? 'Strong' : Math.abs(value) > 0.3 ? 'Moderate' : 'Weak'}
            </Typography>
          </Box>
        }
        arrow
      >
        <Box
          sx={{
            width: { xs: 40, sm: 60 },
            height: { xs: 40, sm: 60 },
            backgroundColor: getColorForCorrelation(value),
            border: isHovered ? '2px solid #1976d2' : '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              zIndex: 1,
            }
          }}
          onMouseEnter={() => setHoveredCell({ row, col })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '0.6rem', sm: '0.75rem' },
              color: Math.abs(value) > 0.5 ? 'white' : 'black'
            }}
          >
            {value.toFixed(2)}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  const ColorLegend = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Correlation Strength Legend
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(244, 67, 54, 0.8)',
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant="body2">Strong Negative (-1.0 to -0.7)</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(244, 67, 54, 0.4)',
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant="body2">Moderate Negative (-0.7 to -0.3)</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(158, 158, 158, 0.4)',
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant="body2">Weak (-0.3 to 0.3)</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(76, 175, 80, 0.4)',
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant="body2">Moderate Positive (0.3 to 0.7)</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(76, 175, 80, 0.8)',
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant="body2">Strong Positive (0.7 to 1.0)</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Stock Correlation Heatmap
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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

      {correlationData.length > 0 && !loading && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Correlation Matrix (Last {timeInterval} minutes)
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <Paper elevation={1} sx={{ p: 2, display: 'inline-block', minWidth: 'fit-content' }}>
                {/* Header row */}
                <Box display="flex" mb={1}>
                  <Box sx={{ width: { xs: 40, sm: 60 }, height: { xs: 40, sm: 60 } }} />
                  {stocks.map((stock) => (
                    <Box
                      key={stock}
                      sx={{
                        width: { xs: 40, sm: 60 },
                        height: { xs: 40, sm: 60 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        fontWeight: 'bold'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                        {stock}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Data rows */}
                {correlationData.map((row, rowIndex) => (
                  <Box key={rowIndex} display="flex" mb={0.5}>
                    {/* Row header */}
                    <Box
                      sx={{
                        width: { xs: 40, sm: 60 },
                        height: { xs: 40, sm: 60 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        fontWeight: 'bold'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                        {stocks[rowIndex]}
                      </Typography>
                    </Box>
                    
                    {/* Data cells */}
                    {row.map((value, colIndex) => (
                      <CorrelationCell
                        key={colIndex}
                        value={value}
                        row={rowIndex}
                        col={colIndex}
                      />
                    ))}
                  </Box>
                ))}
              </Paper>
            </Box>
          </CardContent>
        </Card>
      )}

      <ColorLegend />
    </Box>
  );
}

export default CorrelationPage;
