# Automation Dashboard

## Dependency Installation

Before setting up the project, ensure you have Node.js and npm installed. If you are on macOS, you can use Homebrew:

```bash
# 1. Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Add Homebrew to your PATH (if not already)
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile

# 3. Install Node.js (includes npm)
brew install node
```

Once Node.js and npm are installed, install the project dependencies:

```bash
# 4. Install all project dependencies
yarn install # or npm install
```

If you encounter issues with MUI date pickers or peer dependencies, you may need to remove problematic packages:

```bash
# 5. Remove problematic date picker dependencies (if present)
npm uninstall @mui/x-date-pickers @date-io/date-fns
```

---

A comprehensive web-based dashboard for monitoring Jenkins automation jobs and Allure test reports. This dashboard provides real-time insights into test execution, build status, and detailed analytics.

## Features

### 🎯 Core Dashboard
- **Real-time Jenkins Integration**: Connect to your Jenkins server and monitor all jobs
- **Allure Reports Visualization**: Display test results as interactive pie charts organized by date
- **In-Progress Job Monitoring**: Track running jobs with estimated completion times
- **Job Status Overview**: Quick view of all job statuses with color-coded indicators

### 📊 Data & Analysis
- **Historical Trend Analysis**: Track test success rates over time with line charts
- **Flakiness Tracker**: Identify and monitor flaky tests with failure rate analysis
- **Longest Running Tests**: Analyze test performance and duration patterns
- **Environment Matrix**: Compare test results across different environments

### 🔍 Filtering & Search
- **Job Name Filtering**: Search and filter jobs by name
- **Date Range Filtering**: Filter results by execution date
- **Status Filtering**: Filter by build status (Success, Failure, Unstable, etc.)
- **Advanced Search**: Combine multiple filters for precise results

### 🔗 Links Hub
- **Quick Access Links**: Direct links to Jenkins build logs and Allure reports
- **Maven Command Integration**: Copy Maven commands used for job execution
- **GitHub Integration**: View repository, branch, and commit information
- **Failure Triage System**: Claim failed builds for investigation to prevent duplicate work

## Prerequisites

- Node.js 16+ and npm
- Jenkins server with API access
- Allure reports configured in Jenkins jobs

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd automation-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Jenkins connection**
   Edit `src/services/jenkinsApi.ts` and update the `JENKINS_BASE_URL`:
   ```typescript
   const JENKINS_BASE_URL = 'http://your-jenkins-server:8080';
   ```

4. **Add authentication (if required)**
   In `src/services/jenkinsApi.ts`, uncomment and configure authentication:
   ```typescript
   jenkinsApi.interceptors.request.use((config) => {
     config.auth = { username: 'your-username', password: 'your-token' };
     return config;
   });
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Configuration

### Jenkins Server Setup
- Ensure your Jenkins server is accessible from the dashboard
- Configure CORS if needed
- Set up API tokens for authentication

### Allure Reports
- Configure Allure reports in your Jenkins jobs
- Ensure reports are archived in `target/allure-results`
- Verify Allure report URLs are accessible

## Usage

### Dashboard Overview
1. **View All Jobs**: The main dashboard shows all Jenkins jobs with their current status
2. **Monitor In-Progress Jobs**: See real-time status of running jobs with estimated completion times
3. **Analyze Test Results**: View Allure reports as pie charts organized by execution date

### Data Analysis
1. **Historical Trends**: Navigate to "Data & Analysis" to view test success rates over time
2. **Flakiness Analysis**: Identify tests with high failure rates
3. **Performance Analysis**: Find the longest-running tests
4. **Environment Comparison**: Compare test results across different environments

### Links Hub
1. **Quick Access**: Use the Links Hub for direct access to build logs and reports
2. **Copy Commands**: Copy Maven commands for local execution
3. **GitHub Info**: View repository and commit information
4. **Failure Triage**: Claim failed builds to prevent duplicate investigations

## API Endpoints

The dashboard integrates with Jenkins REST API:

- `GET /api/json` - Get all jobs
- `GET /job/{jobName}/api/json` - Get specific job details
- `GET /job/{jobName}/{buildNumber}/api/json` - Get build details
- `GET /queue/api/json` - Get queue information
- `GET /job/{jobName}/{buildNumber}/allure-results/api/rs/allure2/export/testresult.json` - Get Allure results

## Technologies Used

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Beautiful and responsive UI components
- **Recharts** - Interactive charts and visualizations
- **React Query** - Efficient data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Date-fns** - Date manipulation utilities
- **React Hot Toast** - User notifications

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── Analysis.tsx     # Data analysis features
│   ├── LinksHub.tsx     # Quick links and failure triage
│   ├── Navigation.tsx   # Sidebar navigation
│   ├── InProgressJobs.tsx # In-progress job monitoring
│   └── FilterPanel.tsx  # Filtering interface
├── services/            # API services
│   └── jenkinsApi.ts    # Jenkins API integration
├── types/               # TypeScript type definitions
│   └── index.ts         # All type interfaces
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

## Customization

### Adding New Charts
1. Import chart components from Recharts
2. Create new components in the `components/` directory
3. Add them to the Analysis component

### Custom Jenkins Integration
1. Extend the `jenkinsService` in `services/jenkinsApi.ts`
2. Add new API endpoints as needed
3. Update TypeScript interfaces in `types/index.ts`

### Styling
- The application uses Material-UI theming
- Customize the theme in `App.tsx`
- Add custom styles using MUI's `sx` prop or styled components

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Configure CORS on your Jenkins server
   - Use a proxy in development

2. **Authentication Issues**
   - Verify Jenkins API tokens
   - Check username/password configuration

3. **Allure Reports Not Loading**
   - Verify Allure is configured in Jenkins jobs
   - Check report archive paths

4. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Jenkins and Allure documentation 