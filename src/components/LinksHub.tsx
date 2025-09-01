import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Link,
  Alert,
} from '@mui/material';
import {
  OpenInNew as OpenIcon,
  ContentCopy as CopyIcon,
  BugReport as BugIcon,
  Person as PersonIcon,
  GitHub as GitHubIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { jenkinsService } from '../services/jenkinsApi';
import { 
  AllureReportData, 
  JenkinsBuildConfig, 
  DashboardConfig,
  ClaimedBuild 
} from '../types';

interface LinksHubProps {
  config: DashboardConfig;
}

const LinksHub: React.FC<LinksHubProps> = ({ config }) => {
  const [selectedBuild, setSelectedBuild] = useState<{ buildConfig: JenkinsBuildConfig; reportData: AllureReportData } | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimedBy, setClaimedBy] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimedBuilds, setClaimedBuilds] = useState<ClaimedBuild[]>([]);
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
  } = useQuery(
    ['allure-reports-links', config.buildConfigs],
    () => jenkinsService.getAllureReportsForBuilds(config.buildConfigs),
    {
      enabled: isInitialized && config.buildConfigs.length > 0,
      refetchInterval: config.refreshInterval,
      retry: config.maxRetries,
    }
  );

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleClaimBuild = (jobName: string, buildNumber: number) => {
    if (!claimedBy.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const newClaim: ClaimedBuild = {
      buildNumber,
      jobName,
      claimedBy: claimedBy.trim(),
      claimedAt: new Date(),
      notes: claimNotes.trim() || undefined,
    };

    setClaimedBuilds([...claimedBuilds, newClaim]);
    setClaimDialogOpen(false);
    setClaimedBy('');
    setClaimNotes('');
    toast.success(`Build #${buildNumber} claimed by ${claimedBy}`);
  };

  const isBuildClaimed = (jobName: string, buildNumber: number) => {
    return claimedBuilds.find(claim => claim.jobName === jobName && claim.buildNumber === buildNumber);
  };

  const getMavenCommand = (buildConfig: JenkinsBuildConfig) => {
    // This would be extracted from the actual build configuration
    // For now, returning a template command
    return `mvn clean test -Dtest=${buildConfig.jobName} -Dspring.profiles.active=test`;
  };

  const getGitHubInfo = (buildConfig: JenkinsBuildConfig) => {
    // This would be extracted from SCM information
    return {
      repo: 'https://github.com/company/project',
      branch: 'main',
      commit: 'abc123def456',
    };
  };

  // Create a list of recent builds from the configured build configurations
  const recentBuilds = allureReports
    .map(report => ({
      buildConfig: report.buildConfig,
      reportData: report,
      lastUpdated: report.lastUpdated,
      status: report.status,
    }))
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
    .slice(0, 20);

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
        No build configurations found. Please add build configurations to start viewing build information.
      </Alert>
    );
  }

  if (reportsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load build information. Please check your connection and authentication.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Links Hub
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Quick access to build logs, reports, and development resources
      </Typography>

      {/* Recent Builds Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Builds
          </Typography>
          {reportsLoading ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              Loading build information...
            </Typography>
          ) : recentBuilds.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No builds found
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Build Name</TableCell>
                    <TableCell>Job Name</TableCell>
                    <TableCell>Build #</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentBuilds.map(({ buildConfig, reportData, status }) => {
                    const isClaimed = isBuildClaimed(buildConfig.jobName, buildConfig.buildNumber);
                    const claim = isClaimed as ClaimedBuild;

                    return (
                      <TableRow key={`${buildConfig.jobName}-${buildConfig.buildNumber}`}>
                        <TableCell>{buildConfig.name}</TableCell>
                        <TableCell>{buildConfig.jobName}</TableCell>
                        <TableCell>#{buildConfig.buildNumber}</TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            color={
                              status === 'success' ? 'success' :
                              status === 'error' ? 'error' :
                              status === 'loading' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{format(reportData.lastUpdated, 'MMM dd, HH:mm')}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Build Details">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedBuild({ buildConfig, reportData })}
                              >
                                <OpenIcon />
                              </IconButton>
                            </Tooltip>
                            {status === 'error' && !isClaimed && (
                              <Tooltip title="Claim for Investigation">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedBuild({ buildConfig, reportData });
                                    setClaimDialogOpen(true);
                                  }}
                                >
                                  <BugIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {isClaimed && (
                              <Tooltip title={`Claimed by ${claim.claimedBy}`}>
                                <Chip
                                  icon={<PersonIcon />}
                                  label={claim.claimedBy}
                                  size="small"
                                  color="info"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Build Details Dialog */}
      <Dialog
        open={!!selectedBuild}
        onClose={() => setSelectedBuild(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedBuild && (
          <>
            <DialogTitle>
              Build Details - {selectedBuild.buildConfig.name} #{selectedBuild.buildConfig.buildNumber}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Jenkins Build Log */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <BuildIcon sx={{ mr: 1 }} />
                        Jenkins Build Log
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<OpenIcon />}
                        href={jenkinsService.getBuildConsoleUrl(selectedBuild.buildConfig.buildUrl)}
                        target="_blank"
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        View Build Log
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenIcon />}
                        href={selectedBuild.buildConfig.buildUrl}
                        target="_blank"
                        fullWidth
                      >
                        View Build Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Allure Report */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon sx={{ mr: 1 }} />
                        Allure Report
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<OpenIcon />}
                        href={jenkinsService.getAllureReportUrl(selectedBuild.buildConfig.buildUrl)}
                        target="_blank"
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        View Allure Report
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CopyIcon />}
                        onClick={() => handleCopyToClipboard(
                          jenkinsService.getAllureReportUrl(selectedBuild.buildConfig.buildUrl),
                          'Allure Report URL'
                        )}
                        fullWidth
                      >
                        Copy Report URL
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Maven Command */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CodeIcon sx={{ mr: 1 }} />
                        Maven Command
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={getMavenCommand(selectedBuild.buildConfig)}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<CopyIcon />}
                        onClick={() => handleCopyToClipboard(
                          getMavenCommand(selectedBuild.buildConfig),
                          'Maven Command'
                        )}
                        fullWidth
                      >
                        Copy Command
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* GitHub Information */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <GitHubIcon sx={{ mr: 1 }} />
                        GitHub Information
                      </Typography>
                      {(() => {
                        const gitInfo = getGitHubInfo(selectedBuild.buildConfig);
                        return (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>Repository:</strong>
                            </Typography>
                            <Link href={gitInfo.repo} target="_blank" sx={{ display: 'block', mb: 1 }}>
                              {gitInfo.repo}
                            </Link>
                            <Typography variant="body2" gutterBottom>
                              <strong>Branch:</strong> {gitInfo.branch}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Commit:</strong> {gitInfo.commit}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedBuild(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Claim Build Dialog */}
      <Dialog open={claimDialogOpen} onClose={() => setClaimDialogOpen(false)}>
        <DialogTitle>Claim Failed Build for Investigation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your Name"
            fullWidth
            variant="outlined"
            value={claimedBy}
            onChange={(e) => setClaimedBy(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={claimNotes}
            onChange={(e) => setClaimNotes(e.target.value)}
            placeholder="Add any notes about the investigation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedBuild && handleClaimBuild(selectedBuild.buildConfig.jobName, selectedBuild.buildConfig.buildNumber)}
            variant="contained"
            color="primary"
          >
            Claim Build
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinksHub; 