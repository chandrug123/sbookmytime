import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SVC_META = {
  car: { icon: '🚗', label: 'Car Service', color: '#4f46e5', bg: '#eef2ff' },
  bike: { icon: '🏍️', label: 'Bike Service', color: '#059669', bg: '#ecfdf5' },
};

function getTodayStatus(timings) {
  if (!timings) return null;
  const day = DAYS_FULL[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const t = timings[day];
  if (!t || t.closed) return { open: false, text: 'Closed today' };
  return { open: true, text: `${t.open} – ${t.close}` };
}

export default function SearchProviders() {
  const { type } = useParams();
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchScope, setSearchScope] = useState('taluk');
  const loc = user.location;
  const meta = SVC_META[type] || SVC_META.car;

  const doSearch = (scope) => {
    if (!loc) { setLoading(false); return; }
    setLoading(true);
    const params = { service: type, state: loc.state, district: loc.district };
    if (scope === 'taluk' && loc.taluk) params.taluk = loc.taluk;
    api.get('/providers/search', { params })
      .then(({ data }) => setProviders(data.providers))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { doSearch(searchScope); }, [type, searchScope]);

  if (!loc) {
    return (
      <div className="page">
        <div className="search-no-loc">
          <span className="search-no-loc-icon">📍</span>
          <h2>Set your location first</h2>
          <p>We need your location to find nearby providers.</p>
          <Link to="/member/location" className="btn primary">Set Location</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page search-page">
      <div className="search-header" style={{ '--sh-color': meta.color, '--sh-bg': meta.bg }}>
        <div className="search-header-top">
          <div className="search-svc-badge"><span>{meta.icon}</span><strong>{meta.label} Providers</strong></div>
        </div>
        <div className="search-loc-bar">
          <div className="search-loc-info">
            <span>📍</span>
            <div>
              <strong>{loc.taluk || loc.district}</strong>
              <small>{[loc.district, loc.state].filter(Boolean).join(', ')}</small>
            </div>
          </div>
          <Link to="/member/location" className="search-loc-change">Change</Link>
        </div>
        <div className="search-scope-info">
          Showing in <strong>{searchScope === 'taluk' && loc.taluk ? loc.taluk + ' taluk' : loc.district + ' district'}</strong>
        </div>
      </div>

      {loading ? (
        <div className="search-loading"><div className="search-spinner" /><p>Searching...</p></div>
      ) : providers.length === 0 ? (
        <div className="search-empty">
          <span className="search-empty-icon">🔍</span>
          <h3>No providers found</h3>
          <p>No verified providers in your {searchScope === 'taluk' ? 'taluk' : 'district'} yet.</p>
          {searchScope === 'taluk' && loc.taluk && (
            <button className="btn primary" onClick={() => setSearchScope('district')}>Search entire {loc.district} district</button>
          )}
        </div>
      ) : (
        <>
          <div className="search-count">{providers.length} provider{providers.length !== 1 ? 's' : ''} found</div>
          <div className="search-results">
            {providers.map(p => {
              const today = getTodayStatus(p.timings);
              return (
                <Link key={p.id} to={`/member/provider/${p.id}?service=${type}`} className="sr-card">
                  <div className="sr-top">
                    <div className="sr-name-wrap">
                      <h3>{p.shop_name}</h3>
                      <span className="sr-owner">{p.owner_name}</span>
                    </div>
                    <span className="sr-verified">✅</span>
                  </div>
                  <div className="sr-loc"><span>📍</span>{[p.taluk, p.district].filter(Boolean).join(', ')}</div>
                  {today && (
                    <span className={`sr-status ${today.open ? 'open' : 'closed'}`}>
                      {today.open ? '🟢' : '🔴'} {today.text}
                    </span>
                  )}
                  <div className="sr-services">
                    {p.services.map(s => <span key={s} className={`svc-mini ${s}`}>{s}</span>)}
                    <span className="sr-feat-count">{p.features.length} services</span>
                  </div>
                  <span className="sr-arrow">→</span>
                </Link>
              );
            })}
          </div>
          {searchScope === 'taluk' && loc.taluk && (
            <button className="btn small full" onClick={() => setSearchScope('district')} style={{ marginTop: 12 }}>
              Show more from {loc.district} district →
            </button>
          )}
        </>
      )}
    </div>
  );
}
