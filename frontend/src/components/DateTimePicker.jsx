const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getNext3Days() {
  const days = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = DAYS_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    days.push({ label, dateStr, dayName, weekday, dateLabel });
  }
  return days;
}

function getTimeSlots(timings, dayName) {
  if (!timings || !timings[dayName] || timings[dayName].closed) return [];
  const t = timings[dayName];
  const openH = parseInt(t.open?.split(':')[0] || '9', 10);
  const closeH = parseInt(t.close?.split(':')[0] || '18', 10);
  const slots = [];
  for (let h = openH; h < closeH; h++) {
    const from = `${String(h).padStart(2, '0')}:00`;
    const to = `${String(h + 1).padStart(2, '0')}:00`;
    slots.push({ value: `${from} - ${to}`, label: `${from} – ${to}` });
  }
  return slots;
}

export default function DateTimePicker({ date, time, onDateChange, onTimeChange, timings, disabled }) {
  const days = getNext3Days();
  const selectedDay = days.find(d => d.dateStr === date);
  const slots = selectedDay ? getTimeSlots(timings, selectedDay.dayName) : [];
  const isClosed = selectedDay && timings?.[selectedDay.dayName]?.closed;

  return (
    <div className="dtp">
      <div className="dtp-section">
        <span className="dtp-label">📅 Select Date</span>
        <div className="dtp-day-chips">
          {days.map(d => {
            const closed = timings?.[d.dayName]?.closed;
            return (
              <button
                key={d.dateStr}
                className={`dtp-day ${date === d.dateStr ? 'active' : ''} ${closed ? 'closed' : ''}`}
                onClick={() => { onDateChange(d.dateStr); onTimeChange(''); }}
                disabled={disabled || closed}
              >
                <strong>{d.label}</strong>
                <small>{d.dateLabel}</small>
                {closed && <span className="dtp-closed-tag">Closed</span>}
              </button>
            );
          })}
        </div>
      </div>

      {date && !isClosed && (
        <div className="dtp-section">
          <span className="dtp-label">🕐 Select Time Slot</span>
          {slots.length > 0 ? (
            <div className="dtp-time-chips">
              {slots.map(s => (
                <button
                  key={s.value}
                  className={`dtp-time ${time === s.value ? 'active' : ''}`}
                  onClick={() => onTimeChange(s.value)}
                  disabled={disabled}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="dtp-no-slots">No time slots available for this day.</p>
          )}
        </div>
      )}

      {date && isClosed && (
        <div className="dtp-closed-msg">🔴 Shop is closed on this day. Please pick another date.</div>
      )}
    </div>
  );
}
