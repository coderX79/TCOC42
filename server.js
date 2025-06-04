
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
}

// Configuration
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/evaluation-service';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE3Njg5LCJpYXQiOjE3NDkwMTczODksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImY4YTVlMDQ2LTVkMzQtNGI0YS1hNzUwLTVlNjVhNWFjNTVmMCIsInN1YiI6ImFkaXR5YXJva2FkZTA3OEBnbWFpbC5jb20ifSwiZW1haWwiOiJhZGl0eWFyb2thZGUwNzhAZ21haWwuY29tIiwibmFtZSI6ImFkaXR5YSByb2thZGUiLCJyb2xsTm8iOiJ0Y29jNDIiLCJhY2Nlc3NDb2RlIjoiS1JqVVVVIiwiY2xpZW50SUQiOiJmOGE1ZTA0Ni01ZDM0LTRiNGEtYTc1MC01ZTY1YTVhYzU1ZjAiLCJjbGllbnRTZWNyZXQiOiJLdG5iYnhhVVpOVGZ1enluIn0.jvMMe5PgUJDlRNZa7d-4IYVAsoR6oEgzICFVKWBfEfo';

// Cache for stock data to minimize API calls
const stockDataCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

// Helper function to make authenticated API calls
async function makeAuthenticatedRequest(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error.message);
    throw new Error(`Failed to fetch data from test server: ${error.message}`);
  }
}

// Helper function to get stock data with caching
async function getStockData(ticker, minutes) {
  const cacheKey = `${ticker}_${minutes}`;
  const cached = stockDataCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const url = `${TEST_SERVER_BASE_URL}/stocks/${ticker}?minutes=${minutes}`;
  const data = await makeAuthenticatedRequest(url);
  
  stockDataCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  
  return data;
}

// Helper function to calculate average
function calculateAverage(prices) {
  if (!prices || prices.length === 0) return 0;
  const sum = prices.reduce((acc, item) => acc + item.price, 0);
  return sum / prices.length;
}

// Helper function to calculate Pearson correlation coefficient
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominatorX = Math.sqrt(n * sumX2 - sumX * sumX);
  const denominatorY = Math.sqrt(n * sumY2 - sumY * sumY);
  
  if (denominatorX === 0 || denominatorY === 0) return 0;
  
  return numerator / (denominatorX * denominatorY);
}

// Helper function to align time series data
function alignTimeSeries(data1, data2) {
  // Sort both arrays by timestamp
  const sorted1 = [...data1].sort((a, b) => new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt));
  const sorted2 = [...data2].sort((a, b) => new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt));
  
  const aligned1 = [];
  const aligned2 = [];
  
  // Simple alignment by finding closest timestamps
  for (let i = 0; i < sorted1.length; i++) {
    const timestamp1 = new Date(sorted1[i].lastUpdatedAt);
    let closestIndex = 0;
    let minDiff = Math.abs(new Date(sorted2[0].lastUpdatedAt) - timestamp1);
    
    for (let j = 1; j < sorted2.length; j++) {
      const diff = Math.abs(new Date(sorted2[j].lastUpdatedAt) - timestamp1);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = j;
      }
    }
    
    // Only include if timestamps are within 5 minutes of each other
    if (minDiff <= 5 * 60 * 1000) {
      aligned1.push(sorted1[i].price);
      aligned2.push(sorted2[closestIndex].price);
    }
  }
  
  return { aligned1, aligned2 };
}

// API Routes

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stock Price Aggregation Microservice',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Get all available stocks
app.get('/stocks', async (req, res) => {
  try {
    const url = `${TEST_SERVER_BASE_URL}/stocks`;
    const data = await makeAuthenticatedRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch stocks',
      message: error.message 
    });
  }
});

// Average Stock Price API
app.get('/stocks/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { minutes, aggregation } = req.query;
    
    if (!minutes) {
      return res.status(400).json({ 
        error: 'Missing required parameter: minutes' 
      });
    }
    
    if (aggregation && aggregation !== 'average') {
      return res.status(400).json({ 
        error: 'Only aggregation=average is supported' 
      });
    }
    
    const stockData = await getStockData(ticker, minutes);
    
    if (!stockData || stockData.length === 0) {
      return res.status(404).json({ 
        error: 'No data found for the specified ticker and time range' 
      });
    }
    
    const averageStockPrice = calculateAverage(stockData);
    
    const response = {
      averageStockPrice: parseFloat(averageStockPrice.toFixed(6)),
      priceHistory: stockData.map(item => ({
        price: item.price,
        lastUpdatedAt: item.lastUpdatedAt
      }))
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message 
    });
  }
});

// Stock Correlation API
app.get('/stockcorrelation', async (req, res) => {
  try {
    const { minutes, ticker } = req.query;
    
    if (!minutes) {
      return res.status(400).json({ 
        error: 'Missing required parameter: minutes' 
      });
    }
    
    // Handle multiple ticker parameters
    const tickers = Array.isArray(ticker) ? ticker : [ticker];
    
    if (!tickers || tickers.length !== 2) {
      return res.status(400).json({ 
        error: 'Exactly two ticker parameters are required' 
      });
    }
    
    const [ticker1, ticker2] = tickers;
    
    // Fetch data for both stocks
    const [stockData1, stockData2] = await Promise.all([
      getStockData(ticker1, minutes),
      getStockData(ticker2, minutes)
    ]);
    
    if (!stockData1 || stockData1.length === 0 || !stockData2 || stockData2.length === 0) {
      return res.status(404).json({ 
        error: 'Insufficient data for correlation calculation' 
      });
    }
    
    // Align time series data
    const { aligned1, aligned2 } = alignTimeSeries(stockData1, stockData2);
    
    if (aligned1.length < 2) {
      return res.status(400).json({ 
        error: 'Insufficient aligned data points for correlation calculation' 
      });
    }
    
    // Calculate correlation
    const correlation = calculateCorrelation(aligned1, aligned2);
    
    const response = {
      correlation: parseFloat(correlation.toFixed(4)),
      stocks: {}
    };
    
    response.stocks[ticker1] = {
      averagePrice: parseFloat(calculateAverage(stockData1).toFixed(6)),
      priceHistory: stockData1.map(item => ({
        price: item.price,
        lastUpdatedAt: item.lastUpdatedAt
      }))
    };
    
    response.stocks[ticker2] = {
      averagePrice: parseFloat(calculateAverage(stockData2).toFixed(6)),
      priceHistory: stockData2.map(item => ({
        price: item.price,
        lastUpdatedAt: item.lastUpdatedAt
      }))
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to calculate correlation',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Serve React app for non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found' 
    });
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stock Price Aggregation Microservice running on http://0.0.0.0:${PORT}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});

module.exports = app;
