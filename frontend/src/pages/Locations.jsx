import { useState, useEffect } from 'react';
import api from '../api';

const displayName = (u) => u.name || u.email.split('@')[0];

export default function Locations() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ district: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/').then(({ data }) => setUsers(data.users)).catch(() => setError('Failed to load'));
  }, []);

  const withLoc = users.filter(u => u.location);
  const noLoc = users.filter(u => !u.location);
  const districts = [...new Set(withLoc.map(u => u.location.district))].sort();
  const filtered = filter.district ? withLoc.filter(u => u.location.district === filter.district) : withLoc;

  return (
    <div className="page">
      <div className="page-header">
        <h1>📍 Locations</h1>
        <div className="header-actions">
          <span className="badge">{withLoc.length} mapped</span>
          <span className="badge">{noLoc.length} unmapped</span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card filter-bar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Filter by District</label>
          <select value={filter.district} onChange={e => setFilter({ district: e.target.value })}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>State</th>
              <th>District</th>
              <th>Taluk</th>
              <th>Village</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="table-user">
                    <div className="avatar small">{displayName(u)[0].toUpperCase()}</div>
                    <div>
                      <strong>{displayName(u)}</strong>
                      <small className="table-email">{u.email}</small>
                    </div>
                  </div>
                </td>
                <td>{u.location.state}</td>
                <td>{u.location.district}</td>
                <td>{u.location.taluk || '—'}</td>
                <td>{u.location.village || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-user-list">
        {filtered.map(u => (
          <div key={u.id} className="card user-card">
            <div className="user-info">
              <div className="avatar">{displayName(u)[0].toUpperCase()}</div>
              <div>
                <strong>{displayName(u)}</strong>
                <small>{u.location.district}, {u.location.state}</small>
                {u.location.taluk && <small>Taluk: {u.location.taluk}</small>}
                {u.location.village && <small>Village: {u.location.village}</small>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card"><p style={{ textAlign: 'center' }}>No users found</p></div>
        )}
      </div>

      {noLoc.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12, color: 'var(--muted)', fontSize: 14 }}>Users without location ({noLoc.length})</h3>
          <div className="mobile-user-list">
            {noLoc.map(u => (
              <div key={u.id} className="card user-card">
                <div className="user-info">
                  <div className="avatar">{displayName(u)[0].toUpperCase()}</div>
                  <div>
                    <strong>{displayName(u)}</strong>
                    <small className="text-muted">No location set</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
