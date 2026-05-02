import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import LocationForm from '../components/LocationForm';

const emptyForm = { email: '', phone: '', name: '', password: '', role: 'member' };
const emptyLoc = { state: '', district: '', taluk: '', village: '' };
const displayName = (u) => u.name || u.email.split('@')[0];
const isMemberRole = (role) => role === 'member';

export default function Users() {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [locForm, setLocForm] = useState(emptyLoc);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.get('/users/').then(({ data }) => setUsers(data.users)).catch(() => setError('Failed to load users'));
    api.get('/roles/').then(({ data }) => setRoles(data.roles)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const createUser = async (e) => {
    e.preventDefault();
    clearMsg();
    const payload = { email: form.email, phone: form.phone, name: form.name, role: form.role };
    if (!isMemberRole(form.role) && form.password) payload.password = form.password;
    if (locForm.state && locForm.district) payload.location = locForm;
    try {
      await api.post('/users/', payload);
      setSuccess('User created!');
      setForm(emptyForm);
      setLocForm(emptyLoc);
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Create failed');
    }
  };

  const updateUser = async (id, updates) => {
    clearMsg();
    try {
      await api.put(`/users/${id}`, updates);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    clearMsg();
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Delete failed');
    }
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const locLabel = (loc) => {
    if (!loc) return '—';
    const parts = [loc.village, loc.taluk, loc.district, loc.state].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <div className="header-actions">
          <span className="badge">{users.length} total</span>
          {hasRole('admin') && (
            <button className="btn primary small" onClick={() => { setShowCreate(!showCreate); clearMsg(); }}>
              {showCreate ? '✕ Cancel' : '+ Create User'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showCreate && (
        <div className="card create-form">
          <h3>Create New User</h3>
          <form onSubmit={createUser} className="form-grid">
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 9876543210" />
            </div>
            <div className="field">
              <label>Name (optional)</label>
              <input type="text" value={form.name} onChange={update('name')} placeholder="Display name" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={update('role')}>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            {!isMemberRole(form.role) && (
              <div className="field">
                <label>Password</label>
                <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
              </div>
            )}
            {isMemberRole(form.role) && (
              <div className="field">
                <div className="info-box">🔒 Members don't need a password — they are managed by admin.</div>
              </div>
            )}
            <div className="field full-span">
              <div className="section-label">📍 Location (optional)</div>
            </div>
            <LocationForm value={locForm} onChange={setLocForm} />
            <div className="field full-span">
              <button type="submit" className="btn primary">Create User</button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Location</th>
              <th>Login</th>
              <th>Status</th>
              <th>Joined</th>
              {hasRole('admin') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={!u.is_active ? 'row-disabled' : ''}>
                <td>
                  <div className="table-user">
                    <div className="avatar small">{displayName(u)[0].toUpperCase()}</div>
                    <div>
                      <strong>{displayName(u)}</strong>
                      <small className="table-email">{u.email}</small>
                    </div>
                  </div>
                </td>
                <td>{u.phone || '—'}</td>
                <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                <td><span className="text-muted loc-cell">{locLabel(u.location)}</span></td>
                <td><span className={`status-dot ${u.has_password ? 'active' : 'inactive'}`}>{u.has_password ? 'Yes' : 'No'}</span></td>
                <td><span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                {hasRole('admin') && (
                  <td>
                    {u.id !== currentUser.id && (
                      editing === u.id ? (
                        <div className="table-actions">
                          <select defaultValue={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                          <button className="btn small" onClick={() => updateUser(u.id, { is_active: !u.is_active })}>
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn small danger" onClick={() => deleteUser(u.id)}>Delete</button>
                          <button className="btn small" onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn small" onClick={() => setEditing(u.id)}>Edit</button>
                      )
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-user-list">
        {users.map(u => (
          <div key={u.id} className={`card user-card ${!u.is_active ? 'disabled' : ''}`}>
            <div className="user-info">
              <div className="avatar">{displayName(u)[0].toUpperCase()}</div>
              <div>
                <strong>{displayName(u)}</strong>
                <small>{u.email}{u.phone ? ` · ${u.phone}` : ''}</small>
                <div>
                  <span className={`role-tag ${u.role}`}>{u.role}</span>
                  <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}> {u.is_active ? 'Active' : 'Disabled'}</span>
                </div>
                {u.location && <small className="loc-text">📍 {locLabel(u.location)}</small>}
              </div>
            </div>
            {hasRole('admin') && u.id !== currentUser.id && (
              <div className="user-actions">
                {editing === u.id ? (
                  <div className="edit-panel">
                    <select defaultValue={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}>
                      {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button className="btn small" onClick={() => updateUser(u.id, { is_active: !u.is_active })}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn small danger" onClick={() => deleteUser(u.id)}>Delete</button>
                    <button className="btn small" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn small" onClick={() => setEditing(u.id)}>Edit</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
