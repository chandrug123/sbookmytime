import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="auth-page">
      <div className="auth-card landing-card">
        <div className="landing-brand">⚡</div>
        <h1>BookingApp</h1>
        <p className="subtitle">Choose how you want to sign in</p>
        <div className="landing-options">
          <Link to="/login/admin" className="landing-option admin-option">
            <span className="option-icon">🛡️</span>
            <div>
              <strong>Admin / Staff</strong>
              <small>Login with email & password</small>
            </div>
          </Link>
          <Link to="/login/member" className="landing-option member-option">
            <span className="option-icon">👤</span>
            <div>
              <strong>Member</strong>
              <small>Login with email only</small>
            </div>
          </Link>
        </div>
        <div className="landing-divider"><span>or</span></div>
        <div className="landing-options">
          <Link to="/register/provider" className="landing-option provider-option">
            <span className="option-icon">🏪</span>
            <div>
              <strong>Register Your Shop</strong>
              <small>Car & bike service provider registration</small>
            </div>
          </Link>
        </div>
        <p className="auth-link">New member? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}
