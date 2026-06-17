import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// HR Pages
import HRDashboard from './pages/hr/DashboardPage';
import DocumentsPage from './pages/hr/DocumentsPage';
import ChatbotsPage from './pages/hr/ChatbotsPage';
import HRFlashcardsPage from './pages/hr/FlashcardsPage';
import HRAssessmentsPage from './pages/hr/AssessmentsPage';
import EmployeeManagementPage from './pages/hr/EmployeeManagementPage';
import SOPOfTheDayPage from './pages/hr/SOPOfTheDayPage';
import AnalyticsPage from './pages/hr/AnalyticsPage';
import HROnboardingPage from './pages/hr/OnboardingPage';
import HRTracksPage from './pages/hr/TracksPage';
import HRMentorshipPage from './pages/hr/MentorshipPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/DashboardPage';
import ChatPage from './pages/employee/ChatPage';
import EmployeeFlashcardsPage from './pages/employee/FlashcardsPage';
import EmployeeAssessmentsPage from './pages/employee/AssessmentsPage';
import LearningPathPage from './pages/employee/LearningPathPage';
import EmployeeOnboardingPage from './pages/employee/OnboardingPage';
import EmployeeTracksPage from './pages/employee/TracksPage';
import EmployeeMentorshipPage from './pages/employee/MentorshipPage';

// Super Admin Pages
import PendingHRsPage from './pages/admin/PendingHRsPage';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Super Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><AppLayout /></ProtectedRoute>}>
                <Route path="pending-hrs" element={<PendingHRsPage />} />
              </Route>

              {/* HR Routes */}
              <Route path="/hr" element={<ProtectedRoute requiredRole="hr"><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<HRDashboard />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="chatbots" element={<ChatbotsPage />} />
                <Route path="flashcards" element={<HRFlashcardsPage />} />
                <Route path="assessments" element={<HRAssessmentsPage />} />
                <Route path="employees" element={<EmployeeManagementPage />} />
                <Route path="sop-of-the-day" element={<SOPOfTheDayPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="onboarding" element={<HROnboardingPage />} />
                <Route path="tracks" element={<HRTracksPage />} />
                <Route path="mentorship" element={<HRMentorshipPage />} />
              </Route>

              {/* Employee Routes */}
              <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="flashcards" element={<EmployeeFlashcardsPage />} />
                <Route path="assessments" element={<EmployeeAssessmentsPage />} />
                <Route path="learning-path" element={<LearningPathPage />} />
                <Route path="onboarding" element={<EmployeeOnboardingPage />} />
                <Route path="tracks" element={<EmployeeTracksPage />} />
                <Route path="mentorship" element={<EmployeeMentorshipPage />} />
              </Route>

              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
