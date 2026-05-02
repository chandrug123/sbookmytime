import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ email: '', phone: '', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { email: form.email, phone: form.phone, name: form.name });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1>You're Registered!</h1>
          <p className="subtitle" style={{ marginBottom: 16 }}>
            Your account has been created as a member. An admin will manage your access.
          </p>
          <Link to="/login" className="btn primary full">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join as Member</h1>
        <p className="subtitle">Register with your email — no password needed</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} required placeholder="your@email.com" />
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input type="tel" value={form.phone} onChange={update('phone')} required placeholder="+91 9876543210" />
          </div>
          <div className="field">
            <label>Name (optional)</label>
            <input type="text" value={form.name} onChange={update('name')} placeholder="Your name" />
          </div>
          <div className="info-box" style={{ marginBottom: 16 }}>
            🔒 Member accounts are managed by admin. No password required.
          </div>
          <button type="submit" className="btn primary full">Register</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
