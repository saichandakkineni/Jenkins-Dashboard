import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { jenkinsService } from '../services/jenkinsApi';
import { AuthenticationConfig, JenkinsBuildConfig, DashboardConfig } from '../types';

interface ConfigurationProps {
  onConfigUpdate: (config: DashboardConfig) => void;
}

const Configuration: React.FC<ConfigurationProps> = ({ onConfigUpdate }) => {
  const [authConfig, setAuthConfig] = useState<AuthenticationConfig>({
    jsessionId: '',
    jenkinsBaseUrl: 'http://cmob-jenkins.td.com:8080',
  });

  const [buildConfigs, setBuildConfigs] = useState<JenkinsBuildConfig[]>([]);
  const [newBuildConfig, setNewBuildConfig] = useState<Partial<JenkinsBuildConfig>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  // Load configuration from localStorage on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('jenkins-auth-config');
    const savedBuilds = localStorage.getItem('jenkins-build-configs');
    
    if (savedAuth) {
      setAuthConfig(JSON.parse(savedAuth));
    }
    
    if (savedBuilds) {
      setBuildConfigs(JSON.parse(savedBuilds));
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jenkins-auth-config', JSON.stringify(authConfig));
    localStorage.setItem('jenkins-build-configs', JSON.stringify(buildConfigs));
    
    // Update the dashboard configuration
    const dashboardConfig: DashboardConfig = {
      buildConfigs,
      refreshInterval: 30000,
      maxRetries: 3,
    };
    onConfigUpdate(dashboardConfig);
  }, [authConfig, buildConfigs, onConfigUpdate]);

  const handleAuthChange = (field: keyof AuthenticationConfig, value: string) => {
    setAuthConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    if (!authConfig.jsessionId || !authConfig.jenkinsBaseUrl) {
      setTestResult('error');
      setTestMessage('Please provide both JSESSION ID and Jenkins base URL');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      // Initialize the service with the new configuration
      jenkinsService.initialize(authConfig);
      
      // Test the authentication
      const isAuthenticated = await jenkinsService.testAuthentication();
      
      if (isAuthenticated) {
        setTestResult('success');
        setTestMessage('Authentication successful! You can now add build configurations.');
      } else {
        setTestResult('error');
        setTestMessage('Authentication failed. Please check your JSESSION ID and Jenkins URL.');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddBuildConfig = () => {
    if (!newBuildConfig.name || !newBuildConfig.buildUrl) {
      return;
    }

    // Parse the build URL to extract job name and build number
    try {
      const url = new URL(newBuildConfig.buildUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const jobIndex = pathParts.indexOf('job');
      
      if (jobIndex !== -1 && jobIndex + 2 < pathParts.length) {
        const jobName = pathParts[jobIndex + 1];
        const buildNumber = parseInt(pathParts[jobIndex + 2]);
        
        if (!isNaN(buildNumber)) {
          const config: JenkinsBuildConfig = {
            name: newBuildConfig.name,
            buildUrl: newBuildConfig.buildUrl,
            jobName,
            buildNumber,
            description: newBuildConfig.description || '',
            environment: newBuildConfig.environment || 'default',
            tags: newBuildConfig.tags || [],
          };
          
          setBuildConfigs(prev => [...prev, config]);
          setNewBuildConfig({});
          setIsAddDialogOpen(false);
        } else {
          alert('Invalid build URL format. Could not extract build number.');
        }
      } else {
        alert('Invalid build URL format. Expected pattern: /job/{jobName}/{buildNumber}/');
      }
    } catch (error) {
      alert('Invalid URL format. Please provide a valid Jenkins build URL.');
    }
  };

  const handleEditBuildConfig = (index: number) => {
    setEditingIndex(index);
    setNewBuildConfig(buildConfigs[index]);
    setIsAddDialogOpen(true);
  };

  const handleUpdateBuildConfig = () => {
    if (editingIndex === null || !newBuildConfig.name || !newBuildConfig.buildUrl) {
      return;
    }

    try {
      const url = new URL(newBuildConfig.buildUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const jobIndex = pathParts.indexOf('job');
      
      if (jobIndex !== -1 && jobIndex + 2 < pathParts.length) {
        const jobName = pathParts[jobIndex + 1];
        const buildNumber = parseInt(pathParts[jobIndex + 2]);
        
        if (!isNaN(buildNumber)) {
          const updatedConfig: JenkinsBuildConfig = {
            name: newBuildConfig.name,
            buildUrl: newBuildConfig.buildUrl,
            jobName,
            buildNumber,
            description: newBuildConfig.description || '',
            environment: newBuildConfig.environment || 'default',
            tags: newBuildConfig.tags || [],
          };
          
          setBuildConfigs(prev => prev.map((config, i) => 
            i === editingIndex ? updatedConfig : config
          ));
          
          setNewBuildConfig({});
          setEditingIndex(null);
          setIsAddDialogOpen(false);
        } else {
          alert('Invalid build URL format. Could not extract build number.');
        }
      } else {
        alert('Invalid build URL format. Expected pattern: /job/{jobName}/{buildNumber}/');
      }
    } catch (error) {
      alert('Invalid URL format. Please provide a valid Jenkins build URL.');
    }
  };

  const handleDeleteBuildConfig = (index: number) => {
    setBuildConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setNewBuildConfig({});
    setEditingIndex(null);
    setIsAddDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuration
      </Typography>

      {/* Authentication Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Jenkins Authentication
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="JSESSION ID"
              value={authConfig.jsessionId}
              onChange={(e) => handleAuthChange('jsessionId', e.target.value)}
              placeholder="Enter your JSESSION ID"
              fullWidth
              required
            />
            <TextField
              label="Jenkins Base URL"
              value={authConfig.jenkinsBaseUrl}
              onChange={(e) => handleAuthChange('jenkinsBaseUrl', e.target.value)}
              placeholder="http://jenkins-server:port"
              fullWidth
              required
            />
          </Box>
          
          <Button
            variant="contained"
            onClick={handleTestConnection}
            disabled={isTesting || !authConfig.jsessionId || !authConfig.jenkinsBaseUrl}
            startIcon={isTesting ? <CheckCircleIcon /> : <CheckCircleIcon />}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {testResult && (
            <Alert 
              severity={testResult} 
              sx={{ mt: 2 }}
              icon={testResult === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
            >
              {testMessage}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Build Configurations */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Build Configurations ({buildConfigs.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddDialogOpen(true)}
              disabled={testResult !== 'success'}
            >
              Add Build Configuration
            </Button>
          </Box>
          
          {buildConfigs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No build configurations added yet. Add your first one to start fetching Allure reports.
            </Typography>
          ) : (
            <List>
              {buildConfigs.map((config, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={config.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {config.buildUrl}
                          </Typography>
                          {config.description && (
                            <Typography variant="body2" color="text.secondary">
                              {config.description}
                            </Typography>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={config.environment} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                            />
                            {config.tags?.map((tag, tagIndex) => (
                              <Chip 
                                key={tagIndex} 
                                label={tag} 
                                size="small" 
                                variant="outlined" 
                                sx={{ mr: 1 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditBuildConfig(index)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteBuildConfig(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < buildConfigs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Build Configuration' : 'Add Build Configuration'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Configuration Name"
              value={newBuildConfig.name || ''}
              onChange={(e) => setNewBuildConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., UI Tests - Build #123"
              fullWidth
              required
            />
            
            <TextField
              label="Jenkins Build URL"
              value={newBuildConfig.buildUrl || ''}
              onChange={(e) => setNewBuildConfig(prev => ({ ...prev, buildUrl: e.target.value }))}
              placeholder="http://jenkins-server:port/job/job-name/123/"
              fullWidth
              required
              helperText="Provide the full URL to a specific Jenkins build"
            />
            
            <TextField
              label="Description (Optional)"
              value={newBuildConfig.description || ''}
              onChange={(e) => setNewBuildConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this build configuration"
              fullWidth
              multiline
              rows={2}
            />
            
            <TextField
              label="Environment (Optional)"
              value={newBuildConfig.environment || ''}
              onChange={(e) => setNewBuildConfig(prev => ({ ...prev, environment: e.target.value }))}
              placeholder="e.g., Production, Staging, Development"
              fullWidth
            />
            
            <TextField
              label="Tags (Optional)"
              value={newBuildConfig.tags?.join(', ') || ''}
              onChange={(e) => setNewBuildConfig(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="tag1, tag2, tag3"
              fullWidth
              helperText="Separate multiple tags with commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={editingIndex !== null ? handleUpdateBuildConfig : handleAddBuildConfig}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!newBuildConfig.name || !newBuildConfig.buildUrl}
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Configuration;
