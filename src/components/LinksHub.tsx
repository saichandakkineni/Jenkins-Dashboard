import React, { useState } from 'react';
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
import { JenkinsJob, JenkinsBuild, ClaimedBuild } from '../types';

const LinksHub: React.FC = () => {
  const [selectedBuild, setSelectedBuild] = useState<{ job: JenkinsJob; build: JenkinsBuild } | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimedBy, setClaimedBy] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimedBuilds, setClaimedBuilds] = useState<ClaimedBuild[]>([]);

  // Fetch Jenkins jobs
  const {
    data: jobs = [],
  } = useQuery('jenkins-jobs-links', jenkinsService.getJobs);

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

  const getMavenCommand = (job: JenkinsJob, build: JenkinsBuild) => {
    // This would be extracted from the actual build configuration
    // For now, returning a template command
    return `mvn clean test -Dtest=${job.name} -Dspring.profiles.active=test`;
  };

  const getGitHubInfo = (build: JenkinsBuild) => {
    // This would be extracted from SCM information
    return {
      repo: build.gitRepo || 'https://github.com/company/project',
      branch: build.gitBranch || 'main',
      commit: build.gitCommit || 'abc123def456',
    };
  };

  const recentBuilds = jobs
    .flatMap(job => 
      job.builds?.slice(0, 5).map(build => ({ job, build })) || []
    )
    .sort((a, b) => b.build.timestamp - a.build.timestamp)
    .slice(0, 20);

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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Name</TableCell>
                  <TableCell>Build #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBuilds.map(({ job, build }) => {
                  const isClaimed = isBuildClaimed(job.name, build.number);
                  const claim = isClaimed as ClaimedBuild;

                  return (
                    <TableRow key={`${job.name}-${build.number}`}>
                      <TableCell>{job.name}</TableCell>
                      <TableCell>#{build.number}</TableCell>
                      <TableCell>
                        <Chip
                          label={build.result || 'IN_PROGRESS'}
                          color={
                            build.result === 'SUCCESS' ? 'success' :
                            build.result === 'FAILURE' ? 'error' :
                            build.result === 'UNSTABLE' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{format(new Date(build.timestamp), 'MMM dd, HH:mm')}</TableCell>
                      <TableCell>{Math.round(build.duration / 1000)}s</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Build Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedBuild({ job, build })}
                            >
                              <OpenIcon />
                            </IconButton>
                          </Tooltip>
                          {build.result === 'FAILURE' && !isClaimed && (
                            <Tooltip title="Claim for Investigation">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedBuild({ job, build });
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
              Build Details - {selectedBuild.job.name} #{selectedBuild.build.number}
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
                        href={jenkinsService.getBuildLogUrl(selectedBuild.job.name, selectedBuild.build.number)}
                        target="_blank"
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        View Build Log
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenIcon />}
                        href={jenkinsService.getBuildUrl(selectedBuild.job.name, selectedBuild.build.number)}
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
                        href={jenkinsService.getAllureReportUrl(selectedBuild.job.name, selectedBuild.build.number)}
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
                          jenkinsService.getAllureReportUrl(selectedBuild.job.name, selectedBuild.build.number),
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
                        value={getMavenCommand(selectedBuild.job, selectedBuild.build)}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<CopyIcon />}
                        onClick={() => handleCopyToClipboard(
                          getMavenCommand(selectedBuild.job, selectedBuild.build),
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
                        const gitInfo = getGitHubInfo(selectedBuild.build);
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
            onClick={() => selectedBuild && handleClaimBuild(selectedBuild.job.name, selectedBuild.build.number)}
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