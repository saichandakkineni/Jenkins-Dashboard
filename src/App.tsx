import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Analysis from './components/Analysis';
import LinksHub from './components/LinksHub';
import Configuration from './components/Configuration';
import { DashboardConfig } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    buildConfigs: [],
    refreshInterval: 30000,
    maxRetries: 3,
  });

  // Load configuration from localStorage on app start
  useEffect(() => {
    const savedBuilds = localStorage.getItem('jenkins-build-configs');
    if (savedBuilds) {
      try {
        const buildConfigs = JSON.parse(savedBuilds);
        setDashboardConfig(prev => ({
          ...prev,
          buildConfigs,
        }));
      } catch (error) {
        console.error('Failed to load saved build configurations:', error);
      }
    }
  }, []);

  const handleConfigUpdate = (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <Routes>
                <Route path="/" element={<Dashboard config={dashboardConfig} />} />
                <Route path="/analysis" element={<Analysis config={dashboardConfig} />} />
                <Route path="/links" element={<LinksHub config={dashboardConfig} />} />
                <Route path="/configuration" element={<Configuration onConfigUpdate={handleConfigUpdate} />} />
              </Routes>
            </Box>
          </Box>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 