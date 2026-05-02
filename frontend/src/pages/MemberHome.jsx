import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const displayName = (user) => user.name || user.email.split('@')[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function MemberHome() {
  const { user } = useAuth();
  const loc = user.location;

  return (
    <div className="page member-home">
      <div className="m-welcome">
        <div className="m-welcome-avatar">{displayName(user)[0].toUpperCase()}</div>
        <div>
          <p className="m-greeting">{getGreeting()} 👋</p>
          <h1 className="m-name">{displayName(user)}</h1>
          {user.phone && <p className="m-phone">📞 {user.phone}</p>}
        </div>
      </div>

      {loc ? (
        <div className="m-loc-card">
          <div className="m-loc-icon">📍</div>
          <div className="m-loc-info">
            <strong>{loc.village || loc.taluk || loc.district}</strong>
            <span>{[loc.taluk, loc.district, loc.state].filter(Boolean).join(', ')}</span>
          </div>
          <Link to="/member/location" className="m-loc-edit">Edit</Link>
        </div>
      ) : (
        <Link to="/member/location" className="m-setup-card">
          <div className="m-setup-icon">📍</div>
          <div>
            <strong>Set up your location</strong>
            <span>Tap here to add your state, district & village</span>
          </div>
          <span className="m-setup-arrow">→</span>
        </Link>
      )}

      <h3 className="m-section-title">Find a Service Provider</h3>
      <div className="m-search-grid">
        <Link to="/member/search/car" className="m-search-card m-search-car">
          <span className="m-search-icon">🚗</span>
          <div>
            <strong>Car Service</strong>
            <small>Find nearby car workshops</small>
          </div>
          <span className="m-search-arrow">→</span>
        </Link>
        <Link to="/member/search/bike" className="m-search-card m-search-bike">
          <span className="m-search-icon">🏍️</span>
          <div>
            <strong>Bike Service</strong>
            <small>Find nearby bike workshops</small>
          </div>
          <span className="m-search-arrow">→</span>
        </Link>
      </div>

      <div className="m-quick-grid">
        <Link to="/member/search/car" className="m-quick-item">
          <span className="m-quick-icon">🚗</span>
          <span>Car</span>
        </Link>
        <Link to="/member/search/bike" className="m-quick-item">
          <span className="m-quick-icon">🏍️</span>
          <span>Bike</span>
        </Link>
        <Link to="/member/location" className="m-quick-item">
          <span className="m-quick-icon">🗺️</span>
          <span>Location</span>
        </Link>
        <Link to="/member/profile" className="m-quick-item">
          <span className="m-quick-icon">👤</span>
          <span>Profile</span>
        </Link>
      </div>

      <div className="m-info-card">
        <span>ℹ️</span>
        <p>Your account is managed by the admin. If you need any changes, please contact them.</p>
      </div>
    </div>
  );
}
