import { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon.jsx';

const ApiTestPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [expandedTests, setExpandedTests] = useState({});

  // Define all API endpoints by category
  const apiEndpoints = {
    auth: [
      { name: 'Login', method: 'POST', endpoint: '/auth/login', skip: true, reason: 'Requires credentials' },
      { name: 'Register', method: 'POST', endpoint: '/auth/register', skip: true, reason: 'Creates user' },
      { name: 'Refresh Token', method: 'POST', endpoint: '/auth/refresh', skip: true, reason: 'Requires refresh token' },
      { name: 'Logout', method: 'POST', endpoint: '/auth/logout', requireAuth: true },
      { name: 'Verify Email Link', method: 'GET', endpoint: '/auth/verify-email?token=invalid', skip: true, reason: 'Needs valid token' },
      { name: 'Resend Code', method: 'POST', endpoint: '/auth/resend-code', skip: true, reason: 'Requires email' },
      { name: 'Request Password Reset', method: 'POST', endpoint: '/auth/request-reset', skip: true, reason: 'Requires email' },
      { name: 'Reset Password', method: 'POST', endpoint: '/auth/reset-password', skip: true, reason: 'Requires token' },
    ],
    patients: [
      { name: 'List Patients', method: 'GET', endpoint: '/patients?limit=10', roles: ['Admin', 'Receptionist', 'Doctor'] },
      { name: 'Get Patient by ID', method: 'GET', endpoint: '/patients/{id}', skip: true, reason: 'Needs patient ID' },
      { name: 'Create Patient', method: 'POST', endpoint: '/patients', skip: true, reason: 'Creates data', roles: ['Admin', 'Receptionist'] },
      { name: 'Update Patient', method: 'PUT', endpoint: '/patients/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'Receptionist'] },
      { name: 'Delete Patient', method: 'DELETE', endpoint: '/patients/{id}', skip: true, reason: 'Deletes data', roles: ['Admin'] },
    ],
    doctors: [
      { name: 'List Doctors', method: 'GET', endpoint: '/doctors?limit=10', roles: ['Admin', 'Receptionist', 'Patient', 'Doctor', 'HR'] },
      { name: 'Get Doctor by ID', method: 'GET', endpoint: '/doctors/{id}', skip: true, reason: 'Needs doctor ID' },
      { name: 'Create Doctor', method: 'POST', endpoint: '/doctors', skip: true, reason: 'Creates data', roles: ['Admin'] },
      { name: 'Update Doctor', method: 'PUT', endpoint: '/doctors/{id}', skip: true, reason: 'Modifies data', roles: ['Admin'] },
      { name: 'Delete Doctor', method: 'DELETE', endpoint: '/doctors/{id}', skip: true, reason: 'Deletes data', roles: ['Admin'] },
      { name: 'Ensure Doctor Profile', method: 'POST', endpoint: '/doctors/me/ensure', roles: ['Doctor'] },
    ],
    appointments: [
      { name: 'List Appointments', method: 'GET', endpoint: '/appointments?limit=10', roles: ['Admin', 'Receptionist', 'Doctor', 'Patient'] },
      { name: 'Get Appointment by ID', method: 'GET', endpoint: '/appointments/{id}', skip: true, reason: 'Needs appointment ID' },
      { name: 'Create Appointment', method: 'POST', endpoint: '/appointments', skip: true, reason: 'Creates data', roles: ['Patient', 'Receptionist', 'Admin'] },
      { name: 'Update Appointment', method: 'PUT', endpoint: '/appointments/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'Receptionist'] },
      { name: 'Update Status', method: 'PUT', endpoint: '/appointments/{id}/status', skip: true, reason: 'Modifies data', roles: ['Receptionist', 'Doctor', 'Admin'] },
      { name: 'Generate Bill', method: 'POST', endpoint: '/appointments/{id}/bill', skip: true, reason: 'Creates bill', roles: ['Receptionist', 'Admin'] },
      { name: 'Reschedule', method: 'POST', endpoint: '/appointments/{id}/reschedule', skip: true, reason: 'Modifies data' },
      { name: 'Schedule Follow-up', method: 'POST', endpoint: '/appointments/{id}/follow-up', skip: true, reason: 'Creates data', roles: ['Doctor', 'Admin', 'Receptionist'] },
    ],
    bills: [
      { name: 'List Bills', method: 'GET', endpoint: '/bills?limit=10', roles: ['Admin', 'Receptionist', 'Patient', 'Doctor'] },
      { name: 'Get Bill by ID', method: 'GET', endpoint: '/bills/{id}', skip: true, reason: 'Needs bill ID' },
      { name: 'Update Bill', method: 'PUT', endpoint: '/bills/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'Receptionist'] },
    ],
    availability: [
      { name: 'Get Doctor Availability', method: 'GET', endpoint: '/doctors/{doctorId}/availability', skip: true, reason: 'Needs doctor ID' },
      { name: 'Create Availability', method: 'POST', endpoint: '/doctors/{doctorId}/availability', skip: true, reason: 'Creates data', roles: ['Admin', 'Doctor'] },
      { name: 'Update Availability', method: 'PUT', endpoint: '/availability/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'Doctor'] },
      { name: 'Delete Availability', method: 'DELETE', endpoint: '/availability/{id}', skip: true, reason: 'Deletes data', roles: ['Admin', 'Doctor'] },
      { name: 'Get Days Off', method: 'GET', endpoint: '/doctors/{doctorId}/days-off', skip: true, reason: 'Needs doctor ID' },
      { name: 'Create Day Off', method: 'POST', endpoint: '/doctors/{doctorId}/days-off', skip: true, reason: 'Creates data', roles: ['Admin', 'Doctor'] },
      { name: 'Delete Day Off', method: 'DELETE', endpoint: '/days-off/{id}', skip: true, reason: 'Deletes data', roles: ['Admin', 'Doctor'] },
    ],
    queue: [
      { name: 'Get Waiting Queue', method: 'GET', endpoint: '/waiting-queue', roles: ['Admin', 'Receptionist', 'Doctor'] },
      { name: 'Join Queue', method: 'POST', endpoint: '/waiting-queue', skip: true, reason: 'Creates data', roles: ['Patient', 'Admin', 'Receptionist'] },
      { name: 'Update Queue Priority', method: 'PUT', endpoint: '/waiting-queue/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'Receptionist'] },
      { name: 'Leave Queue', method: 'DELETE', endpoint: '/waiting-queue/{id}', skip: true, reason: 'Deletes data' },
      { name: 'Schedule from Queue', method: 'POST', endpoint: '/waiting-queue/{id}/schedule', skip: true, reason: 'Creates data', roles: ['Admin', 'Receptionist'] },
    ],
    departments: [
      { name: 'List Departments', method: 'GET', endpoint: '/departments?limit=50', roles: ['Admin', 'HR'] },
      { name: 'Create Department', method: 'POST', endpoint: '/departments', skip: true, reason: 'Creates data', roles: ['Admin'] },
      { name: 'Update Department', method: 'PUT', endpoint: '/departments/{id}', skip: true, reason: 'Modifies data', roles: ['Admin'] },
      { name: 'Delete Department', method: 'DELETE', endpoint: '/departments/{id}', skip: true, reason: 'Deletes data', roles: ['Admin'] },
    ],
    inventory: [
      { name: 'List Inventory', method: 'GET', endpoint: '/inventory?limit=50', roles: ['Admin', 'Receptionist', 'HR'] },
      { name: 'Create Inventory Item', method: 'POST', endpoint: '/inventory', skip: true, reason: 'Creates data', roles: ['Admin', 'HR'] },
      { name: 'Update Inventory Item', method: 'PUT', endpoint: '/inventory/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'HR'] },
      { name: 'Delete Inventory Item', method: 'DELETE', endpoint: '/inventory/{id}', skip: true, reason: 'Deletes data', roles: ['Admin'] },
    ],
    notifications: [
      { name: 'List Notifications', method: 'GET', endpoint: '/notifications', requireAuth: true },
      { name: 'Create Notification', method: 'POST', endpoint: '/notifications', skip: true, reason: 'Creates data', roles: ['Admin', 'Doctor', 'Receptionist'] },
      { name: 'Update Notification', method: 'PUT', endpoint: '/notifications/{id}', skip: true, reason: 'Modifies data' },
    ],
    hr: [
      { name: 'List Users', method: 'GET', endpoint: '/hr/users', roles: ['Admin', 'HR'] },
      { name: 'List Employees', method: 'GET', endpoint: '/hr/employees', roles: ['Admin', 'HR'] },
      { name: 'Create Employee', method: 'POST', endpoint: '/hr/employees', skip: true, reason: 'Creates data', roles: ['Admin', 'HR'] },
      { name: 'Update Employee', method: 'PUT', endpoint: '/hr/employees/{id}', skip: true, reason: 'Modifies data', roles: ['Admin', 'HR'] },
      { name: 'Delete Employee', method: 'DELETE', endpoint: '/hr/employees/{id}', skip: true, reason: 'Deletes data', roles: ['Admin', 'HR'] },
      { name: 'List Leaves', method: 'GET', endpoint: '/hr/leaves', roles: ['Admin', 'HR', 'Receptionist', 'Doctor', 'Patient'] },
      { name: 'Create Leave', method: 'POST', endpoint: '/hr/leaves', skip: true, reason: 'Creates data' },
      { name: 'Decide Leave', method: 'PUT', endpoint: '/hr/leaves/{id}/decision', skip: true, reason: 'Modifies data', roles: ['Admin', 'HR'] },
      { name: 'List Payroll', method: 'GET', endpoint: '/hr/payroll', roles: ['Admin', 'HR', 'Receptionist', 'Doctor', 'Patient'] },
      { name: 'Create Payroll', method: 'POST', endpoint: '/hr/payroll', skip: true, reason: 'Creates data', roles: ['Admin', 'HR'] },
      { name: 'Mark Payroll Paid', method: 'PUT', endpoint: '/hr/payroll/{id}/paid', skip: true, reason: 'Modifies data', roles: ['Admin', 'HR'] },
    ],
    logs: [
      { name: 'List Logs', method: 'GET', endpoint: '/logs?limit=10', roles: ['Admin'] },
    ],
    settings: [
      { name: 'Get Settings', method: 'GET', endpoint: '/settings', roles: ['Admin'] },
      { name: 'Update Settings', method: 'PUT', endpoint: '/settings', skip: true, reason: 'Modifies settings', roles: ['Admin'] },
      { name: 'Test SMTP Connection', method: 'POST', endpoint: '/settings/test-smtp', skip: true, reason: 'Tests SMTP', roles: ['Admin'] },
      { name: 'Send Test Email', method: 'POST', endpoint: '/settings/send-test-email', skip: true, reason: 'Sends email', roles: ['Admin'] },
      { name: 'Get System Stats', method: 'GET', endpoint: '/settings/system-stats', roles: ['Admin'] },
    ],
    roles: [
      { name: 'List Roles', method: 'GET', endpoint: '/roles', roles: ['Admin'] },
    ],
    users: [
      { name: 'Update User Role', method: 'PUT', endpoint: '/users/{id}/role', skip: true, reason: 'Modifies data', roles: ['Admin'] },
      { name: 'Update User Profile', method: 'PUT', endpoint: '/users/{id}/profile', skip: true, reason: 'Modifies data', roles: ['Admin'] },
    ],
  };

  const categories = Object.keys(apiEndpoints);
  const userRole = user?.role?.name || user?.role;

  const canTestEndpoint = (endpoint) => {
    if (endpoint.skip) return false;
    if (!endpoint.roles) return true;
    return endpoint.roles.includes(userRole);
  };

  const getFilteredEndpoints = () => {
    if (selectedCategory === 'all') {
      const allEndpoints = [];
      Object.entries(apiEndpoints).forEach(([category, endpoints]) => {
        endpoints.forEach(endpoint => {
          allEndpoints.push({ ...endpoint, category });
        });
      });
      return allEndpoints;
    }
    return apiEndpoints[selectedCategory].map(endpoint => ({ ...endpoint, category: selectedCategory }));
  };

  const testEndpoint = async (endpoint) => {
    const key = `${endpoint.category}-${endpoint.name}`;
    setTestResults(prev => ({ ...prev, [key]: { status: 'testing', data: null, error: null } }));

    try {
      let response;
      const url = endpoint.endpoint;

      switch (endpoint.method) {
        case 'GET':
          response = await api.get(url);
          break;
        case 'POST':
          response = await api.post(url, {});
          break;
        case 'PUT':
          response = await api.put(url, {});
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
        default:
          throw new Error('Unsupported method');
      }

      setTestResults(prev => ({
        ...prev,
        [key]: { status: 'success', data: response.data, error: null, statusCode: response.status }
      }));
      toast.success(`✓ ${endpoint.name}`);
    } catch (err) {
      const errorData = {
        status: 'error',
        error: err.response?.data?.message || err.message,
        statusCode: err.response?.status,
        data: err.response?.data
      };
      setTestResults(prev => ({ ...prev, [key]: errorData }));
      toast.error(`✗ ${endpoint.name}: ${errorData.error}`);
    }
  };

  const testAllEndpoints = async () => {
    setTesting(true);
    const endpoints = getFilteredEndpoints().filter(canTestEndpoint);

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTesting(false);
    toast.success('All tests completed!');
  };

  const clearResults = () => {
    setTestResults({});
    toast.success('Results cleared');
  };

  const toggleExpanded = (key) => {
    setExpandedTests(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'testing': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'testing': return 'spinner';
      default: return 'minus-circle';
    }
  };

  const filteredEndpoints = getFilteredEndpoints();
  const testableCount = filteredEndpoints.filter(canTestEndpoint).length;
  const skippedCount = filteredEndpoints.filter(e => e.skip).length;
  const noAccessCount = filteredEndpoints.filter(e => !e.skip && !canTestEndpoint(e)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                API Endpoint Tester
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test all backend API endpoints from the frontend
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                Role: {userRole}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{testableCount}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Testable</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{skippedCount}</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{noAccessCount}</div>
              <div className="text-sm text-red-700 dark:text-red-300">No Access</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.values(testResults).filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Passed</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={testAllEndpoints}
              disabled={testing || testableCount === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {testing ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="spinner" className="w-5 h-5 animate-spin" />
                  Testing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="play" className="w-5 h-5" />
                  Test All ({testableCount})
                </span>
              )}
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <Icon name="trash" className="w-5 h-5" />
                Clear
              </span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({filteredEndpoints.length})
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category} ({apiEndpoints[category].length})
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint) => {
            const key = `${endpoint.category}-${endpoint.name}`;
            const result = testResults[key];
            const isExpanded = expandedTests[key];
            const canTest = canTestEndpoint(endpoint);

            return (
              <div
                key={key}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {endpoint.method}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{endpoint.name}</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs capitalize">
                          {endpoint.category}
                        </span>
                        {result && (
                          <Icon
                            name={getStatusIcon(result.status)}
                            className={`w-5 h-5 ${getStatusColor(result.status)} ${result.status === 'testing' ? 'animate-spin' : ''}`}
                          />
                        )}
                      </div>
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {endpoint.endpoint}
                      </div>
                      {endpoint.skip && (
                        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                          ⚠️ Skipped: {endpoint.reason}
                        </div>
                      )}
                      {!endpoint.skip && !canTest && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          🔒 No access: Requires role {endpoint.roles?.join(' or ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canTest && (
                        <button
                          onClick={() => testEndpoint(endpoint)}
                          disabled={testing}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                          Test
                        </button>
                      )}
                      {result && (
                        <button
                          onClick={() => toggleExpanded(key)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
                        >
                          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Result Details */}
                  {result && isExpanded && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Status:</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          result.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          result.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {result.statusCode || result.status}
                        </span>
                      </div>
                      {result.error && (
                        <div className="mb-2">
                          <span className="font-semibold text-red-600 dark:text-red-400">Error:</span>
                          <div className="mt-1 text-sm text-red-700 dark:text-red-300">{result.error}</div>
                        </div>
                      )}
                      {result.data && (
                        <div>
                          <span className="font-semibold">Response:</span>
                          <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
