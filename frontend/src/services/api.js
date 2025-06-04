
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : `${window.location.protocol}//${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const stockAPI = {
  // Get all available stocks
  getAllStocks: async () => {
    try {
      const response = await api.get('/stocks');
      return response.data;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      throw error;
    }
  },

  // Get stock data with average
  getStockData: async (ticker, minutes) => {
    try {
      const response = await api.get(`/stocks/${ticker}?minutes=${minutes}&aggregation=average`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stock data for ${ticker}:`, error);
      throw error;
    }
  },

  // Get stock correlation
  getStockCorrelation: async (ticker1, ticker2, minutes) => {
    try {
      const response = await api.get(`/stockcorrelation?minutes=${minutes}&ticker=${ticker1}&ticker=${ticker2}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching correlation for ${ticker1} and ${ticker2}:`, error);
      throw error;
    }
  },

  // Get multiple stock correlations for heatmap
  getMultipleCorrelations: async (tickers, minutes) => {
    try {
      const promises = [];
      for (let i = 0; i < tickers.length; i++) {
        for (let j = i; j < tickers.length; j++) {
          if (i === j) {
            // Self correlation is always 1
            promises.push(Promise.resolve({
              ticker1: tickers[i],
              ticker2: tickers[j],
              correlation: 1
            }));
          } else {
            promises.push(
              api.get(`/stockcorrelation?minutes=${minutes}&ticker=${tickers[i]}&ticker=${tickers[j]}`)
                .then(response => ({
                  ticker1: tickers[i],
                  ticker2: tickers[j],
                  correlation: response.data.correlation
                }))
                .catch(() => ({
                  ticker1: tickers[i],
                  ticker2: tickers[j],
                  correlation: 0
                }))
            );
          }
        }
      }
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple correlations:', error);
      throw error;
    }
  }
};

export default api;
