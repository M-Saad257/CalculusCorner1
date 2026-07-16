import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CoursesPage from './pages/CoursesPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ResourceLibraryPage from './pages/ResourceLibraryPage';
import NotesPage from './pages/NotesPage';
import LecturesPage from './pages/LecturesPage';
import BooksPage from './pages/BooksPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Unauthorized from './pages/Unauthorized';
import UpdatesPage from './pages/UpdatesPage';
import PastPapersPage from './pages/PastPapersPage';
import ProtectedRoute from './components/ProtectedRoute';
import VisibilityRoute from './components/VisibilityRoute';
import ScrollToTop from './components/ScrollToTop';
import YoutubeSubscribePopup from './components/YoutubeSubscribePopup';
import GlobalMathBackground from './components/layout/GlobalMathBackground';
import DynamicFavicon from './components/DynamicFavicon';
import { ContentProvider } from './context/ContentContext';
import { SocketProvider } from './context/SocketContext';
import { DialogProvider } from './context/DialogContext';

function App() {
  return (
    <DialogProvider>
      <SocketProvider>
        <ContentProvider>
          <DynamicFavicon />
          <Router>
            <ScrollToTop />
	    <YoutubeSubscribePopup />
            <div className="min-h-screen flex flex-col bg-bg-color font-sans antialiased text-text-primary selection:bg-primary-light selection:text-white relative">
              <GlobalMathBackground />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/courses" element={<VisibilityRoute feature="courses"><CoursesPage /></VisibilityRoute>} />
                <Route path="/subjects/:slug" element={<VisibilityRoute feature="books"><SubjectDetailPage /></VisibilityRoute>} />
                <Route path="/notes" element={<VisibilityRoute feature="notes"><NotesPage /></VisibilityRoute>} />
                <Route path="/lectures" element={<VisibilityRoute feature="lectures"><LecturesPage /></VisibilityRoute>} />
                <Route path="/books" element={<VisibilityRoute feature="books"><BooksPage /></VisibilityRoute>} />
                <Route path="/about" element={<VisibilityRoute feature="about"><AboutPage /></VisibilityRoute>} />
                <Route path="/updates" element={<VisibilityRoute feature="updates"><UpdatesPage /></VisibilityRoute>} />
                <Route path="/past-papers" element={<VisibilityRoute feature="past_papers"><PastPapersPage /></VisibilityRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Student Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <UserDashboard defaultTab="overview" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <UserDashboard defaultTab="profile" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <UserDashboard defaultTab="resources" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/videos"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <UserDashboard defaultTab="videos" />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/df-library" element={<ResourceLibraryPage />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ContentProvider>
      </SocketProvider>
    </DialogProvider>
  );
}

export default App;
