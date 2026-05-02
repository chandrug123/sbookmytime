import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import LocationForm from '../components/LocationForm';

const displayName = (user) => user.name || user.email.split('@')[0];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editLoc, setEditLoc] = useState(false);
  const [locForm, setLocForm] = useState(user.location || { state: '', district: '', taluk: '', village: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const saveLoc = async () => {
    setError(''); setSuccess('');
    if (!locForm.state || !locForm.district) {
      setError('State and district are required');
      return;
    }
    try {
      await api.put('/users/me/location', locForm);
      await refreshUser();
      setSuccess('Location updated!');
      setEditLoc(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  const loc = user.location;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
      </div>
      <div className="card profile-card">
        <div className="avatar large">{displayName(user)[0].toUpperCase()}</div>
        <h2>{displayName(user)}</h2>
        <span className={`role-tag ${user.role}`}>{user.role}</span>
        <div className="profile-details">
          <div className="detail-row"><span>Email</span><span>{user.email}</span></div>
          {user.name && <div className="detail-row"><span>Name</span><span>{user.name}</span></div>}
          <div className="detail-row"><span>Status</span><span>{user.is_active ? '✅ Active' : '❌ Inactive'}</span></div>
          <div className="detail-row"><span>Login Access</span><span>{user.has_password ? '✅ Yes' : '❌ No'}</span></div>
          <div className="detail-row"><span>Joined</span><span>{new Date(user.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="loc-header">
          <h3>📍 Location</h3>
          <button className="btn small" onClick={() => setEditLoc(!editLoc)}>
            {editLoc ? 'Cancel' : (loc ? 'Edit' : 'Add Location')}
          </button>
        </div>

        {error && <div className="alert error" style={{ marginTop: 12 }}>{error}</div>}
        {success && <div className="alert success" style={{ marginTop: 12 }}>{success}</div>}

        {editLoc ? (
          <div className="loc-edit-form">
            <LocationForm value={locForm} onChange={setLocForm} />
            <button className="btn primary" onClick={saveLoc}>Save Location</button>
          </div>
        ) : loc ? (
          <div className="profile-details">
            <div className="detail-row"><span>Country</span><span>🇮🇳 India</span></div>
            <div className="detail-row"><span>State</span><span>{loc.state}</span></div>
            <div className="detail-row"><span>District</span><span>{loc.district}</span></div>
            {loc.taluk && <div className="detail-row"><span>Taluk</span><span>{loc.taluk}</span></div>}
            {loc.village && <div className="detail-row"><span>Village</span><span>{loc.village}</span></div>}
          </div>
        ) : (
          <p style={{ marginTop: 12, color: 'var(--muted)' }}>No location set. Click "Add Location" to set yours.</p>
        )}
      </div>
    </div>
  );
}
