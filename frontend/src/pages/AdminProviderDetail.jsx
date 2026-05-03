import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import INDIA_DATA from '../indiaData';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SVC_ICON = { car: '🚗', bike: '🏍️' };

export default function AdminProviderDetail() {
  const { pid } = useParams();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState(null); // 'info' | 'owner' | 'services' | 'timings' | 'pricing'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [allFeatures, setAllFeatures] = useState({});

  const load = (y) => {
    setLoading(true);
    api.get(`/providers/${pid}/admin-detail?year=${y}`)
      .then(({ data }) => setProvider(data.provider))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(year); }, [pid, year]);
  useEffect(() => {
    api.get('/providers/features').then(({ data }) => setAllFeatures(data.features || {})).catch(() => {});
  }, []);

  const flash = (setter, text) => { setter(text); setTimeout(() => setter(''), 3000); };

  const save = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/providers/${pid}`, payload);
      setEditing(null);
      flash(setMsg, 'Saved successfully');
      load(year);
    } catch (err) {
      flash(setError, err.response?.data?.msg || 'Save failed');
    } finally { setSaving(false); }
  };

  const startEdit = (section) => {
    if (!isAdmin) return;
    if (section === 'info') {
      setForm({
        shop_name: provider.shop_name,
        whatsapp: provider.whatsapp,
        address: provider.address,
        state: provider.state,
        district: provider.district,
        taluk: provider.taluk,
        pincode: provider.pincode,
      });
    } else if (section === 'owner') {
      setForm({
        owner_name: provider.owner_name,
        owner_email: provider.owner_email,
        owner_phone: provider.owner_phone || '',
      });
    } else if (section === 'services') {
      setForm({
        services: [...provider.services],
        features: [...provider.features],
      });
    } else if (section === 'timings') {
      const t = {};
      DAYS_FULL.forEach(d => {
        const existing = provider.timings?.[d];
        t[d] = existing ? { ...existing } : { closed: true, open: '09:00', close: '18:00' };
      });
      setForm({ timings: t });
    } else if (section === 'pricing') {
      const p = {};
      provider.features.forEach(f => {
        const existing = provider.pricing?.[f] || {};
        p[f] = { consulting: existing.consulting || '', from: existing.from || '', to: existing.to || '' };
      });
      setForm({ pricing: p, show_prices: provider.show_prices });
    }
    setEditing(section);
  };

  const cancelEdit = () => { setEditing(null); setForm({}); };

  const toggleVerify = async () => {
    await save({ is_verified: !provider.is_verified });
  };

  if (loading) return <div className="page"><div className="search-loading"><div className="search-spinner" /><p>Loading...</p></div></div>;
  if (!provider) return <div className="page"><div className="search-empty"><h3>Provider not found</h3><Link to="/providers" className="btn primary">Back to Providers</Link></div></div>;

  const visits = provider.visits;
  const maxCount = Math.max(...visits.monthly.map(m => m.count), 1);
  const districts = INDIA_DATA.districts[form.state] || [];
  const taluks = INDIA_DATA.taluks[form.district] || [];

  // Available features based on selected services
  const availableFeatures = (form.services || []).flatMap(s => allFeatures[s] || []);

  return (
    <div className="page apd-page">
      <Link to="/providers" className="back-link">← Back to Providers</Link>

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Hero */}
      <div className="pd-hero">
        <div className="pd-hero-avatar">{provider.shop_name[0].toUpperCase()}</div>
        <div className="pd-hero-info">
          <h1>{provider.shop_name}</h1>
          <p>{provider.owner_name} · {provider.owner_email}</p>
          <div className="pd-hero-chips">
            {provider.services.map(s => <span key={s} className={`pd-chip ${s}`}>{SVC_ICON[s]} {s}</span>)}
            {provider.is_verified ? <span className="pd-chip verified">✅ Verified</span> : <span className="pd-chip">⏳ Pending</span>}
          </div>
        </div>
      </div>

      {/* Admin actions bar */}
      {isAdmin && (
        <div className="apd-actions-bar">
          <button className={`btn small ${provider.is_verified ? 'danger' : 'primary'}`} onClick={toggleVerify} disabled={saving}>
            {provider.is_verified ? '❌ Revoke Verification' : '✅ Verify Provider'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid apd-stats">
        <div className="card stat"><span className="stat-icon">👁️</span><div><small>Total Visits ({year})</small><p>{visits.total}</p></div></div>
        <div className="card stat"><span className="stat-icon">📱</span><div><small>WhatsApp</small><p>{provider.whatsapp}</p></div></div>
        <div className="card stat"><span className="stat-icon">📍</span><div><small>Location</small><p>{[provider.taluk, provider.district].filter(Boolean).join(', ') || '—'}</p></div></div>
        <div className="card stat"><span className="stat-icon">📅</span><div><small>Joined</small><p>{new Date(provider.user_joined).toLocaleDateString()}</p></div></div>
      </div>

      {/* Monthly Visits Chart */}
      <div className="card apd-chart-card">
        <div className="apd-chart-header">
          <h3>📊 Monthly Page Visits</h3>
          <div className="apd-year-nav">
            <button className="btn small" onClick={() => setYear(y => y - 1)}>◀</button>
            <span className="apd-year">{year}</span>
            <button className="btn small" onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}>▶</button>
          </div>
        </div>
        <div className="apd-chart">
          {visits.monthly.map((m, i) => (
            <div key={m.month} className="apd-bar-col">
              <span className="apd-bar-val">{m.count || ''}</span>
              <div className="apd-bar-track">
                <div className="apd-bar-fill" style={{ height: `${(m.count / maxCount) * 100}%` }} />
              </div>
              <span className="apd-bar-label">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="apd-grid">
        {/* Shop Info */}
        <div className="card">
          <div className="apd-card-header">
            <h3>🏪 Shop Info</h3>
            {isAdmin && editing !== 'info' && <button className="btn small" onClick={() => startEdit('info')}>✏️ Edit</button>}
          </div>
          {editing === 'info' ? (
            <div className="apd-edit-form">
              <div className="field"><label>Shop Name</label><input value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} /></div>
              <div className="field"><label>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div className="field"><label>Address</label><textarea className="prov-textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="field"><label>State</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value, district: '', taluk: '' })}>
                  <option value="">Select</option>
                  {INDIA_DATA.states.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field"><label>District</label>
                <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value, taluk: '' })}>
                  <option value="">Select</option>
                  {districts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field"><label>Taluk</label>
                <select value={form.taluk} onChange={e => setForm({ ...form, taluk: e.target.value })}>
                  <option value="">Select</option>
                  {taluks.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field"><label>Pincode</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
              <div className="apd-edit-actions">
                <button className="btn primary" disabled={saving} onClick={() => save(form)}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn small" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <div className="detail-row"><span>Shop Name</span><span>{provider.shop_name}</span></div>
              <div className="detail-row"><span>WhatsApp</span><span>{provider.whatsapp}</span></div>
              <div className="detail-row"><span>Address</span><span>{provider.address || '—'}</span></div>
              <div className="detail-row"><span>State</span><span>{provider.state || '—'}</span></div>
              <div className="detail-row"><span>District</span><span>{provider.district || '—'}</span></div>
              <div className="detail-row"><span>Taluk</span><span>{provider.taluk || '—'}</span></div>
              <div className="detail-row"><span>Pincode</span><span>{provider.pincode || '—'}</span></div>
            </div>
          )}
        </div>

        {/* Owner Details */}
        <div className="card">
          <div className="apd-card-header">
            <h3>👤 Owner Details</h3>
            {isAdmin && editing !== 'owner' && <button className="btn small" onClick={() => startEdit('owner')}>✏️ Edit</button>}
          </div>
          {editing === 'owner' ? (
            <div className="apd-edit-form">
              <div className="field"><label>Name</label><input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} /></div>
              <div className="field"><label>Email</label><input type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input value={form.owner_phone} onChange={e => setForm({ ...form, owner_phone: e.target.value })} /></div>
              <div className="apd-edit-actions">
                <button className="btn primary" disabled={saving} onClick={() => save(form)}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn small" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <div className="detail-row"><span>Name</span><span>{provider.owner_name}</span></div>
              <div className="detail-row"><span>Email</span><span>{provider.owner_email}</span></div>
              <div className="detail-row"><span>Phone</span><span>{provider.owner_phone || '—'}</span></div>
              <div className="detail-row"><span>Joined</span><span>{new Date(provider.user_joined).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Services & Features */}
      <div className="card">
        <div className="apd-card-header">
          <h3>🔧 Services & Features</h3>
          {isAdmin && editing !== 'services' && <button className="btn small" onClick={() => startEdit('services')}>✏️ Edit</button>}
        </div>
        {editing === 'services' ? (
          <div className="apd-edit-form">
            <label className="apd-section-label">Service Types</label>
            <div className="prov-svc-grid" style={{ marginBottom: 16 }}>
              {['car', 'bike'].map(s => {
                const sel = form.services.includes(s);
                return (
                  <button key={s} className={`prov-svc-btn ${sel ? 'selected' : ''}`} onClick={() => {
                    const next = sel ? form.services.filter(x => x !== s) : [...form.services, s];
                    const nextFeats = form.features.filter(f => next.some(sv => (allFeatures[sv] || []).includes(f)));
                    setForm({ ...form, services: next, features: nextFeats });
                  }}>
                    {sel && <span className="prov-svc-check">✓</span>}
                    <span className="prov-svc-icon">{SVC_ICON[s]}</span>
                    <strong>{s.charAt(0).toUpperCase() + s.slice(1)}</strong>
                  </button>
                );
              })}
            </div>
            {availableFeatures.length > 0 && (
              <>
                <label className="apd-section-label">Features</label>
                <div className="prov-features">
                  {availableFeatures.map(f => {
                    const sel = form.features.includes(f);
                    return (
                      <button key={f} className={`prov-feat-chip ${sel ? 'selected' : ''}`} onClick={() => {
                        setForm({ ...form, features: sel ? form.features.filter(x => x !== f) : [...form.features, f] });
                      }}>{f}</button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="apd-edit-actions">
              <button className="btn primary" disabled={saving || !form.services.length} onClick={() => save({ services: form.services, features: form.features })}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn small" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="apd-svc-list">
              {provider.services.map(s => <span key={s} className={`svc-mini ${s}`}>{SVC_ICON[s]} {s}</span>)}
            </div>
            {provider.features.length > 0 && (
              <div className="apd-feat-list">
                {provider.features.map(f => <span key={f} className="prov-feat-chip selected small">{f}</span>)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Timings */}
      <div className="card">
        <div className="apd-card-header">
          <h3>🕐 Working Hours</h3>
          {isAdmin && editing !== 'timings' && <button className="btn small" onClick={() => startEdit('timings')}>✏️ Edit</button>}
        </div>
        {editing === 'timings' ? (
          <div className="apd-edit-form">
            <div className="timing-list">
              {DAYS_FULL.map((day, i) => {
                const t = form.timings[day];
                return (
                  <div key={day} className={`timing-row ${t.closed ? 'is-closed' : ''}`}>
                    <div className="timing-day">
                      <strong>{DAYS_SHORT[i]}</strong>
                      <button className={`timing-toggle ${t.closed ? 'closed' : 'open'}`} onClick={() => {
                        setForm({ ...form, timings: { ...form.timings, [day]: { ...t, closed: !t.closed } } });
                      }}>{t.closed ? 'Closed' : 'Open'}</button>
                    </div>
                    {!t.closed && (
                      <div className="timing-inputs">
                        <input type="time" value={t.open} onChange={e => setForm({ ...form, timings: { ...form.timings, [day]: { ...t, open: e.target.value } } })} />
                        <span>to</span>
                        <input type="time" value={t.close} onChange={e => setForm({ ...form, timings: { ...form.timings, [day]: { ...t, close: e.target.value } } })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="apd-edit-actions">
              <button className="btn primary" disabled={saving} onClick={() => save({ timings: form.timings })}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn small" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="pd-timings-modern">
            {DAYS_FULL.map((day, i) => {
              const t = provider.timings?.[day];
              return (
                <div key={day} className={`pd-tm-row ${!t || t.closed ? 'closed' : ''}`}>
                  <div className="pd-tm-day"><strong>{DAYS_SHORT[i]}</strong></div>
                  {!t || t.closed ? <span className="pd-tm-closed">Closed</span> : <span className="pd-tm-time">{t.open} – {t.close}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="card">
        <div className="apd-card-header">
          <h3>💰 Pricing</h3>
          {isAdmin && editing !== 'pricing' && provider.features.length > 0 && <button className="btn small" onClick={() => startEdit('pricing')}>✏️ Edit</button>}
        </div>
        {editing === 'pricing' ? (
          <div className="apd-edit-form">
            <div className="pricing-toggle-row">
              <span>Show prices publicly</span>
              <button className={`pricing-toggle ${form.show_prices ? 'on' : 'off'}`} onClick={() => setForm({ ...form, show_prices: !form.show_prices })}>
                <span className="pricing-toggle-knob" />
              </button>
            </div>
            <div className="pricing-list">
              {Object.entries(form.pricing).map(([feat, pr]) => (
                <div key={feat} className="pricing-card">
                  <div className="pricing-card-header">{feat}</div>
                  <div className="pricing-fields">
                    <div className="pricing-field">
                      <label>Consulting</label>
                      <div className="pricing-input-wrap">
                        <span className="pricing-currency">₹</span>
                        <input className="pricing-input" value={pr.consulting} onChange={e => setForm({
                          ...form, pricing: { ...form.pricing, [feat]: { ...pr, consulting: e.target.value } }
                        })} />
                      </div>
                    </div>
                    <div className="pricing-field">
                      <label>From</label>
                      <div className="pricing-input-wrap">
                        <span className="pricing-currency">₹</span>
                        <input className="pricing-input" value={pr.from} onChange={e => setForm({
                          ...form, pricing: { ...form.pricing, [feat]: { ...pr, from: e.target.value } }
                        })} />
                      </div>
                    </div>
                    <div className="pricing-field">
                      <label>To</label>
                      <div className="pricing-input-wrap">
                        <span className="pricing-currency">₹</span>
                        <input className="pricing-input" value={pr.to} onChange={e => setForm({
                          ...form, pricing: { ...form.pricing, [feat]: { ...pr, to: e.target.value } }
                        })} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="apd-edit-actions">
              <button className="btn primary" disabled={saving} onClick={() => save({ pricing: form.pricing, show_prices: form.show_prices })}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn small" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
              {provider.show_prices ? '🟢 Prices visible to public' : '🔴 Prices hidden from public'}
            </div>
            {provider.pricing && Object.keys(provider.pricing).length > 0 ? (
              <div className="apd-pricing" style={{ borderTop: 'none', paddingTop: 0 }}>
                {Object.entries(provider.pricing).map(([feat, pr]) => (
                  <div key={feat} className="apd-price-row">
                    <span>{feat}</span>
                    <span>
                      {pr.consulting && <span className="pd-ptag consult">₹{pr.consulting}</span>}
                      {(pr.from || pr.to) && <span className="pd-ptag range">{pr.from && pr.to ? `₹${pr.from}–₹${pr.to}` : pr.from ? `From ₹${pr.from}` : `Up to ₹${pr.to}`}</span>}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pricing set</p>}
          </>
        )}
      </div>
    </div>
  );
}
