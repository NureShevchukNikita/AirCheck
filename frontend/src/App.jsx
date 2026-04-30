import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Shield, User, Download, Thermometer, Droplets, Wind, Zap, Beaker, Trash2, Languages, Cpu, Database, Upload } from 'lucide-react';
import './i18n';

const API_URL = "https://nikita-aircheck.serveousercontent.com";

function App() {
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [airData, setAirData] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'ua' ? 'uk-UA' : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) =>
      a.username.localeCompare(b.username, i18n.language === 'ua' ? 'uk' : 'en')
    );
  }, [users, i18n.language]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/devices/AABBCCDDEEFF/analysis`);
        setAirData(res.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      const [u, d, m] = await Promise.all([
        axios.get(`${API_URL}/admin/users/all`),
        axios.get(`${API_URL}/admin/devices/all`),
        axios.get(`${API_URL}/admin/measurements/all`)
      ]);
      setUsers(u.data);
      setDevices(d.data);
      setMeasurements(m.data);
    } catch (e) { console.error("Load error", e); }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`${t('delete')}?`)) {
      try {
        await axios.delete(`${API_URL}/admin/${type}/${id}`);
        loadAdminData();
      } catch (e) { alert("Error deleting"); }
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        await axios.post(`${API_URL}/admin/import`, json);
        alert("Success!");
        loadAdminData();
      } catch (err) { alert("Import failed!"); }
    };
    reader.readAsText(file);
  };

  const downloadBackup = async () => {
    const res = await axios.get(`${API_URL}/admin/export`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_aircheck_${i18n.language}_${new Date().getTime()}.json`;
    a.click();
  };

  return (
    <div dir="auto" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e0e0e0', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={headerStyle}>
        <h2 style={{ color: '#00d1b2', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Zap fill="#00d1b2" /> {t('title')}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => i18n.changeLanguage(i18n.language === 'ua' ? 'en' : 'ua')} style={btnStyle}>
            <Languages size={18} /> {i18n.language.toUpperCase()}
          </button>
          <button onClick={() => { setIsAdmin(!isAdmin); if(!isAdmin) loadAdminData(); }} style={isAdmin ? activeBtn : btnStyle}>
            {isAdmin ? <User size={18} /> : <Shield size={18} />} {isAdmin ? t('user_view') : t('admin_view')}
          </button>
        </div>
      </header>

      <main>
        {!isAdmin ? (
          <div style={gridStyle}>
            <div style={{ ...cardStyle, borderTop: `6px solid ${getStatusColor(airData?.status)}`, gridColumn: '1 / -1', textAlign: 'center' }}>
              <h1 style={{ color: getStatusColor(airData?.status) }}>{t(airData?.status)}</h1>
              <p style={{ color: '#888' }}>{t('real_time')}</p>
            </div>

            <StatCard icon={<Thermometer color="#ff4d4d"/>} label={t('temp')} value={`${airData?.avg_temp || 0}°C`} />
            <StatCard icon={<Droplets color="#4dabff"/>} label={t('hum')} value={`${airData?.avg_humidity || 0}%`} />
            <StatCard icon={<Wind color="#00d1b2"/>} label="CO2" value={`${airData?.max_co2 || 0} ppm`} />
            <StatCard icon={<Wind color="#ff9f43"/>} label="PM 2.5" value={`${airData?.max_pm25 || 0} µg/m³`} />
            <StatCard icon={<Beaker color="#a29bfe"/>} label="VOC" value={`${airData?.max_voc || 0}`} />

            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <h3 style={{ color: '#00d1b2', textAlign: 'center' }}>{t('recommendations')}</h3>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'center' }}>
                {airData?.recommendations?.map((recKey, i) => (
                  <li key={i} style={{ padding: '10px', color: '#ccc' }}>• {t(recKey)}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
              {/* Кнопка Імпорту */}
              <label style={{ ...backupBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', height: '42px', padding: '0 20px', margin: 0, boxSizing: 'border-box' }}>
                <Upload size={18} />
                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1' }}>{t('import_btn')}</span>
                <input type="file" onChange={handleImport} style={{ display: 'none' }} accept=".json" />
              </label>

              {/* Кнопка Експорту */}
              <button onClick={downloadBackup} style={{ ...backupBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '42px', padding: '0 20px', margin: 0, boxSizing: 'border-box' }}>
                <Download size={18} />
                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1' }}>{t('export_btn')}</span>
              </button>
            </div>

            <AdminTable
              title={t('users_table')}
              icon={<User size={20}/>}
              data={sortedUsers}
              columns={['id', 'username', 'email']}
              onDelete={(id) => handleDelete('users', id)}
              formatDate={formatDate}
            />

            <AdminTable
              title={t('devices_table')} // Перекладено
              icon={<Cpu size={20}/>}
              data={devices}
              columns={['id', 'mac_address', 'user_id']}
              onDelete={(id) => handleDelete('devices', id)}
              formatDate={formatDate}
            />

            <AdminTable
              title={t('measurements_table')} // Перекладено
              icon={<Database size={20}/>}
              data={measurements}
              columns={['id', 'temperature', 'humidity', 'co2', 'pm25', 'voc', 'device_id', 'timestamp']}
              onDelete={(id) => handleDelete('measurements', id)}
              formatDate={formatDate}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const AdminTable = ({ title, icon, data, columns, onDelete, formatDate }) => (
  <div style={cardStyle}>
    <h3 style={{ color: '#00d1b2', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>{icon} {title}</h3>
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr style={{ backgroundColor: '#00d1b2', color: '#000' }}>
            {columns.map(col => <th key={col} style={thStyle}>{col.toUpperCase()}</th>)}
            <th style={thStyle}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id || item.mac_address} style={{ borderBottom: '1px solid #333' }}>
              {columns.map(col => (
                <td key={col} style={tdStyle}>
                  {col === 'timestamp' ? formatDate(item[col]) : item[col]}
                </td>
              ))}
              <td style={tdStyle}>
                <button onClick={() => onDelete(item.id || item.mac_address)} style={{ color: '#ff4d4d', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><Trash2 size={18}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div style={{ ...cardStyle, textAlign: 'center' }}>
    <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>{icon} {label}</div>
    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{value}</div>
  </div>
);

const getStatusColor = (s) => s === "Danger" ? "#ff4d4d" : s === "Warning" ? "#ff9f43" : "#00d1b2";

const headerStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 25px', backgroundColor: '#1a1a1a', borderRadius: '15px', marginBottom: '25px', border: '1px solid #333' };
const cardStyle = { backgroundColor: '#151515', padding: '25px', borderRadius: '15px', border: '1px solid #222' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px', textAlign: 'center' };
const tdStyle = { padding: '12px', textAlign: 'center' };
const btnStyle = { backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const activeBtn = { ...btnStyle, backgroundColor: '#00d1b2', color: '#000' };
const backupBtn = { backgroundColor: '#6c5ce7', color: '#fff', border: 'none', borderRadius: '8px' };

export default App;