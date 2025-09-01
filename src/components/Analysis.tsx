import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

import { jenkinsService } from '../services/jenkinsApi';
import { 
  AllureReportData, 
  DashboardConfig,
  HistoricalTrend, 
  FlakyTest, 
  EnvironmentMatrix 
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface AnalysisProps {
  config: DashboardConfig;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value !== index && <Box sx={{ p: 3 }}>{children}</Box>}
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Analysis: React.FC<AnalysisProps> = ({ config }) => {
  const [tabValue, setTabValue] = useState(0);
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

  // Fetch Allure reports for analysis
  const {
    data: allureReports = [],
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery(
    ['allure-reports-analysis', config.buildConfigs],
    () => jenkinsService.getAllureReportsForBuilds(config.buildConfigs),
    {
      enabled: isInitialized && config.buildConfigs.length > 0,
      refetchInterval: config.refreshInterval,
      retry: config.maxRetries,
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Generate historical trend data from Allure reports
  const generateHistoricalTrendData = (): HistoricalTrend[] => {
    if (!allureReports.length) return [];

    const reportsByDate = allureReports.reduce((acc, report) => {
      if (report.summary) {
        const date = format(report.lastUpdated, 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(report);
      }
      return acc;
    }, {} as Record<string, AllureReportData[]>);

    return Object.entries(reportsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, reports]) => {
        const aggregatedResults = reports.reduce(
          (acc, report) => {
            if (report.summary) {
              acc.total += report.summary.total;
              acc.passed += report.summary.passed;
              acc.failed += report.summary.failed;
            }
            return acc;
          },
          { total: 0, passed: 0, failed: 0 }
        );

        const successRate = aggregatedResults.total > 0 
          ? (aggregatedResults.passed / aggregatedResults.total) * 100 
          : 0;

        return {
          date,
          totalTests: aggregatedResults.total,
          passedTests: aggregatedResults.passed,
          failedTests: aggregatedResults.failed,
          successRate: Math.round(successRate * 100) / 100,
        };
      });
  };

  // Generate flaky tests data from Allure results
  const generateFlakyTestsData = (): FlakyTest[] => {
    if (!allureReports.length) return [];

    const testResults = allureReports.flatMap(report => 
      report.results.map(result => ({
        testName: result.name,
        jobName: report.buildConfig.jobName,
        status: result.status,
        timestamp: report.lastUpdated,
      }))
    );

    // Group by test name and calculate failure rate
    const testStats = testResults.reduce((acc, test) => {
      if (!acc[test.testName]) {
        acc[test.testName] = {
          testName: test.testName,
          jobName: test.jobName,
          totalRuns: 0,
          failures: 0,
          lastFailure: null as Date | null,
        };
      }
      
      acc[test.testName].totalRuns++;
      if (test.status === 'failed' || test.status === 'broken') {
        acc[test.testName].failures++;
        if (!acc[test.testName].lastFailure || test.timestamp > acc[test.testName].lastFailure!) {
          acc[test.testName].lastFailure = test.timestamp;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(testStats)
      .filter(test => test.failures > 0)
      .map(test => ({
        testName: test.testName,
        jobName: test.jobName,
        failureRate: (test.failures / test.totalRuns) * 100,
        totalRuns: test.totalRuns,
        lastFailure: test.lastFailure || new Date(),
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 10); // Top 10 flaky tests
  };

  // Generate environment matrix data
  const generateEnvironmentMatrixData = (): EnvironmentMatrix[] => {
    if (!allureReports.length) return [];

    const reportsByEnvironment = allureReports.reduce((acc, report) => {
      const env = report.buildConfig.environment || 'default';
      if (!acc[env]) {
        acc[env] = [];
      }
      acc[env].push(report);
      return acc;
    }, {} as Record<string, AllureReportData[]>);

    return Object.entries(reportsByEnvironment).map(([environment, reports]) => {
      const aggregatedResults = reports.reduce(
        (acc, report) => {
          if (report.summary) {
            acc.total += report.summary.total;
            acc.passed += report.summary.passed;
            acc.failed += report.summary.failed;
          }
          return acc;
        },
        { total: 0, passed: 0, failed: 0 }
      );

      const successRate = aggregatedResults.total > 0 
        ? (aggregatedResults.passed / aggregatedResults.total) * 100 
        : 0;

      return {
        environment,
        totalTests: aggregatedResults.total,
        passedTests: aggregatedResults.passed,
        failedTests: aggregatedResults.failed,
        successRate: Math.round(successRate * 100) / 100,
      };
    });
  };

  const historicalTrendData = generateHistoricalTrendData();
  const flakyTestsData = generateFlakyTestsData();
  const environmentMatrixData = generateEnvironmentMatrixData();

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
        No build configurations found. Please add build configurations to start analyzing Allure reports.
      </Alert>
    );
  }

  if (reportsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load analysis data. Please check your connection and authentication.
      </Alert>
    );
  }

  if (reportsLoading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading analysis data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Data & Analysis
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analysis tabs">
          <Tab label="Historical Trends" />
          <Tab label="Flakiness Tracker" />
          <Tab label="Environment Matrix" />
        </Tabs>
      </Box>

      {/* Historical Trend Analysis */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Success Rate Over Time
                </Typography>
                {historicalTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={historicalTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="successRate" stroke="#8884d8" name="Success Rate (%)" />
                      <Line type="monotone" dataKey="totalTests" stroke="#82ca9d" name="Total Tests" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No historical data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Flakiness Tracker */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flaky Tests Analysis
            </Typography>
            {flakyTestsData.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Job Name</TableCell>
                      <TableCell>Failure Rate (%)</TableCell>
                      <TableCell>Total Runs</TableCell>
                      <TableCell>Last Failure</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flakyTestsData.map((test, index) => (
                      <TableRow key={index}>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>{test.jobName}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={test.failureRate}
                                color={test.failureRate > 20 ? 'error' : test.failureRate > 10 ? 'warning' : 'success'}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {test.failureRate.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{test.totalRuns}</TableCell>
                        <TableCell>{format(test.lastFailure, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Chip
                            label={test.failureRate > 20 ? 'High' : test.failureRate > 10 ? 'Medium' : 'Low'}
                            color={test.failureRate > 20 ? 'error' : test.failureRate > 10 ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No flaky tests detected
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Environment Matrix */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environment Success Rates
                </Typography>
                {environmentMatrixData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={environmentMatrixData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="environment" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="successRate" fill="#8884d8" name="Success Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No environment data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environment Test Matrix
                </Typography>
                {environmentMatrixData.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Environment</TableCell>
                          <TableCell>Total Tests</TableCell>
                          <TableCell>Passed Tests</TableCell>
                          <TableCell>Failed Tests</TableCell>
                          <TableCell>Success Rate</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {environmentMatrixData.map((env, index) => (
                          <TableRow key={index}>
                            <TableCell>{env.environment}</TableCell>
                            <TableCell>{env.totalTests}</TableCell>
                            <TableCell>{env.passedTests}</TableCell>
                            <TableCell>{env.failedTests}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={env.successRate}
                                    color={env.successRate > 95 ? 'success' : env.successRate > 90 ? 'warning' : 'error'}
                                  />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {env.successRate.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={env.successRate > 95 ? 'Excellent' : env.successRate > 90 ? 'Good' : 'Needs Attention'}
                                color={env.successRate > 95 ? 'success' : env.successRate > 90 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No environment data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Analysis; 