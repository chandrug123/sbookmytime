import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const displayName = (user) => user.name || user.email.split('@')[0];

export default function MemberProfile() {
  const { user } = useAuth();
  const loc = user.location;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="card profile-card">
        <div className="avatar large">{displayName(user)[0].toUpperCase()}</div>
        <h2>{displayName(user)}</h2>
        <small className="text-muted">{user.email}</small>
        <div className="profile-details">
          {user.name && <div className="detail-row"><span>Name</span><span>{user.name}</span></div>}
          <div className="detail-row"><span>Email</span><span>{user.email}</span></div>
          {user.phone && <div className="detail-row"><span>Phone</span><span>{user.phone}</span></div>}
          <div className="detail-row">
            <span>Location</span>
            {loc ? (
              <span>{[loc.village, loc.taluk, loc.district].filter(Boolean).join(', ')}</span>
            ) : (
              <Link to="/member/location" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Set location →</Link>
            )}
          </div>
        </div>
      </div>

      <div className="m-info-card">
        <span>ℹ️</span>
        <p>Need to update your details? Contact your admin.</p>
      </div>
    </div>
  );
}
