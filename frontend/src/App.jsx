import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import MemberLogin from './pages/MemberLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Features from './pages/Features';
import Locations from './pages/Locations';
import Providers from './pages/Providers';
import Profile from './pages/Profile';
import MemberHome from './pages/MemberHome';
import MyLocation from './pages/MyLocation';
import MemberProfile from './pages/MemberProfile';
import Services from './pages/Services';
import ProviderRegister from './pages/ProviderRegister';
import './index.css';

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'member' ? '/member/home' : '/dashboard'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Sidebar />
          <main className="app-content">
            <Routes>
              <Route path="/login" element={<Landing />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              <Route path="/login/member" element={<MemberLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/provider" element={<ProviderRegister />} />
              {/* Member routes */}
              <Route path="/member/home" element={<ProtectedRoute roles={['member']}><MemberHome /></ProtectedRoute>} />
              <Route path="/member/services" element={<ProtectedRoute roles={['member']}><Services /></ProtectedRoute>} />
              <Route path="/member/location" element={<ProtectedRoute roles={['member']}><MyLocation /></ProtectedRoute>} />
              <Route path="/member/profile" element={<ProtectedRoute roles={['member']}><MemberProfile /></ProtectedRoute>} />
              {/* Staff routes */}
              <Route path="/dashboard" element={<ProtectedRoute roles={['admin', 'manager', 'user']}><Dashboard /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute roles={['admin', 'manager']}><Users /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute roles={['admin']}><Roles /></ProtectedRoute>} />
              <Route path="/features" element={<ProtectedRoute roles={['admin']}><Features /></ProtectedRoute>} />
              <Route path="/locations" element={<ProtectedRoute roles={['admin', 'manager']}><Locations /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute roles={['admin', 'manager']}><Providers /></ProtectedRoute>} />
              <Route path="/providers/new" element={<ProtectedRoute roles={['admin']}><ProviderRegister embedded /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute roles={['admin', 'manager', 'user']}><Profile /></ProtectedRoute>} />
              <Route path="*" element={<DefaultRedirect />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
