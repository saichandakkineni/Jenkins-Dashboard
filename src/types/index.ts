export interface JenkinsJob {
  name: string;
  url: string;
  color: string;
  inQueue: boolean;
  lastBuild?: JenkinsBuild;
  lastCompletedBuild?: JenkinsBuild;
  lastFailedBuild?: JenkinsBuild;
  lastSuccessfulBuild?: JenkinsBuild;
  lastUnsuccessfulBuild?: JenkinsBuild;
  builds: JenkinsBuild[];
}

export interface JenkinsBuild {
  number: number;
  url: string;
  timestamp: number;
  duration: number;
  estimatedDuration: number;
  result?: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE' | 'IN_PROGRESS';
  building: boolean;
  description?: string;
  displayName: string;
  fullDisplayName: string;
  id: string;
  keepLog: boolean;
  queueId: number;
  builtOn: string;
  changeSet: any;
  culprits: any[];
  actions: any[];
  artifacts: any[];
  mavenArtifacts: any[];
  mavenVersionUsed: string;
  workspace: string;
  scm: any;
  gitBranch?: string;
  gitCommit?: string;
  gitRepo?: string;
}

export interface AllureResult {
  uuid: string;
  name: string;
  fullName: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  statusDetails: {
    message?: string;
    trace?: string;
  };
  stage: 'scheduled' | 'running' | 'finished' | 'interrupted' | 'cancelled';
  description?: string;
  descriptionHtml?: string;
  steps: AllureStep[];
  attachments: AllureAttachment[];
  parameters: AllureParameter[];
  start: number;
  stop: number;
  duration: number;
  labels: AllureLabel[];
  links: AllureLink[];
}

export interface AllureStep {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  statusDetails: {
    message?: string;
    trace?: string;
  };
  stage: 'scheduled' | 'running' | 'finished' | 'interrupted' | 'cancelled';
  start: number;
  stop: number;
  duration: number;
  attachments: AllureAttachment[];
  parameters: AllureParameter[];
  steps: AllureStep[];
}

export interface AllureAttachment {
  name: string;
  type: string;
  source: string;
}

export interface AllureParameter {
  name: string;
  value: string;
}

export interface AllureLabel {
  name: string;
  value: string;
}

export interface AllureLink {
  name: string;
  url: string;
  type: string;
}

export interface AllureSummary {
  total: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface DashboardFilters {
  jobName?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  environment?: string;
  tag?: string;
}

export interface ClaimedBuild {
  buildNumber: number;
  jobName: string;
  claimedBy: string;
  claimedAt: Date;
  notes?: string;
}

export interface HistoricalTrend {
  date: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
}

export interface FlakyTest {
  testName: string;
  jobName: string;
  failureRate: number;
  totalRuns: number;
  lastFailure: Date;
}

export interface LongestRunningTest {
  testName: string;
  jobName: string;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}

export interface EnvironmentMatrix {
  environment: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
}

// New types for the updated approach
export interface JenkinsBuildConfig {
  name: string;
  buildUrl: string;
  jobName: string;
  buildNumber: number;
  description?: string;
  environment?: string;
  tags?: string[];
}

export interface AllureReportData {
  buildConfig: JenkinsBuildConfig;
  summary: AllureSummary | null;
  results: AllureResult[];
  reportUrl: string;
  lastUpdated: Date;
  status: 'success' | 'error' | 'loading';
  errorMessage?: string;
}

export interface AuthenticationConfig {
  jsessionId: string;
  jenkinsBaseUrl: string;
}

export interface DashboardConfig {
  buildConfigs: JenkinsBuildConfig[];
  refreshInterval: number;
  maxRetries: number;
} 