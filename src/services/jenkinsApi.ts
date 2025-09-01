import axios from 'axios';
import { 
  JenkinsBuildConfig, 
  AllureSummary, 
  AllureResult, 
  AllureReportData,
  AuthenticationConfig 
} from '../types';

class JenkinsApiService {
  private baseURL: string;
  private jsessionId: string;
  private axiosInstance: any;

  constructor(config: AuthenticationConfig) {
    this.baseURL = config.jenkinsBaseUrl;
    this.jsessionId = config.jsessionId;
    this.initializeAxios();
  }

  private initializeAxios() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `JSESSIONID=${this.jsessionId}`,
      },
    });

    // Add response interceptor to handle authentication errors
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Authentication failed. Please check your JSESSION ID.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Update authentication configuration
  updateAuth(config: AuthenticationConfig) {
    this.baseURL = config.jenkinsBaseUrl;
    this.jsessionId = config.jsessionId;
    this.initializeAxios();
  }

  // Extract job name and build number from a Jenkins build URL
  private parseBuildUrl(buildUrl: string): { jobName: string; buildNumber: number } | null {
    try {
      const url = new URL(buildUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // Jenkins URL pattern: /job/{jobName}/{buildNumber}/
      const jobIndex = pathParts.indexOf('job');
      if (jobIndex !== -1 && jobIndex + 2 < pathParts.length) {
        const jobName = pathParts[jobIndex + 1];
        const buildNumber = parseInt(pathParts[jobIndex + 2]);
        
        if (!isNaN(buildNumber)) {
          return { jobName, buildNumber };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing build URL:', error);
      return null;
    }
  }

  // Fetch Allure summary from a specific build URL
  async getAllureSummary(buildUrl: string): Promise<AllureSummary | null> {
    try {
      const buildInfo = this.parseBuildUrl(buildUrl);
      if (!buildInfo) {
        throw new Error('Invalid build URL format');
      }

      const { jobName, buildNumber } = buildInfo;
      const response = await this.axiosInstance.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/allure-results/api/rs/allure2/export/summary.json`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Allure summary:', error);
      return null;
    }
  }

  // Fetch Allure results from a specific build URL
  async getAllureResults(buildUrl: string): Promise<AllureResult[]> {
    try {
      const buildInfo = this.parseBuildUrl(buildUrl);
      if (!buildInfo) {
        throw new Error('Invalid build URL format');
      }

      const { jobName, buildNumber } = buildInfo;
      const response = await this.axiosInstance.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/allure-results/api/rs/allure2/export/testresult.json`
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching Allure results:', error);
      return [];
    }
  }

  // Fetch complete Allure report data for a build
  async getAllureReportData(buildConfig: JenkinsBuildConfig): Promise<AllureReportData> {
    try {
      const [summary, results] = await Promise.all([
        this.getAllureSummary(buildConfig.buildUrl),
        this.getAllureResults(buildConfig.buildUrl)
      ]);

      const reportUrl = this.getAllureReportUrl(buildConfig.buildUrl);

      return {
        buildConfig,
        summary,
        results,
        reportUrl,
        lastUpdated: new Date(),
        status: 'success'
      };
    } catch (error) {
      console.error(`Error fetching Allure report data for ${buildConfig.name}:`, error);
      
      return {
        buildConfig,
        summary: null,
        results: [],
        reportUrl: this.getAllureReportUrl(buildConfig.buildUrl),
        lastUpdated: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Fetch Allure report data for multiple builds
  async getAllureReportsForBuilds(buildConfigs: JenkinsBuildConfig[]): Promise<AllureReportData[]> {
    const promises = buildConfigs.map(config => this.getAllureReportData(config));
    return Promise.all(promises);
  }

  // Get Allure report URL
  getAllureReportUrl(buildUrl: string): string {
    const buildInfo = this.parseBuildUrl(buildUrl);
    if (!buildInfo) {
      return buildUrl;
    }
    
    const { jobName, buildNumber } = buildInfo;
    return `${this.baseURL}/job/${encodeURIComponent(jobName)}/${buildNumber}/allure/`;
  }

  // Get build console URL
  getBuildConsoleUrl(buildUrl: string): string {
    const buildInfo = this.parseBuildUrl(buildUrl);
    if (!buildInfo) {
      return buildUrl;
    }
    
    const { jobName, buildNumber } = buildInfo;
    return `${this.baseURL}/job/${encodeURIComponent(jobName)}/${buildNumber}/console`;
  }

  // Get build workspace URL
  getBuildWorkspaceUrl(buildUrl: string): string {
    const buildInfo = this.parseBuildUrl(buildUrl);
    if (!buildInfo) {
      return buildUrl;
    }
    
    const { jobName, buildNumber } = buildInfo;
    return `${this.baseURL}/job/${encodeURIComponent(jobName)}/${buildNumber}/ws/`;
  }

  // Test authentication
  async testAuthentication(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/api/json?tree=jobs[name]');
      return true;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  // Get build information (metadata)
  async getBuildInfo(buildUrl: string): Promise<any> {
    try {
      const buildInfo = this.parseBuildUrl(buildUrl);
      if (!buildInfo) {
        throw new Error('Invalid build URL format');
      }

      const { jobName, buildNumber } = buildInfo;
      const response = await this.axiosInstance.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=number,url,timestamp,duration,result,building,description,displayName,fullDisplayName,id,builtOn,changeSet,culprits,actions,artifacts,gitBranch,gitCommit,gitRepo`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching build info:', error);
      return null;
    }
  }
}

// Create a default instance (will be configured later)
let jenkinsServiceInstance: JenkinsApiService | null = null;

export const jenkinsService = {
  // Initialize the service with authentication
  initialize(config: AuthenticationConfig): JenkinsApiService {
    jenkinsServiceInstance = new JenkinsApiService(config);
    return jenkinsServiceInstance;
  },

  // Get the current service instance
  getInstance(): JenkinsApiService {
    if (!jenkinsServiceInstance) {
      throw new Error('Jenkins service not initialized. Call initialize() first.');
    }
    return jenkinsServiceInstance;
  },

  // Update authentication
  updateAuth(config: AuthenticationConfig): void {
    if (jenkinsServiceInstance) {
      jenkinsServiceInstance.updateAuth(config);
    }
  },

  // Convenience methods that delegate to the instance
  async getAllureSummary(buildUrl: string): Promise<AllureSummary | null> {
    return this.getInstance().getAllureSummary(buildUrl);
  },

  async getAllureResults(buildUrl: string): Promise<AllureResult[]> {
    return this.getInstance().getAllureResults(buildUrl);
  },

  async getAllureReportData(buildConfig: JenkinsBuildConfig): Promise<AllureReportData> {
    return this.getInstance().getAllureReportData(buildConfig);
  },

  async getAllureReportsForBuilds(buildConfigs: JenkinsBuildConfig[]): Promise<AllureReportData[]> {
    return this.getInstance().getAllureReportsForBuilds(buildConfigs);
  },

  async testAuthentication(): Promise<boolean> {
    return this.getInstance().testAuthentication();
  },

  async getBuildInfo(buildUrl: string): Promise<any> {
    return this.getInstance().getBuildInfo(buildUrl);
  },

  getAllureReportUrl(buildUrl: string): string {
    return this.getInstance().getAllureReportUrl(buildUrl);
  },

  getBuildConsoleUrl(buildUrl: string): string {
    return this.getInstance().getBuildConsoleUrl(buildUrl);
  },

  getBuildWorkspaceUrl(buildUrl: string): string {
    return this.getInstance().getBuildWorkspaceUrl(buildUrl);
  }
}; 