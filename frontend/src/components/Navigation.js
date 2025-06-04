
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GridOnIcon from '@mui/icons-material/GridOn';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={location.pathname} 
        onChange={handleChange} 
        aria-label="navigation tabs"
        centered
      >
        <Tab 
          label="Stock Analysis" 
          value="/stock" 
          icon={<TrendingUpIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Correlation Heatmap" 
          value="/correlation" 
          icon={<GridOnIcon />}
          iconPosition="start"
        />
      </Tabs>
    </Box>
  );
}

export default Navigation;
