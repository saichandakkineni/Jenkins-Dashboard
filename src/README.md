# Jenkins Dashboard with Allure Reports

A modern React-based dashboard for monitoring Jenkins builds and viewing Allure test reports. This dashboard uses JSESSION ID authentication and allows you to configure specific Jenkins build URLs to fetch Allure reports from.

## Features

- **JSESSION ID Authentication**: Secure authentication using Jenkins session cookies
- **Specific Build Configuration**: Configure individual Jenkins build URLs instead of scanning all projects
- **Allure Report Integration**: Fetch and display test results from Allure reports
- **Real-time Updates**: Automatic refresh of test data at configurable intervals
- **Advanced Filtering**: Filter reports by job name, status, environment, and tags
- **Data Visualization**: Charts and graphs for test trends and results
- **Responsive Design**: Modern Material-UI based interface

## Prerequisites

- Node.js 16+ and npm/yarn
- Jenkins server with Allure plugin installed
- Valid JSESSION ID from Jenkins
- Jenkins build URLs with Allure reports

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jenkins-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

## Configuration

### 1. Authentication Setup

1. Navigate to the **Configuration** section in the dashboard
2. Enter your Jenkins JSESSION ID
3. Provide the Jenkins base URL (e.g., `http://jenkins-server:8080`)
4. Click "Test Connection" to verify authentication

### 2. Build Configuration

1. After successful authentication, click "Add Build Configuration"
2. Provide a descriptive name for the configuration
3. Enter the full Jenkins build URL (e.g., `http://jenkins-server:8080/job/my-job/123/`)
4. Optionally add description, environment, and tags
5. Save the configuration

### 3. URL Format

Jenkins build URLs should follow this pattern:
```
http://jenkins-server:port/job/{jobName}/{buildNumber}/
```

Example:
```
http://jenkins-server:8080/job/ui-tests/456/
```

## Usage

### Dashboard

The main dashboard displays:
- Allure report summaries for configured builds
- Test result statistics (passed, failed, broken, skipped)
- Error reports with troubleshooting information
- Test results grouped by date with pie charts

### Data & Analysis

- **Historical Trends**: Test success rates over time
- **Flakiness Tracker**: Identify frequently failing tests
- **Environment Matrix**: Compare test results across environments

### Filtering

Use the filter panel to:
- Filter by job name
- Filter by report status (success, error, loading)
- Filter by environment
- Filter by tags

## API Endpoints

The dashboard fetches data from these Jenkins API endpoints:

- **Allure Summary**: `/job/{jobName}/{buildNumber}/allure-results/api/rs/allure2/export/summary.json`
- **Allure Results**: `/job/{jobName}/{buildNumber}/allure-results/api/rs/allure2/export/testresult.json`
- **Build Info**: `/job/{jobName}/{buildNumber}/api/json`

## Data Persistence

Configuration is automatically saved to localStorage:
- `jenkins-auth-config`: Authentication settings
- `jenkins-build-configs`: Build configuration list

## Troubleshooting

### Authentication Issues

- Verify your JSESSION ID is valid and not expired
- Check that the Jenkins base URL is correct
- Ensure you have access to the Jenkins server

### Build Configuration Issues

- Verify the build URL format is correct
- Ensure the build number exists
- Check that Allure reports are available for the build

### Data Loading Issues

- Check network connectivity to Jenkins
- Verify Allure plugin is installed and configured
- Check browser console for error messages

## Development

### Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard view
│   ├── Analysis.tsx           # Data analysis and trends
│   ├── Configuration.tsx      # Configuration management
│   ├── FilterPanel.tsx        # Data filtering
│   └── Navigation.tsx         # Navigation menu
├── services/
│   └── jenkinsApi.ts          # Jenkins API integration
├── types/
│   └── index.ts               # TypeScript type definitions
└── App.tsx                    # Main application component
```

### Key Technologies

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **React Query**: Data fetching and caching
- **Recharts**: Data visualization
- **Axios**: HTTP client

### Adding New Features

1. Update types in `types/index.ts`
2. Add API methods in `services/jenkinsApi.ts`
3. Create or update components as needed
4. Update routing in `App.tsx` if adding new pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify Jenkins and Allure plugin configuration
4. Create an issue in the repository
