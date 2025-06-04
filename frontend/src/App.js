
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import Navigation from './components/Navigation';
import StockPage from './pages/StockPage';
import CorrelationPage from './pages/CorrelationPage';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stock Price Analytics
            </Typography>
          </Toolbar>
        </AppBar>
        <Navigation />
        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          <Routes>
            <Route path="/" element={<StockPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/correlation" element={<CorrelationPage />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
