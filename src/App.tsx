import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard, WorkoutLog } from './pages';
import { Tools } from './pages/Tools';
import { MovementManager } from './pages/MovementManager';
import { ClassDetail } from './pages/ClassDetail';
import { CheckInHandler } from './pages/CheckInHandler';
import { AdminTodayManager } from './pages/Admin/AdminTodayManager';
import { UserManagement } from './pages/Admin/UserManagement';
import { BoxManagement } from './pages/Admin/BoxManagement';
import { BoxMemberManagement } from './pages/Admin/BoxMemberManagement';
import { ScoreInputPage } from './pages/ScoreInputPage';
import { Login } from './pages/Auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="log" element={
            <ProtectedRoute>
              <WorkoutLog />
            </ProtectedRoute>
          } />
          <Route path="tools" element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          } />
          <Route path="movements" element={
            <ProtectedRoute>
              <MovementManager />
            </ProtectedRoute>
          } />
          <Route path="class/today" element={
            <ProtectedRoute>
              <ClassDetail />
            </ProtectedRoute>
          } />
          <Route path="checkin" element={
            <ProtectedRoute>
              <CheckInHandler />
            </ProtectedRoute>
          } />
          <Route path="admin/class" element={
            <ProtectedRoute>
              <AdminTodayManager />
            </ProtectedRoute>
          } />
          <Route path="admin/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/boxes" element={
            <ProtectedRoute>
              <BoxManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/boxes/:boxId/members" element={
            <ProtectedRoute>
              <BoxMemberManagement />
            </ProtectedRoute>
          } />
          <Route path="class/:date" element={
            <ProtectedRoute>
              <ClassDetail />
            </ProtectedRoute>
          } />
          <Route path="class/:date/score" element={
            <ProtectedRoute>
              <ScoreInputPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
