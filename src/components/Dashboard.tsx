import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  OpenInNew as OpenInNewIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { format } from 'date-fns';

import { jenkinsService } from '../services/jenkinsApi';
import { 
  AllureReportData, 
  DashboardConfig,
  DashboardFilters 
} from '../types';
import FilterPanel from './FilterPanel';

const COLORS = ['#4caf50', '#f44336', '#ff9800', '#9e9e9e'];

interface DashboardProps {
  config: DashboardConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ config }) => {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Jenkins service if we have build configurations
  useEffect(() => {
    if (config.buildConfigs.length > 0 && !isInitialized) {
      // Try to get saved auth config from localStorage
      const savedAuth = localStorage.getItem('jenkins-auth-config');
      if (savedAuth) {
        try {
          const authConfig = JSON.parse(savedAuth);
          jenkinsService.initialize(authConfig);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize Jenkins service:', error);
        }
      }
    }
  }, [config.buildConfigs, isInitialized]);

  // Fetch Allure reports for configured builds
  const {
    data: allureReports = [],
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useQuery(
    ['allure-reports', config.buildConfigs],
    () => jenkinsService.getAllureReportsForBuilds(config.buildConfigs),
    {
      enabled: isInitialized && config.buildConfigs.length > 0,
      refetchInterval: config.refreshInterval,
      retry: config.maxRetries,
    }
  );

  // Filter reports based on criteria
  const filteredReports = allureReports.filter((report) => {
    if (filters.jobName && !report.buildConfig.jobName.toLowerCase().includes(filters.jobName.toLowerCase())) {
      return false;
    }
    if (filters.status && report.status !== filters.status) {
      return false;
    }
    if (filters.environment && report.buildConfig.environment !== filters.environment) {
      return false;
    }
    return true;
  });

  // Group reports by date for pie charts
  const reportsByDate = filteredReports.reduce((acc, report) => {
    if (report.summary) {
      const date = format(report.lastUpdated, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(report);
    }
    return acc;
  }, {} as Record<string, AllureReportData[]>);

  // Get reports with errors
  const errorReports = allureReports.filter((report) => report.status === 'error');

  const handleRefresh = () => {
    refetchReports();
  };

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  const handleOpenReport = (reportUrl: string) => {
    window.open(reportUrl, '_blank');
  };

  if (!isInitialized) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Please configure your Jenkins authentication and build URLs in the Configuration section.
      </Alert>
    );
  }

  if (config.buildConfigs.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No build configurations found. Please add build configurations to start fetching Allure reports.
      </Alert>
    );
  }

  if (reportsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load Allure reports. Please check your connection and authentication.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Allure Reports Dashboard
        </Typography>
        <Box>
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={reportsLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      )}

      {/* Loading Indicator */}
      {reportsLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading Allure reports...
          </Typography>
        </Box>
      )}

      {/* Error Reports */}
      {errorReports.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ErrorIcon sx={{ mr: 1 }} />
            Reports with Errors ({errorReports.length})
          </Typography>
          <Grid container spacing={2}>
            {errorReports.map((report, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ border: '1px solid #f44336' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error">
                      {report.buildConfig.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {report.buildConfig.jobName} - Build #{report.buildConfig.buildNumber}
                    </Typography>
                    <Typography variant="body2" color="error" gutterBottom>
                      Error: {report.errorMessage}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenReport(report.buildConfig.buildUrl)}
                      startIcon={<OpenInNewIcon />}
                    >
                      View Build
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Allure Reports Summary Cards */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TrendingUpIcon sx={{ mr: 1 }} />
        Test Results Summary
      </Typography>

      <Grid container spacing={3}>
        {filteredReports.map((report, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {report.buildConfig.name}
                  </Typography>
                  <Chip
                    label={report.status}
                    color={report.status === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {report.buildConfig.jobName} - Build #{report.buildConfig.buildNumber}
                </Typography>
                
                {report.buildConfig.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {report.buildConfig.description}
                  </Typography>
                )}

                {report.summary ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Test Results:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={`Passed: ${report.summary.passed}`} color="success" size="small" />
                      <Chip label={`Failed: ${report.summary.failed}`} color="error" size="small" />
                      <Chip label={`Broken: ${report.summary.broken}`} color="warning" size="small" />
                      <Chip label={`Skipped: ${report.summary.skipped}`} color="default" size="small" />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Total: {report.summary.total} | Duration: {Math.round(report.summary.duration / 1000)}s
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No test data available
                  </Typography>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Environment & Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      label={report.buildConfig.environment}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    {report.buildConfig.tags?.map((tag, tagIndex) => (
                      <Chip
                        key={tagIndex}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleOpenReport(report.reportUrl)}
                    startIcon={<OpenInNewIcon />}
                    fullWidth
                  >
                    View Allure Report
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Last updated: {format(report.lastUpdated, 'MMM dd, yyyy HH:mm')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Test Results by Date Charts */}
      {Object.keys(reportsByDate).length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 4, display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            Test Results by Date
          </Typography>

          <Grid container spacing={3}>
            {Object.entries(reportsByDate)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
              .map(([date, dateReports]) => {
                // Calculate aggregated test results for this date
                const aggregatedResults = dateReports.reduce(
                  (acc, report) => {
                    if (report.summary) {
                      acc.total += report.summary.total;
                      acc.passed += report.summary.passed;
                      acc.failed += report.summary.failed;
                      acc.broken += report.summary.broken;
                      acc.skipped += report.summary.skipped;
                    }
                    return acc;
                  },
                  { total: 0, passed: 0, failed: 0, broken: 0, skipped: 0 }
                );

                const chartData = [
                  { name: 'Passed', value: aggregatedResults.passed },
                  { name: 'Failed', value: aggregatedResults.failed },
                  { name: 'Broken', value: aggregatedResults.broken },
                  { name: 'Skipped', value: aggregatedResults.skipped },
                ].filter((item) => item.value > 0);

                return (
                  <Grid item xs={12} md={6} lg={4} key={date}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {format(new Date(date), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {dateReports.length} builds processed
                        </Typography>
                        
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              No test data available
                            </Typography>
                          </Box>
                        )}

                        {/* Build Names */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Builds:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {dateReports.map((report) => (
                              <Chip
                                key={report.buildConfig.name}
                                label={report.buildConfig.name}
                                size="small"
                                variant="outlined"
                                color={report.status === 'success' ? 'success' : 'error'}
                              />
                            ))}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </>
      )}

      {/* No Data Message */}
      {filteredReports.length === 0 && !reportsLoading && (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No reports found for the selected filters
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard; 