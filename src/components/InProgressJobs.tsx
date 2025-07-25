import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

import { JenkinsJob } from '../types';

interface InProgressJobsProps {
  jobs: JenkinsJob[];
  queueInfo: any[];
}

const InProgressJobs: React.FC<InProgressJobsProps> = ({ jobs, queueInfo }) => {
  const getEstimatedTime = (job: JenkinsJob) => {
    if (job.lastBuild?.building && job.lastBuild.estimatedDuration > 0) {
      const elapsed = Date.now() - job.lastBuild.timestamp;
      const remaining = job.lastBuild.estimatedDuration - elapsed;
      return Math.max(0, remaining);
    }
    return null;
  };

  const getQueuePosition = (jobName: string) => {
    const queueItem = queueInfo.find(item => item.task?.name === jobName);
    return queueItem ? queueItem.id : null;
  };

  return (
    <Grid container spacing={2}>
      {jobs.map((job) => {
        const estimatedTime = getEstimatedTime(job);
        const queuePosition = getQueuePosition(job.name);
        const isBuilding = job.lastBuild?.building;
        const isInQueue = job.inQueue && !isBuilding;

        return (
          <Grid item xs={12} md={6} lg={4} key={job.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {isBuilding ? (
                    <PlayIcon color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <ScheduleIcon color="secondary" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="h6" component="div">
                    {job.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={isBuilding ? 'Building' : 'In Queue'}
                    color={isBuilding ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {queuePosition && (
                    <Chip
                      label={`Queue: #${queuePosition}`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                {isBuilding && job.lastBuild && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Build #{job.lastBuild.number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Started: {format(new Date(job.lastBuild.timestamp), 'HH:mm:ss')}
                    </Typography>
                    
                    {estimatedTime !== null && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Estimated remaining:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDistanceToNow(Date.now() + estimatedTime, { addSuffix: false })}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, ((Date.now() - job.lastBuild.timestamp) / job.lastBuild.estimatedDuration) * 100)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {isInQueue && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Waiting in queue...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default InProgressJobs; 