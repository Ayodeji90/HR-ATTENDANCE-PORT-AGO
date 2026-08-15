import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveAttendance from './pages/LiveAttendance';
import AttendanceDashboard from './pages/AttendanceDashboard';
import DailyAttendance from './pages/DailyAttendance';
import PendingAttendance from './pages/PendingAttendance';
import LocationAlerts from './pages/LocationAlerts';
import EmployeeAttendance from './pages/EmployeeAttendance';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import EmployeeCreate from './pages/EmployeeCreate';
import PendingRegistrations from './pages/PendingRegistrations';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import SiteCreate from './pages/SiteCreate';
import SiteAssignments from './pages/SiteAssignments';
import LeaveApprovals from './pages/LeaveApprovals';
import EmployeeLeaves from './pages/EmployeeLeaves';
import MyReports from './pages/MyReports';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import MyAccount from './pages/MyAccount';
import SiteReport from './components/reports/SiteReport';
import MonthlyReport from './components/reports/MonthlyReport';

// Every child route below is rendered inside <Layout>'s <Outlet />, so the
// branded sidebar/header shell is applied exactly once at the routing level
// — individual pages no longer import or wrap themselves in <Layout>, which
// is what previously left 17 of 18 pages without navigation chrome.
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Attendance monitoring */}
          <Route path="/attendance" element={<AttendanceDashboard />} />
          <Route path="/attendance/live" element={<LiveAttendance />} />
          <Route path="/attendance/daily" element={<DailyAttendance />} />
          <Route path="/attendance/pending" element={<PendingAttendance />} />
          <Route path="/attendance/alerts" element={<LocationAlerts />} />
          <Route path="/attendance/employee/:employeeId" element={<EmployeeAttendance />} />

          {/* Employee management */}
          <Route path="/employees" element={<ProtectedRoute roles={['admin', 'hr']}><Employees /></ProtectedRoute>} />
          <Route path="/employees/create" element={<ProtectedRoute roles={['admin', 'hr']}><EmployeeCreate /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<ProtectedRoute roles={['admin', 'hr']}><EmployeeDetail /></ProtectedRoute>} />
          <Route path="/registrations/pending" element={<ProtectedRoute roles={['admin', 'hr']}><PendingRegistrations /></ProtectedRoute>} />

          {/* Site management */}
          <Route path="/sites" element={<ProtectedRoute roles={['admin', 'hr']}><Sites /></ProtectedRoute>} />
          <Route path="/sites/create" element={<ProtectedRoute roles={['admin', 'hr']}><SiteCreate /></ProtectedRoute>} />
          <Route path="/sites/:id" element={<ProtectedRoute roles={['admin', 'hr']}><SiteDetail /></ProtectedRoute>} />
          <Route path="/sites/:id/assignments" element={<ProtectedRoute roles={['admin', 'hr']}><SiteAssignments /></ProtectedRoute>} />

          {/* Leave management */}
          <Route path="/leaves" element={<LeaveApprovals />} />
          <Route path="/leaves/employee/:employeeId" element={<EmployeeLeaves />} />
          {/* Employee self-service */}
          <Route path="/leaves/mine" element={<EmployeeLeaves />} />
          <Route path="/reports/mine" element={<MyReports />} />
          <Route path="/account" element={<MyAccount />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/site" element={<SiteReport />} />
          <Route path="/reports/monthly" element={<MonthlyReport />} />

          {/* Admin utilities */}
          <Route path="/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
