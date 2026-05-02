import { useState, useEffect } from 'react';
import api from '../api';

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState({ name: '', service_type: 'car' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/features/').then(({ data }) => setFeatures(data.features)).catch(() => setError('Failed to load'));
  useEffect(() => { load(); }, []);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const create = async (e) => {
    e.preventDefault();
    clearMsg();
    if (!form.name.trim()) { setError('Feature name is required'); return; }
    try {
      await api.post('/features/', form);
      setSuccess('Feature added!');
      setForm({ name: '', service_type: form.service_type });
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Create failed');
    }
  };

  const update = async (id) => {
    clearMsg();
    try {
      await api.put(`/features/${id}`, editForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this feature?')) return;
    clearMsg();
    try {
      await api.delete(`/features/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Delete failed');
    }
  };

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ name: f.name, service_type: f.service_type }); };

  const filtered = filter === 'all' ? features : features.filter(f => f.service_type === filter);
  const carCount = features.filter(f => f.service_type === 'car').length;
  const bikeCount = features.filter(f => f.service_type === 'bike').length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔧 Service Features</h1>
        <span className="badge">{features.length} total</span>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="card create-form">
        <h3>Add New Feature</h3>
        <form onSubmit={create} className="form-row" style={{ alignItems: 'flex-end', gap: 12 }}>
          <div className="field grow">
            <label>Feature Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wheel Alignment" />
          </div>
          <div className="field">
            <label>Service Type</label>
            <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
              <option value="car">🚗 Car</option>
              <option value="bike">🏍️ Bike</option>
            </select>
          </div>
          <button type="submit" className="btn primary form-btn">Add</button>
        </form>
      </div>

      <div className="feat-filter">
        <button className={`feat-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({features.length})</button>
        <button className={`feat-tab ${filter === 'car' ? 'active' : ''}`} onClick={() => setFilter('car')}>🚗 Car ({carCount})</button>
        <button className={`feat-tab ${filter === 'bike' ? 'active' : ''}`} onClick={() => setFilter('bike')}>🏍️ Bike ({bikeCount})</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id}>
                <td>
                  {editingId === f.id ? (
                    <input className="inline-input wide" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  ) : (
                    <strong>{f.name}</strong>
                  )}
                </td>
                <td>
                  {editingId === f.id ? (
                    <select className="inline-input" value={editForm.service_type} onChange={e => setEditForm({ ...editForm, service_type: e.target.value })}>
                      <option value="car">Car</option>
                      <option value="bike">Bike</option>
                    </select>
                  ) : (
                    <span className={`svc-mini ${f.service_type}`}>{f.service_type}</span>
                  )}
                </td>
                <td>
                  {editingId === f.id ? (
                    <div className="table-actions">
                      <button className="btn small primary" onClick={() => update(f.id)}>Save</button>
                      <button className="btn small" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button className="btn small" onClick={() => startEdit(f)}>Edit</button>
                      <button className="btn small danger" onClick={() => remove(f.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-user-list">
        {filtered.map(f => (
          <div key={f.id} className="card feat-mobile-card">
            {editingId === f.id ? (
              <div className="edit-panel">
                <input className="inline-input wide" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <select className="inline-input" value={editForm.service_type} onChange={e => setEditForm({ ...editForm, service_type: e.target.value })}>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                </select>
                <button className="btn small primary" onClick={() => update(f.id)}>Save</button>
                <button className="btn small" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="feat-mobile-row">
                <div>
                  <strong>{f.name}</strong>
                  <span className={`svc-mini ${f.service_type}`}>{f.service_type}</span>
                </div>
                <div className="table-actions">
                  <button className="btn small" onClick={() => startEdit(f)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(f.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
