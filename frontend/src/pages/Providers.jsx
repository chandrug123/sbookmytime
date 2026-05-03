import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Providers() {
  const { hasRole } = useAuth();
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState('');

  const load = () => api.get('/providers/').then(({ data }) => setProviders(data.providers)).catch(() => setError('Failed to load'));

  useEffect(() => { load(); }, []);

  const toggleVerify = async (p) => {
    try {
      await api.put(`/providers/${p.provider.id}`, { is_verified: !p.provider.is_verified });
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏪 Service Providers</h1>
        <span className="badge">{providers.length} total</span>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Shop</th>
              <th>Owner</th>
              <th>WhatsApp</th>
              <th>Location</th>
              <th>Services</th>
              <th>Features</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(u => {
              const p = u.provider;
              if (!p) return null;
              return (
                <tr key={u.id}>
                  <td><strong>{p.shop_name}</strong></td>
                  <td>
                    <div>{u.name}</div>
                    <small className="table-email">{u.email}</small>
                  </td>
                  <td><a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,'')}`} className="wa-link">{p.whatsapp}</a></td>
                  <td><span className="text-muted">{[p.taluk, p.district, p.state].filter(Boolean).join(', ')}</span></td>
                  <td>{p.services.map(s => <span key={s} className={`svc-mini ${s}`}>{s}</span>)}</td>
                  <td><span className="text-muted">{p.features.length} selected</span></td>
                  <td><span className={`status-dot ${p.is_verified ? 'active' : 'inactive'}`}>{p.is_verified ? 'Verified' : 'Pending'}</span></td>
                  <td className="table-actions">
                    <Link to={`/providers/${p.id}/detail`} className="btn small primary">View</Link>
                    {hasRole('admin') && (
                      <button className={`btn small ${p.is_verified ? 'danger' : ''}`} onClick={() => toggleVerify(u)}>
                        {p.is_verified ? 'Revoke' : 'Verify'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-user-list">
        {providers.map(u => {
          const p = u.provider;
          if (!p) return null;
          return (
            <div key={u.id} className="card prov-mobile-card">
              <div className="prov-mobile-header">
                <div>
                  <strong>{p.shop_name}</strong>
                  <small>{u.name} · {u.email}</small>
                </div>
                <span className={`status-dot ${p.is_verified ? 'active' : 'inactive'}`}>{p.is_verified ? '✅' : '⏳'}</span>
              </div>
              <div className="prov-mobile-row">
                <span>📱 <a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,'')}`} className="wa-link">{p.whatsapp}</a></span>
              </div>
              <div className="prov-mobile-row">
                <span>📍 {[p.address, p.taluk, p.district].filter(Boolean).join(', ')}</span>
              </div>
              <div className="prov-mobile-row">
                {p.services.map(s => <span key={s} className={`svc-mini ${s}`}>{s}</span>)}
              </div>
              {p.features.length > 0 && (
                <div className="prov-mobile-features">
                  {p.features.map(f => <span key={f} className="prov-feat-chip selected small">{f}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Link to={`/providers/${p.id}/detail`} className="btn small primary" style={{ flex: 1 }}>View Details</Link>
                {hasRole('admin') && (
                  <button className={`btn small ${p.is_verified ? 'danger' : ''}`} onClick={() => toggleVerify(u)} style={{ flex: 1 }}>
                    {p.is_verified ? 'Revoke' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
