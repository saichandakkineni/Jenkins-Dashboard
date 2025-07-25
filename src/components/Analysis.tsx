import React, { useState } from 'react';
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
import { HistoricalTrend, FlakyTest, LongestRunningTest, EnvironmentMatrix } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Analysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Fetch Jenkins jobs for analysis
  const {
    isLoading: jobsLoading,
  } = useQuery('jenkins-jobs-analysis', jenkinsService.getJobs);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for demonstration - in real implementation, this would be calculated from actual data
  const historicalTrendData: HistoricalTrend[] = [
    { date: '2024-01-01', totalTests: 150, passedTests: 140, failedTests: 10, successRate: 93.3 },
    { date: '2024-01-02', totalTests: 155, passedTests: 145, failedTests: 10, successRate: 93.5 },
    { date: '2024-01-03', totalTests: 160, passedTests: 150, failedTests: 10, successRate: 93.8 },
    { date: '2024-01-04', totalTests: 165, passedTests: 155, failedTests: 10, successRate: 93.9 },
    { date: '2024-01-05', totalTests: 170, passedTests: 160, failedTests: 10, successRate: 94.1 },
  ];

  const flakyTestsData: FlakyTest[] = [
    { testName: 'UserLoginTest.testValidLogin', jobName: 'UI-Tests', failureRate: 25.5, totalRuns: 20, lastFailure: new Date() },
    { testName: 'PaymentTest.testPaymentFlow', jobName: 'API-Tests', failureRate: 18.2, totalRuns: 15, lastFailure: new Date() },
    { testName: 'SearchTest.testSearchResults', jobName: 'UI-Tests', failureRate: 12.8, totalRuns: 25, lastFailure: new Date() },
  ];

  const longestRunningTestsData: LongestRunningTest[] = [
    { testName: 'FullRegressionTest', jobName: 'Regression-Suite', averageDuration: 1800, maxDuration: 2400, minDuration: 1200 },
    { testName: 'DatabaseMigrationTest', jobName: 'Database-Tests', averageDuration: 900, maxDuration: 1200, minDuration: 600 },
    { testName: 'PerformanceTest', jobName: 'Performance-Suite', averageDuration: 600, maxDuration: 800, minDuration: 400 },
  ];

  const environmentMatrixData: EnvironmentMatrix[] = [
    { environment: 'Production', totalTests: 200, passedTests: 190, failedTests: 10, successRate: 95.0 },
    { environment: 'Staging', totalTests: 180, passedTests: 170, failedTests: 10, successRate: 94.4 },
    { environment: 'Development', totalTests: 160, passedTests: 150, failedTests: 10, successRate: 93.8 },
    { environment: 'QA', totalTests: 140, passedTests: 130, failedTests: 10, successRate: 92.9 },
  ];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (jobsLoading) {
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
          <Tab label="Longest Running Tests" />
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
          </CardContent>
        </Card>
      </TabPanel>

      {/* Longest Running Tests */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Duration Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={longestRunningTestsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="testName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageDuration" fill="#8884d8" name="Average Duration (s)" />
                    <Bar dataKey="maxDuration" fill="#82ca9d" name="Max Duration (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Test Duration Table
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Job Name</TableCell>
                        <TableCell>Average Duration</TableCell>
                        <TableCell>Max Duration</TableCell>
                        <TableCell>Min Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {longestRunningTestsData.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.testName}</TableCell>
                          <TableCell>{test.jobName}</TableCell>
                          <TableCell>{formatDuration(test.averageDuration)}</TableCell>
                          <TableCell>{formatDuration(test.maxDuration)}</TableCell>
                          <TableCell>{formatDuration(test.minDuration)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Environment Matrix */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environment Success Rates
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environment Test Matrix
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Analysis; 