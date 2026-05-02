import { useState, useEffect } from 'react';
import INDIA_DATA from '../indiaData';

export default function LocationForm({ value, onChange }) {
  const [state, setState] = useState(value?.state || '');
  const [district, setDistrict] = useState(value?.district || '');
  const [taluk, setTaluk] = useState(value?.taluk || '');
  const [village, setVillage] = useState(value?.village || '');

  const districts = state ? (INDIA_DATA.districts[state] || []) : [];
  const taluks = district ? (INDIA_DATA.taluks[district] || []) : [];

  useEffect(() => {
    onChange({ state, district, taluk, village });
  }, [state, district, taluk, village]);

  const handleStateChange = (e) => {
    setState(e.target.value);
    setDistrict('');
    setTaluk('');
  };

  const handleDistrictChange = (e) => {
    setDistrict(e.target.value);
    setTaluk('');
  };

  return (
    <>
      <div className="field">
        <label>Country</label>
        <input type="text" value="India" disabled />
      </div>
      <div className="field">
        <label>State</label>
        <select value={state} onChange={handleStateChange}>
          <option value="">Select State</option>
          {INDIA_DATA.states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label>District</label>
        <select value={district} onChange={handleDistrictChange} disabled={!state}>
          <option value="">Select District</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Taluk</label>
        <select value={taluk} onChange={e => setTaluk(e.target.value)} disabled={!district}>
          <option value="">Select Taluk</option>
          {taluks.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Village</label>
        <input type="text" value={village} onChange={e => setVillage(e.target.value)} placeholder="Enter village" />
      </div>
    </>
  );
}
