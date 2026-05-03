import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const roleBadge = { admin: '🔴', manager: '🟡', user: '🟢', member: '🔵' };
const displayName = (user) => user.name || user.email.split('@')[0];

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({ users: 0, roles: 0, providers: 0, totalVisits: 0 });

  useEffect(() => {
    if (hasRole('admin', 'manager')) {
      api.get('/users/').then(({ data }) => setStats(s => ({ ...s, users: data.users.length }))).catch(() => {});
      api.get('/providers/').then(({ data }) => {
        const provs = data.providers;
        setStats(s => ({ ...s, providers: provs.length }));
        if (hasRole('admin', 'manager')) {
          const year = new Date().getFullYear();
          Promise.all(
            provs.filter(u => u.provider).map(u => api.get(`/providers/${u.provider.id}/visits?year=${year}`).catch(() => ({ data: { total: 0 } })))
          ).then(results => {
            const total = results.reduce((sum, r) => sum + (r.data?.total || 0), 0);
            setStats(s => ({ ...s, totalVisits: total }));
          });
        }
      }).catch(() => {});
    }
    api.get('/roles/').then(({ data }) => setStats(s => ({ ...s, roles: data.roles.length }))).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="badge">{roleBadge[user.role] || '⚪'} {user.role}</span>
      </div>

      <div className="card welcome-card">
        <h3>Welcome back, {displayName(user)}!</h3>
        <p>You are logged in as <strong>{user.role}</strong>.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat">
          <span className="stat-icon">📧</span>
          <div><small>Email</small><p>{user.email}</p></div>
        </div>
        <div className="card stat">
          <span className="stat-icon">📅</span>
          <div><small>Joined</small><p>{new Date(user.created_at).toLocaleDateString()}</p></div>
        </div>
        {hasRole('admin', 'manager') && (
          <div className="card stat">
            <span className="stat-icon">👥</span>
            <div><small>Total Users</small><p>{stats.users}</p></div>
          </div>
        )}
        {hasRole('admin', 'manager') && (
          <div className="card stat">
            <span className="stat-icon">🏪</span>
            <div><small>Providers</small><p>{stats.providers}</p></div>
          </div>
        )}
        {hasRole('admin', 'manager') && (
          <div className="card stat">
            <span className="stat-icon">👁️</span>
            <div><small>Page Visits ({new Date().getFullYear()})</small><p>{stats.totalVisits}</p></div>
          </div>
        )}
        <div className="card stat">
          <span className="stat-icon">🔑</span>
          <div><small>Roles</small><p>{stats.roles}</p></div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="card highlight">
          <h3>🛡️ Admin Access</h3>
          <p>Full control — manage users, create roles, and configure the system.</p>
        </div>
      )}
      {user.role === 'manager' && (
        <div className="card highlight">
          <h3>📋 Manager Access</h3>
          <p>You can view and manage users in the system.</p>
        </div>
      )}
    </div>
  );
}
