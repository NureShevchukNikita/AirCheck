import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Shield, User, Download, Thermometer, Droplets, Wind, Zap,
  Beaker, Trash2, Languages, Cpu, Database, Upload, Plus, Edit2, X
} from 'lucide-react';
import './i18n';

const API_URL = "https://nikita-aircheck.serveousercontent.com";

function App() {
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [airData, setAirData] = useState(null);

  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

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

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const id = editingItem.id;
        await axios.put(`${API_URL}/admin/${modalType}/${id}`, formData);
      } else {
        const path = modalType === 'users' ? 'users/create' : modalType;
        await axios.post(`${API_URL}/admin/${path}`, formData);
      }
      setShowModal(false);
      loadAdminData();
    } catch (err) { alert("Save error! Check console."); }
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
    a.download = `backup_aircheck_${new Date().getTime()}.json`;
    a.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'ua' ? 'uk-UA' : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
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
              <label style={backupBtnStyle}>
                <Upload size={18} /> {t('import_btn')}
                <input type="file" onChange={handleImport} style={{ display: 'none' }} accept=".json" />
              </label>
              <button onClick={downloadBackup} style={backupBtnStyle}><Download size={18} /> {t('export_btn')}</button>
            </div>

            <AdminTable
              title={t('users_table')}
              icon={<User size={20}/>}
              data={users}
              columns={['id', 'username', 'email']}
              onDelete={(id) => handleDelete('users', id)}
              onEdit={(item) => openModal('users', item)}
              onAdd={() => openModal('users')}
              formatDate={formatDate}
            />

            <AdminTable
              title={t('devices_table')}
              icon={<Cpu size={20}/>}
              data={devices}
              columns={['id', 'mac_address', 'user_id']}
              onDelete={(id) => handleDelete('devices', id)}
              onEdit={(item) => openModal('devices', item)}
              onAdd={() => openModal('devices')}
              formatDate={formatDate}
            />

            <AdminTable
              title={t('measurements_table')}
              icon={<Database size={20}/>}
              data={measurements}
              columns={['id', 'temperature', 'humidity', 'co2', 'pm25', 'voc', 'device_id', 'timestamp']}
              onDelete={(id) => handleDelete('measurements', id)}
              onEdit={(item) => openModal('measurements', item)}
              onAdd={() => openModal('measurements')}
              formatDate={formatDate}
            />
          </div>
        )}
      </main>

      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#00d1b2', margin: 0 }}>{editingItem ? 'Edit' : 'Add'} {modalType}</h3>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {modalType === 'users' && (
                <>
                  <input placeholder="Username" style={inputStyle} value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  <input placeholder="Email" style={inputStyle} value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </>
              )}
              {modalType === 'devices' && (
                <>
                  <input placeholder="MAC Address" style={inputStyle} value={formData.mac_address || ''} onChange={e => setFormData({...formData, mac_address: e.target.value})} required />
                  <input placeholder="User ID" type="number" style={inputStyle} value={formData.user_id || ''} onChange={e => setFormData({...formData, user_id: e.target.value})} required />
                </>
              )}
              {modalType === 'measurements' && (
                <>
                  <input placeholder="Temp" type="number" step="0.1" style={inputStyle} value={formData.temperature || ''} onChange={e => setFormData({...formData, temperature: e.target.value})} required />
                  <input placeholder="CO2" type="number" style={inputStyle} value={formData.co2 || ''} onChange={e => setFormData({...formData, co2: e.target.value})} required />
                  <input placeholder="Device ID" type="number" style={inputStyle} value={formData.device_id || ''} onChange={e => setFormData({...formData, device_id: e.target.value})} required />
                </>
              )}
              <button type="submit" style={activeBtn}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const AdminTable = ({ title, icon, data, columns, onDelete, onEdit, onAdd, formatDate }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const sortedData = useMemo(() => {
    let items = [...data];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (!isNaN(aVal) && !isNaN(bVal)) return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    return items;
  }, [data, sortConfig]);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ color: '#00d1b2', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>{icon} {title}</h3>
        <button onClick={onAdd} style={{ ...btnStyle, backgroundColor: '#00d1b2', color: '#000', border: 'none' }}><Plus size={18}/> Add</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ backgroundColor: '#00d1b2', color: '#000' }}>
              {columns.map(col => (
                <th key={col} onClick={() => setSortConfig({ key: col, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ ...thStyle, cursor: 'pointer' }}>
                  {col.toUpperCase()} {sortConfig.key === col ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
              <th style={thStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr key={item.id || idx} style={{ borderBottom: '1px solid #333' }}>
                {columns.map(col => <td key={col} style={tdStyle}>{col === 'timestamp' ? formatDate(item[col]) : item[col]}</td>)}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => onEdit(item)} style={{ color: '#00d1b2', background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(item.id)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div style={{ ...cardStyle, textAlign: 'center' }}>
    <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>{icon} {label}</div>
    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{value}</div>
  </div>
);

const getStatusColor = (s) => s === "Danger" ? "#ff4d4d" : s === "Warning" ? "#ff9f43" : "#00d1b2";

// Стилі
const headerStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 25px', backgroundColor: '#1a1a1a', borderRadius: '15px', marginBottom: '25px', border: '1px solid #333' };
const cardStyle = { backgroundColor: '#151515', padding: '20px', borderRadius: '15px', border: '1px solid #222' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px', textAlign: 'center', fontSize: '12px' };
const tdStyle = { padding: '12px', textAlign: 'center', fontSize: '14px' };
const btnStyle = { backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const activeBtn = { ...btnStyle, backgroundColor: '#00d1b2', color: '#000', border: 'none', width: '100%', justifyContent: 'center', fontWeight: 'bold' };
const backupBtnStyle = { ...btnStyle, backgroundColor: '#6c5ce7', border: 'none', height: '40px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '20px', width: '350px', border: '1px solid #333' };
const inputStyle = { backgroundColor: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' };

export default App;