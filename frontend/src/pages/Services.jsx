import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVICES = [
  {
    id: 'car',
    label: 'Car Service',
    desc: 'Complete car care — from routine checkups to full servicing',
    color: '#0f766e',
    bg: '#f0fdfa',
    tags: ['Oil Change', 'AC Service', 'Wash & Polish'],
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="svc-svg">
        <rect x="6" y="24" width="52" height="20" rx="6" fill="#0f766e" opacity="0.15"/>
        <rect x="10" y="18" width="44" height="22" rx="5" fill="#0f766e"/>
        <rect x="14" y="22" width="14" height="10" rx="2" fill="#99f6e4"/>
        <rect x="36" y="22" width="14" height="10" rx="2" fill="#99f6e4"/>
        <circle cx="18" cy="44" r="5" fill="#134e4a" stroke="#0f766e" strokeWidth="2"/>
        <circle cx="46" cy="44" r="5" fill="#134e4a" stroke="#0f766e" strokeWidth="2"/>
        <circle cx="18" cy="44" r="2" fill="#99f6e4"/>
        <circle cx="46" cy="44" r="2" fill="#99f6e4"/>
        <rect x="4" y="36" width="56" height="6" rx="3" fill="#0f766e" opacity="0.9"/>
        <rect x="2" y="34" width="8" height="4" rx="2" fill="#fbbf24"/>
        <rect x="54" y="34" width="8" height="4" rx="2" fill="#dc2626"/>
      </svg>
    ),
  },
  {
    id: 'bike',
    label: 'Bike Service',
    desc: 'Keep your ride smooth — expert two-wheeler maintenance',
    color: '#b45309',
    bg: '#fffbeb',
    tags: ['Engine Tune-up', 'Chain & Brake', 'Full Service'],
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="svc-svg">
        <circle cx="16" cy="42" r="10" fill="#059669" opacity="0.15"/>
        <circle cx="48" cy="42" r="10" fill="#059669" opacity="0.15"/>
        <circle cx="16" cy="42" r="7" stroke="#059669" strokeWidth="2.5" fill="none"/>
        <circle cx="48" cy="42" r="7" stroke="#059669" strokeWidth="2.5" fill="none"/>
        <circle cx="16" cy="42" r="2" fill="#059669"/>
        <circle cx="48" cy="42" r="2" fill="#059669"/>
        <path d="M16 42 L28 22 L38 22 L48 42" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 22 L32 14 L42 14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M38 22 L36 30 L28 34 L16 42" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <rect x="30" y="12" width="14" height="4" rx="2" fill="#059669"/>
        <circle cx="32" cy="14" r="3" fill="#6ee7b7"/>
      </svg>
    ),
  },
];

const SERVICE_SIMPLE = {
  car: { icon: '🚗', label: 'Car Service' },
  bike: { icon: '🏍️', label: 'Bike Service' },
};

export { SERVICE_SIMPLE };

export default function Services() {
  const [selected, setSelected] = useState(localStorage.getItem('selected_service') || '');
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (id) => {
    setSelected(id);
    setConfirmed(false);
  };

  const handleConfirm = () => {
    localStorage.setItem('selected_service', selected);
    setConfirmed(true);
    setTimeout(() => navigate(`/member/search/${selected}`), 1000);
  };

  const sel = SERVICES.find(s => s.id === selected);

  return (
    <div className="page svc-page">
      <div className="page-header">
        <h1>Select Service</h1>
      </div>
      <p className="svc-subtitle">What would you like to get serviced?</p>

      {confirmed && (
        <div className="alert success">✅ {sel?.label} selected! Redirecting...</div>
      )}

      <div className="svc-grid">
        {SERVICES.map(s => (
          <button
            key={s.id}
            className={`svc-card ${selected === s.id ? 'selected' : ''}`}
            onClick={() => handleSelect(s.id)}
            style={{ '--svc-color': s.color, '--svc-bg': s.bg }}
          >
            {selected === s.id && <span className="svc-check">✓</span>}
            <div className="svc-icon-wrap">{s.svg}</div>
            <strong className="svc-label">{s.label}</strong>
            <span className="svc-desc">{s.desc}</span>
            <div className="svc-tags">
              {s.tags.map(t => <span key={t} className="svc-tag">{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      {selected && !confirmed && (
        <button
          className="btn primary full svc-confirm"
          onClick={handleConfirm}
          style={{ background: sel?.color }}
        >
          Continue with {sel?.label}
        </button>
      )}
    </div>
  );
}
