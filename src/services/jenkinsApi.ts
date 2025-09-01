import axios from 'axios';
import { AuthenticationConfig, JenkinsBuildConfig, AllureReportData } from '../types';

export const jenkinsService = {
  initialize(config: AuthenticationConfig): any { return null; },
  async testAuthentication(): Promise<boolean> { return true; },
  async getAllureReportsForBuilds(configs: any): Promise<AllureReportData[]> { return []; },
  getBuildConsoleUrl(url: string): string { return ''; },
  getAllureReportUrl(url: string): string { return ''; }
};
