import { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { name: '', description: '' };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => api.get('/roles/').then(({ data }) => setRoles(data.roles)).catch(() => setError('Failed to load'));

  useEffect(() => { load(); }, []);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const createRole = async (e) => {
    e.preventDefault();
    clearMsg();
    try {
      await api.post('/roles/', form);
      setSuccess('Role created!');
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Create failed');
    }
  };

  const updateRole = async (id) => {
    clearMsg();
    try {
      await api.put(`/roles/${id}`, editForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  const deleteRole = async (id) => {
    if (!confirm('Delete this role?')) return;
    clearMsg();
    try {
      await api.delete(`/roles/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Delete failed');
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({ name: r.name, description: r.description });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Roles</h1>
        <span className="badge">{roles.length} total</span>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="card create-form">
        <h3>Create New Role</h3>
        <form onSubmit={createRole} className="form-row">
          <div className="field">
            <label>Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. editor" />
          </div>
          <div className="field grow">
            <label>Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What can this role do?" />
          </div>
          <button type="submit" className="btn primary form-btn">Create</button>
        </form>
      </div>

      {/* Desktop Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Description</th>
              <th>Type</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td>
                  {editingId === r.id ? (
                    <input className="inline-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  ) : (
                    <span className={`role-tag ${r.name}`}>{r.name}</span>
                  )}
                </td>
                <td>
                  {editingId === r.id ? (
                    <input className="inline-input wide" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  ) : (
                    <span className="text-muted">{r.description || '—'}</span>
                  )}
                </td>
                <td>{r.is_system ? <span className="badge system">System</span> : <span className="badge custom">Custom</span>}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  {r.is_system ? (
                    <span className="text-muted">—</span>
                  ) : editingId === r.id ? (
                    <div className="table-actions">
                      <button className="btn small primary" onClick={() => updateRole(r.id)}>Save</button>
                      <button className="btn small" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button className="btn small" onClick={() => startEdit(r)}>Edit</button>
                      <button className="btn small danger" onClick={() => deleteRole(r.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-user-list">
        {roles.map(r => (
          <div key={r.id} className="card role-card">
            <div className="role-header">
              <span className={`role-tag ${r.name}`}>{r.name}</span>
              {r.is_system ? <span className="badge system">System</span> : <span className="badge custom">Custom</span>}
            </div>
            <p>{r.description || 'No description'}</p>
            {!r.is_system && (
              editingId === r.id ? (
                <div className="edit-panel">
                  <input className="inline-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                  <input className="inline-input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                  <button className="btn small primary" onClick={() => updateRole(r.id)}>Save</button>
                  <button className="btn small" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="edit-panel">
                  <button className="btn small" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn small danger" onClick={() => deleteRole(r.id)}>Delete</button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
