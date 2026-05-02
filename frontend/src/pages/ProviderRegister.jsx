import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import INDIA_DATA from '../indiaData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_TIMINGS = {};
DAYS.forEach(d => { DEFAULT_TIMINGS[d] = { open: '09:00', close: '18:00', closed: false }; });

const TOTAL_STEPS = 6;

export default function ProviderRegister({ embedded }) {
  const [step, setStep] = useState(1);
  const [features, setFeatures] = useState({ car: [], bike: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shop_name: '', owner_name: '', email: '', phone: '', whatsapp: '',
    address: '', state: '', district: '', taluk: '', pincode: '',
    services: [], features: [], timings: { ...DEFAULT_TIMINGS },
    pricing: {}, show_prices: true
  });

  useEffect(() => {
    api.get('/providers/features').then(({ data }) => setFeatures(data.features)).catch(() => {});
  }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleService = (svc) => {
    const s = form.services.includes(svc) ? form.services.filter(x => x !== svc) : [...form.services, svc];
    const validFeatures = form.features.filter(f => {
      for (const sv of s) { if (features[sv]?.includes(f)) return true; }
      return false;
    });
    setForm({ ...form, services: s, features: validFeatures });
  };

  const toggleFeature = (f) => {
    const ft = form.features.includes(f) ? form.features.filter(x => x !== f) : [...form.features, f];
    setForm({ ...form, features: ft });
  };

  const setTiming = (day, field, val) => {
    setForm({ ...form, timings: { ...form.timings, [day]: { ...form.timings[day], [field]: val } } });
  };

  const toggleClosed = (day) => {
    setForm({ ...form, timings: { ...form.timings, [day]: { ...form.timings[day], closed: !form.timings[day].closed } } });
  };

  const setPrice = (feat, field, val) => {
    const cur = form.pricing[feat] || { consulting: '', from: '', to: '' };
    setForm({ ...form, pricing: { ...form.pricing, [feat]: { ...cur, [field]: val } } });
  };

  const districts = form.state ? (INDIA_DATA.districts[form.state] || []) : [];
  const taluks = form.district ? (INDIA_DATA.taluks[form.district] || []) : [];
  const availableFeatures = [...new Set(form.services.flatMap(s => features[s] || []))];

  const validateStep = () => {
    setError('');
    if (step === 1 && (!form.shop_name || !form.owner_name || !form.email || !form.whatsapp)) {
      setError('All fields are required. WhatsApp number is mandatory.'); return false;
    }
    if (step === 2 && (!form.address || !form.state || !form.district)) {
      setError('Address, state and district are required'); return false;
    }
    if (step === 3 && form.services.length === 0) {
      setError('Select at least one service type'); return false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(step + 1); };
  const back = () => { setError(''); setStep(step - 1); };

  const submit = async () => {
    setError('');
    try {
      await api.post('/providers/register', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  if (success) {
    if (embedded) {
      return (
        <div className="page">
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2>Provider Registered!</h2>
            <p style={{ color: 'var(--muted)', margin: '8px 0 20px' }}>
              <strong>{form.shop_name}</strong> has been added successfully.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/providers" className="btn primary">View Providers</Link>
              <button className="btn small" onClick={() => { setSuccess(false); setStep(1); setForm({ ...form, shop_name: '', owner_name: '', email: '', phone: '', whatsapp: '', address: '', services: [], features: [], pricing: {}, timings: { ...DEFAULT_TIMINGS } }); }}>Add Another</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1>Registration Complete!</h1>
          <p className="subtitle" style={{ marginBottom: 8 }}><strong>{form.shop_name}</strong> has been registered successfully.</p>
          <p className="subtitle" style={{ marginBottom: 20 }}>Admin will verify your shop. You'll be notified once approved.</p>
          <Link to="/login" className="btn primary full">Back to Login</Link>
        </div>
      </div>
    );
  }

  const stepContent = (
    <>
      {!embedded && <Link to="/login" className="back-link">← Back to Login</Link>}
      <h1>🏪 {embedded ? 'Add Service Provider' : 'Register Your Shop'}</h1>
      <p className="subtitle">Step {step} of {TOTAL_STEPS}</p>
      <div className="step-bar">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
          <div key={s} className={`step-dot ${s <= step ? 'active' : ''}`} />
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}

      {step === 1 && (
        <div className="prov-step">
          <h3>Shop & Owner Details</h3>
          <div className="field"><label>Shop Name *</label><input type="text" value={form.shop_name} onChange={update('shop_name')} placeholder="e.g. Ravi Motors" /></div>
          <div className="field"><label>Owner Name *</label><input type="text" value={form.owner_name} onChange={update('owner_name')} placeholder="Full name" /></div>
          <div className="field"><label>Email *</label><input type="email" value={form.email} onChange={update('email')} placeholder="shop@email.com" /></div>
          <div className="field"><label>Phone</label><input type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 9876543210" /></div>
          <div className="field"><label>WhatsApp Number * <span className="wa-badge">Required</span></label><input type="tel" value={form.whatsapp} onChange={update('whatsapp')} placeholder="+91 9876543210" /></div>
          <button className="btn primary full" onClick={next}>Next →</button>
        </div>
      )}

      {step === 2 && (
        <div className="prov-step">
          <h3>Shop Address</h3>
          <div className="field"><label>Full Address *</label><textarea value={form.address} onChange={update('address')} rows={3} placeholder="Shop no, street, area..." className="prov-textarea" /></div>
          <div className="field"><label>State *</label><select value={form.state} onChange={e => setForm({ ...form, state: e.target.value, district: '', taluk: '' })}><option value="">Select State</option>{INDIA_DATA.states.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="field"><label>District *</label><select value={form.district} onChange={e => setForm({ ...form, district: e.target.value, taluk: '' })} disabled={!form.state}><option value="">Select District</option>{districts.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div className="field"><label>Taluk</label><select value={form.taluk} onChange={update('taluk')} disabled={!form.district}><option value="">Select Taluk</option>{taluks.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="field"><label>Pincode</label><input type="text" value={form.pincode} onChange={update('pincode')} placeholder="560001" maxLength={6} /></div>
          <div className="prov-nav"><button className="btn small" onClick={back}>← Back</button><button className="btn primary" onClick={next}>Next →</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="prov-step">
          <h3>Services Offered</h3>
          <p className="prov-hint">Select the types of vehicles you service</p>
          <div className="prov-svc-grid">
            <button className={`prov-svc-btn ${form.services.includes('car') ? 'selected' : ''}`} onClick={() => toggleService('car')}>
              <span className="prov-svc-icon">🚗</span><strong>Car Service</strong><small>4-wheeler maintenance</small>
              {form.services.includes('car') && <span className="prov-svc-check">✓</span>}
            </button>
            <button className={`prov-svc-btn ${form.services.includes('bike') ? 'selected' : ''}`} onClick={() => toggleService('bike')}>
              <span className="prov-svc-icon">🏍️</span><strong>Bike Service</strong><small>2-wheeler maintenance</small>
              {form.services.includes('bike') && <span className="prov-svc-check">✓</span>}
            </button>
          </div>
          <div className="prov-nav"><button className="btn small" onClick={back}>← Back</button><button className="btn primary" onClick={next}>Next →</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="prov-step">
          <h3>Features & Specializations</h3>
          <p className="prov-hint">Select what your shop offers</p>
          {availableFeatures.length === 0 ? (
            <div className="info-box" style={{ marginBottom: 16 }}>Go back and select at least one service type first.</div>
          ) : (
            <div className="prov-features">
              {availableFeatures.map(f => (
                <button key={f} className={`prov-feat-chip ${form.features.includes(f) ? 'selected' : ''}`} onClick={() => toggleFeature(f)}>
                  {form.features.includes(f) && <span>✓ </span>}{f}
                </button>
              ))}
            </div>
          )}
          <div className="prov-nav"><button className="btn small" onClick={back}>← Back</button><button className="btn primary" onClick={next}>Next →</button></div>
        </div>
      )}

      {step === 5 && (
        <div className="prov-step">
          <h3>🕐 Shop Timings</h3>
          <p className="prov-hint">Set opening and closing hours for each day</p>
          <div className="timing-list">
            {DAYS.map(day => (
              <div key={day} className={`timing-row ${form.timings[day]?.closed ? 'is-closed' : ''}`}>
                <div className="timing-day">
                  <strong>{day.slice(0, 3)}</strong>
                  <button className={`timing-toggle ${form.timings[day]?.closed ? 'closed' : 'open'}`} onClick={() => toggleClosed(day)}>
                    {form.timings[day]?.closed ? 'Closed' : 'Open'}
                  </button>
                </div>
                {!form.timings[day]?.closed && (
                  <div className="timing-inputs">
                    <input type="time" value={form.timings[day]?.open || '09:00'} onChange={e => setTiming(day, 'open', e.target.value)} />
                    <span>to</span>
                    <input type="time" value={form.timings[day]?.close || '18:00'} onChange={e => setTiming(day, 'close', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="prov-nav"><button className="btn small" onClick={back}>← Back</button><button className="btn primary" onClick={next}>Next →</button></div>
        </div>
      )}

      {step === 6 && (
        <div className="prov-step">
          <h3>💰 Pricing</h3>
          <p className="prov-hint">Set prices for your selected features (in ₹)</p>
          <div className="pricing-toggle-row">
            <span>Show prices to customers</span>
            <button className={`pricing-toggle ${form.show_prices ? 'on' : 'off'}`} onClick={() => setForm({ ...form, show_prices: !form.show_prices })}>
              <span className="pricing-toggle-knob" />
            </button>
          </div>
          {form.features.length === 0 ? (
            <div className="info-box" style={{ marginBottom: 16 }}>No features selected. Go back to add features first.</div>
          ) : (
            <div className="pricing-list">
              {form.features.map(f => {
                const p = form.pricing[f] || {};
                return (
                  <div key={f} className="pricing-card">
                    <div className="pricing-card-header">{f}</div>
                    <div className="pricing-fields">
                      <div className="pricing-field">
                        <label>Consulting</label>
                        <div className="pricing-input-wrap">
                          <span className="pricing-currency">₹</span>
                          <input type="number" min="0" className="pricing-input" placeholder="0" value={p.consulting || ''} onChange={e => setPrice(f, 'consulting', e.target.value)} />
                        </div>
                      </div>
                      <div className="pricing-field">
                        <label>From</label>
                        <div className="pricing-input-wrap">
                          <span className="pricing-currency">₹</span>
                          <input type="number" min="0" className="pricing-input" placeholder="Min" value={p.from || ''} onChange={e => setPrice(f, 'from', e.target.value)} />
                        </div>
                      </div>
                      <div className="pricing-field">
                        <label>To</label>
                        <div className="pricing-input-wrap">
                          <span className="pricing-currency">₹</span>
                          <input type="number" min="0" className="pricing-input" placeholder="Max" value={p.to || ''} onChange={e => setPrice(f, 'to', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="prov-nav"><button className="btn small" onClick={back}>← Back</button><button className="btn primary" onClick={submit}>Submit Registration</button></div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="page">
        <div className="card prov-card-embedded">{stepContent}</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card prov-card">{stepContent}</div>
    </div>
  );
}
