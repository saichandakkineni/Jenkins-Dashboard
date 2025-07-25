import axios from 'axios';
import { JenkinsJob, JenkinsBuild, AllureSummary, AllureResult } from '../types';

const JENKINS_BASE_URL = 'http://cmob-jenkins.td.com:8080';

// Configure axios with basic auth if needed
const jenkinsApi = axios.create({
  baseURL: JENKINS_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor if credentials are provided
jenkinsApi.interceptors.request.use((config) => {
  // You can add authentication here if needed
  // config.auth = { username: 'user', password: 'token' };
  return config;
});

export const jenkinsService = {
  // Get all jobs from Jenkins
  async getJobs(): Promise<JenkinsJob[]> {
    try {
      const response = await jenkinsApi.get('/api/json?tree=jobs[name,url,color,inQueue,lastBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastCompletedBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastFailedBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastSuccessfulBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastUnsuccessfulBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],builds[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo]]]');
      return response.data.jobs || [];
    } catch (error) {
      console.error('Error fetching Jenkins jobs:', error);
      throw new Error('Failed to fetch Jenkins jobs');
    }
  },

  // Get specific job details
  async getJob(jobName: string): Promise<JenkinsJob> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/api/json?tree=name,url,color,inQueue,lastBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastCompletedBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastFailedBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastSuccessfulBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],lastUnsuccessfulBuild[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],builds[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo]]`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${jobName}:`, error);
      throw new Error(`Failed to fetch job ${jobName}`);
    }
  },

  // Get build details
  async getBuild(jobName: string, buildNumber: number): Promise<JenkinsBuild> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching build ${buildNumber} for job ${jobName}:`, error);
      throw new Error(`Failed to fetch build ${buildNumber} for job ${jobName}`);
    }
  },

  // Get Allure results for a specific build
  async getAllureResults(jobName: string, buildNumber: number): Promise<AllureResult[]> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/allure-results/api/rs/allure2/export/testresult.json`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching Allure results for build ${buildNumber} of job ${jobName}:`, error);
      // Return empty array if Allure results are not available
      return [];
    }
  },

  // Get Allure summary for a specific build
  async getAllureSummary(jobName: string, buildNumber: number): Promise<AllureSummary | null> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/allure-results/api/rs/allure2/export/summary.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Allure summary for build ${buildNumber} of job ${jobName}:`, error);
      return null;
    }
  },

  // Get Allure report URL
  getAllureReportUrl(jobName: string, buildNumber: number): string {
    return `${JENKINS_BASE_URL}/job/${encodeURIComponent(jobName)}/${buildNumber}/allure/`;
  },

  // Get build log URL
  getBuildLogUrl(jobName: string, buildNumber: number): string {
    return `${JENKINS_BASE_URL}/job/${encodeURIComponent(jobName)}/${buildNumber}/console`;
  },

  // Get build URL
  getBuildUrl(jobName: string, buildNumber: number): string {
    return `${JENKINS_BASE_URL}/job/${encodeURIComponent(jobName)}/${buildNumber}/`;
  },

  // Get job URL
  getJobUrl(jobName: string): string {
    return `${JENKINS_BASE_URL}/job/${encodeURIComponent(jobName)}/`;
  },

  // Get workspace URL for Maven command
  getWorkspaceUrl(jobName: string, buildNumber: number): string {
    return `${JENKINS_BASE_URL}/job/${encodeURIComponent(jobName)}/${buildNumber}/ws/`;
  },

  // Get queue information for in-progress jobs
  async getQueueInfo(): Promise<any[]> {
    try {
      const response = await jenkinsApi.get('/queue/api/json?tree=items[id,blocked,blockedBy,why,url,executable[number,url,timestamp,duration,estimatedDuration,result,building,description,displayName,fullDisplayName,id,keepLog,queueId,builtOn,changeSet,culprits,actions,artifacts,mavenArtifacts,mavenVersionUsed,workspace,scm,gitBranch,gitCommit,gitRepo],task[name,url,color,inQueue]]');
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching queue information:', error);
      return [];
    }
  },

  // Get build artifacts
  async getBuildArtifacts(jobName: string, buildNumber: number): Promise<any[]> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=artifacts[fileName,relativePath]`);
      return response.data.artifacts || [];
    } catch (error) {
      console.error(`Error fetching artifacts for build ${buildNumber} of job ${jobName}:`, error);
      return [];
    }
  },

  // Get SCM information (Git details)
  async getScmInfo(jobName: string, buildNumber: number): Promise<any> {
    try {
      const response = await jenkinsApi.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=actions[*],changeSet[*]`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching SCM info for build ${buildNumber} of job ${jobName}:`, error);
      return null;
    }
  }
}; 