import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { format } from 'date-fns';

import { jenkinsService } from '../services/jenkinsApi';
import { JenkinsJob, DashboardFilters } from '../types';
import InProgressJobs from './InProgressJobs';
import FilterPanel from './FilterPanel';

const COLORS = ['#4caf50', '#f44336', '#ff9800', '#9e9e9e'];

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Jenkins jobs
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery('jenkins-jobs', jenkinsService.getJobs, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch queue information for in-progress jobs
  const {
    data: queueInfo = [],
    isLoading: queueLoading,
  } = useQuery('jenkins-queue', jenkinsService.getQueueInfo, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter jobs based on criteria
  const filteredJobs = jobs.filter((job) => {
    if (filters.jobName && !job.name.toLowerCase().includes(filters.jobName.toLowerCase())) {
      return false;
    }
    if (filters.status && job.lastBuild?.result !== filters.status) {
      return false;
    }
    return true;
  });

  // Group jobs by date for pie charts
  const jobsByDate = filteredJobs.reduce((acc, job) => {
    if (job.lastCompletedBuild) {
      const date = format(new Date(job.lastCompletedBuild.timestamp), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(job);
    }
    return acc;
  }, {} as Record<string, JenkinsJob[]>);

  // Get in-progress jobs
  const inProgressJobs = jobs.filter((job) => job.lastBuild?.building || job.inQueue);

  const handleRefresh = () => {
    refetchJobs();
  };

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  if (jobsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load Jenkins jobs. Please check your connection and try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Automation Dashboard
        </Typography>
        <Box>
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={jobsLoading}>
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
      {jobsLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading Jenkins jobs...
          </Typography>
        </Box>
      )}

      {/* In-Progress Jobs */}
      {inProgressJobs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1 }} />
            In-Progress Jobs ({inProgressJobs.length})
          </Typography>
          <InProgressJobs jobs={inProgressJobs} queueInfo={queueInfo} />
        </Box>
      )}

      {/* Allure Reports Pie Charts */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TrendingUpIcon sx={{ mr: 1 }} />
        Allure Reports by Date
      </Typography>

      <Grid container spacing={3}>
        {Object.entries(jobsByDate)
          .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
          .map(([date, dateJobs]) => {
            // Calculate test results for this date
            const testResults = dateJobs.reduce(
              (acc, job) => {
                // This would be populated with actual Allure data
                // For now, we'll use mock data based on build status
                if (job.lastCompletedBuild?.result === 'SUCCESS') {
                  acc.passed += 1;
                } else if (job.lastCompletedBuild?.result === 'FAILURE') {
                  acc.failed += 1;
                } else if (job.lastCompletedBuild?.result === 'UNSTABLE') {
                  acc.broken += 1;
                } else {
                  acc.skipped += 1;
                }
                return acc;
              },
              { passed: 0, failed: 0, broken: 0, skipped: 0 }
            );

            const chartData = [
              { name: 'Passed', value: testResults.passed },
              { name: 'Failed', value: testResults.failed },
              { name: 'Broken', value: testResults.broken },
              { name: 'Skipped', value: testResults.skipped },
            ].filter((item) => item.value > 0);

            return (
              <Grid item xs={12} md={6} lg={4} key={date}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {format(new Date(date), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {dateJobs.length} jobs completed
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

                    {/* Job Names */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Jobs:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {dateJobs.map((job) => (
                          <Chip
                            key={job.name}
                            label={job.name}
                            size="small"
                            variant="outlined"
                            color={job.lastCompletedBuild?.result === 'SUCCESS' ? 'success' : 'error'}
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

      {/* No Data Message */}
      {Object.keys(jobsByDate).length === 0 && !jobsLoading && (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No completed jobs found for the selected filters
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard; 