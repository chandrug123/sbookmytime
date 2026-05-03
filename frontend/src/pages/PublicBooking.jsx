import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import DateTimePicker from '../components/DateTimePicker';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SVC_ICON = { car: '🚗', bike: '🏍️' };

function getTodayInfo(timings) {
  if (!timings) return null;
  const idx = new Date().getDay();
  const day = DAYS_FULL[idx === 0 ? 6 : idx - 1];
  const t = timings[day];
  if (!t || t.closed) return { open: false, day, text: 'Closed today' };
  return { open: true, day, text: `${t.open} – ${t.close}` };
}

function getMinDate() { return new Date().toISOString().split('T')[0]; }

export default function PublicBooking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('services');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/providers/${id}/detail`)
      .then(({ data }) => setProvider(data.provider))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.post(`/providers/${id}/visit`).catch(() => {});
  }, [id]);

  if (loading) return <div className="pub-page"><div className="search-loading"><div className="search-spinner" /><p>Loading...</p></div></div>;
  if (!provider) return <div className="pub-page"><div className="search-empty"><h3>Shop not found</h3><p>This booking link may be invalid.</p><Link to="/login" className="btn primary">Go to Login</Link></div></div>;

  const today = getTodayInfo(provider.timings);
  const shopInitial = provider.shop_name[0].toUpperCase();
  const canBook = selectedFeature && date && time && name;
  const waNum = provider.whatsapp.replace(/[^0-9]/g, '');
  const selPrice = provider.pricing?.[selectedFeature];

  const bookingUrl = `${window.location.origin}/book/${id}${serviceType ? `?service=${serviceType}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const buildMsg = () => {
    const d = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let m = `Hi ${provider.shop_name}! 👋\n\nI'd like to book an appointment.\n\n`;
    m += `📋 *Service:* ${selectedFeature}\n📅 *Date:* ${d}\n🕐 *Time:* ${time}\n\n`;
    m += `👤 *Name:* ${name}\n`;
    if (phone) m += `📞 *Phone:* ${phone}\n`;
    m += `\nPlease confirm. Thank you! 🙏`;
    return encodeURIComponent(m);
  };

  const handleSend = () => { window.open(`https://wa.me/${waNum}?text=${buildMsg()}`, '_blank'); setSent(true); };

  return (
    <div className="pub-page">
      {/* Hero */}
      <div className="pd-hero">
        <div className="pd-hero-avatar">{shopInitial}</div>
        <div className="pd-hero-info">
          <h1>{provider.shop_name}</h1>
          <p>{provider.owner_name}</p>
          <div className="pd-hero-chips">
            {provider.services.map(s => <span key={s} className={`pd-chip ${s}`}>{SVC_ICON[s]} {s}</span>)}
            {provider.is_verified && <span className="pd-chip verified">✅ Verified</span>}
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="pd-quick">
        <div className="pd-quick-item"><span>📍</span><span>{[provider.taluk, provider.district].filter(Boolean).join(', ')}</span></div>
        {today && <div className={`pd-quick-item ${today.open ? 'q-open' : 'q-closed'}`}><span>{today.open ? '🟢' : '🔴'}</span><span>{today.text}</span></div>}
      </div>

      {/* Share link */}
      <div className="pub-share">
        <button className="pub-share-btn" onClick={copyLink}>
          {copied ? '✅ Link Copied!' : '🔗 Copy Booking Link'}
        </button>
      </div>

      {/* Tabs */}
      <div className="pd-tabs">
        <button className={`pd-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>🔧 Services</button>
        <button className={`pd-tab ${tab === 'timings' ? 'active' : ''}`} onClick={() => setTab('timings')}>🕐 Timings</button>
        <button className={`pd-tab ${tab === 'book' ? 'active' : ''}`} onClick={() => setTab('book')}>📅 Book</button>
      </div>

      {/* Services Tab */}
      {tab === 'services' && (
        <div className="pd-tab-content">
          {provider.features?.length > 0 ? (
            <div className="pd-svc-grid">
              {provider.features.map(f => {
                const pr = provider.pricing?.[f];
                return (
                  <div key={f} className="pd-svc-card" onClick={() => { setSelectedFeature(f); setTab('book'); }}>
                    <div className="pd-svc-card-top"><strong>{f}</strong><span className="pd-svc-arrow">→</span></div>
                    {pr && (
                      <div className="pd-svc-prices">
                        {pr.consulting && <span className="pd-ptag consult">Consulting ₹{pr.consulting}</span>}
                        {(pr.from || pr.to) && <span className="pd-ptag range">{pr.from && pr.to ? `₹${pr.from} – ₹${pr.to}` : pr.from ? `From ₹${pr.from}` : `Up to ₹${pr.to}`}</span>}
                      </div>
                    )}
                    <span className="pd-svc-book-hint">Tap to book →</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="pd-empty">No services listed yet.</div>}
          {provider.address && (
            <div className="pd-address-card">
              <strong>📍 Full Address</strong>
              <p>{[provider.address, provider.taluk, provider.district, provider.state, provider.pincode].filter(Boolean).join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Timings Tab */}
      {tab === 'timings' && (
        <div className="pd-tab-content">
          <div className="pd-timings-modern">
            {DAYS_FULL.map((day, i) => {
              const t = provider.timings?.[day];
              const isToday = day === today?.day;
              return (
                <div key={day} className={`pd-tm-row ${isToday ? 'today' : ''} ${!t || t.closed ? 'closed' : ''}`}>
                  <div className="pd-tm-day"><strong>{DAYS_SHORT[i]}</strong>{isToday && <span className="pd-tm-badge">Today</span>}</div>
                  {!t || t.closed ? <span className="pd-tm-closed">Closed</span> : <span className="pd-tm-time">{t.open} – {t.close}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Book Tab */}
      {tab === 'book' && (
        <div className="pd-tab-content">
          {sent ? (
            <div className="pd-sent">
              <div className="pd-sent-anim">✅</div>
              <h3>Booking Request Sent!</h3>
              <p>Your request has been sent to <strong>{provider.shop_name}</strong> via WhatsApp.</p>
              <div className="pd-sent-actions">
                <button className="btn primary" onClick={() => { setSent(false); setSelectedFeature(''); setDate(''); setTime(''); }}>Book Another</button>
              </div>
            </div>
          ) : (
            <div className="pd-book-flow">
              <div className="pd-book-step">
                <div className="pd-book-num">1</div>
                <div className="pd-book-body">
                  <label>Select Service</label>
                  <div className="pd-book-chips">
                    {provider.features.map(f => (
                      <button key={f} className={`pd-book-chip ${selectedFeature === f ? 'active' : ''}`} onClick={() => setSelectedFeature(f)}>{f}</button>
                    ))}
                  </div>
                  {selectedFeature && selPrice && (
                    <div className="pd-book-price-info">
                      {selPrice.consulting && <span className="pd-ptag consult">Consulting ₹{selPrice.consulting}</span>}
                      {(selPrice.from || selPrice.to) && <span className="pd-ptag range">{selPrice.from && selPrice.to ? `₹${selPrice.from} – ₹${selPrice.to}` : selPrice.from ? `From ₹${selPrice.from}` : `Up to ₹${selPrice.to}`}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className={`pd-book-step ${!selectedFeature ? 'disabled' : ''}`}>
                <div className="pd-book-num">2</div>
                <div className="pd-book-body">
                  <label>Your Details</label>
                  <div className="pd-book-dt">
                    <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} disabled={!selectedFeature} />
                    <input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} disabled={!selectedFeature} />
                  </div>
                </div>
              </div>

              <div className={`pd-book-step ${!selectedFeature ? 'disabled' : ''}`}>
                <div className="pd-book-num">3</div>
                <div className="pd-book-body">
                  <label>Pick Date & Time</label>
                  <DateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} timings={provider.timings} disabled={!selectedFeature} />
                </div>
              </div>

              <div className={`pd-book-step ${!canBook ? 'disabled' : ''}`}>
                <div className="pd-book-num">4</div>
                <div className="pd-book-body">
                  <button className={`btn full pd-book-send ${canBook ? 'ready' : ''}`} disabled={!canBook} onClick={handleSend}>
                    💬 Send Booking via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="pub-bottom">
        <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener" className="pd-sticky-wa">💬 WhatsApp</a>
        {provider.owner_phone && <a href={`tel:${provider.owner_phone}`} className="pd-sticky-call">📞 Call</a>}
        <button className="pd-sticky-book" onClick={() => setTab('book')}>📅 Book Now</button>
      </div>

      <div className="pub-footer">
        <p>Powered by <Link to="/login">BookingApp</Link></p>
      </div>
    </div>
  );
}
