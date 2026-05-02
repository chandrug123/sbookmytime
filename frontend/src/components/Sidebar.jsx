import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const displayName = (user) => user.name || user.email.split('@')[0];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const isMember = user.role === 'member';

  const links = isMember ? [
    { to: '/member/home', icon: '🏠', label: 'Home', show: true },
    { to: '/member/services', icon: '🔧', label: 'Services', show: true },
    { to: '/member/location', icon: '📍', label: 'Location', show: true },
    { to: '/member/profile', icon: '👤', label: 'Profile', show: true },
  ] : [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard', show: true },
    { to: '/users', icon: '👥', label: 'Users', show: hasRole('admin', 'manager') },
    { to: '/roles', icon: '🔑', label: 'Roles', show: hasRole('admin') },
    { to: '/features', icon: '🔧', label: 'Features', show: hasRole('admin') },
    { to: '/locations', icon: '📍', label: 'Locations', show: hasRole('admin', 'manager') },
    { to: '/providers', icon: '🏠', label: 'Providers', show: hasRole('admin', 'manager') },
    { to: '/providers/new', icon: '➕', label: 'Add Provider', show: hasRole('admin') },
    { to: '/profile', icon: '👤', label: 'Profile', show: true },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${isMember ? 'sidebar-member' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">BookingApp</span>
        </div>
        <div className="sidebar-user">
          <div className={`avatar ${isMember ? 'avatar-member' : ''}`}>{displayName(user)[0].toUpperCase()}</div>
          <div>
            <strong>{displayName(user)}</strong>
            {!isMember && <span className={`role-tag ${user.role}`}>{user.role}</span>}
            {isMember && <small className="sidebar-email">{user.email}</small>}
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.filter(l => l.show).map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="sidebar-link logout-btn">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {links.filter(l => l.show).map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
        <button onClick={handleLogout} className="nav-item nav-btn">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
