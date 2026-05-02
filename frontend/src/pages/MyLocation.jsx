import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import LocationForm from '../components/LocationForm';

export default function MyLocation() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!user.location);
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
      setSuccess('Location saved!');
      setEditing(false);
      setTimeout(() => navigate('/member/services'), 800);
    } catch (err) {
      setError(err.response?.data?.msg || 'Save failed');
    }
  };

  const loc = user.location;

  return (
    <div className="page">
      <div className="page-header">
        <h1>📍 My Location</h1>
        {loc && !editing && (
          <button className="btn small" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {editing ? (
        <div className="card">
          <h3>{loc ? 'Update your location' : 'Set your location'}</h3>
          <div className="loc-edit-form">
            <LocationForm value={locForm} onChange={setLocForm} />
            <div className="member-actions">
              <button className="btn primary" onClick={saveLoc}>Save Location</button>
              {loc && <button className="btn small" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </div>
        </div>
      ) : loc ? (
        <div className="card">
          <div className="loc-display">
            <div className="loc-row"><span>🇮🇳</span><span>India</span></div>
            <div className="loc-row"><span>State</span><strong>{loc.state}</strong></div>
            <div className="loc-row"><span>District</span><strong>{loc.district}</strong></div>
            {loc.taluk && <div className="loc-row"><span>Taluk</span><strong>{loc.taluk}</strong></div>}
            {loc.village && <div className="loc-row"><span>Village</span><strong>{loc.village}</strong></div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
