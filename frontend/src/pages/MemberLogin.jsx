import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { memberLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await memberLogin(email);
      navigate('/member/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="back-link">← Back</Link>
        <h1>👤 Member Login</h1>
        <p className="subtitle">Sign in with your email — no password needed</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="your@email.com" />
          </div>
          <button type="submit" className="btn primary full">Sign In</button>
        </form>
        <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}
