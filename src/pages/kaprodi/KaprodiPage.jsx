import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Primitives';
import { screens } from '../../data/screens';
import { getDemoAccounts, getDemoUserProgram, getFacultyRecords } from '../../services/demoFacultyData';
import { downloadCsv } from '../../utils/exportCsv';
import { CustomTable } from '../../components/common/PortalDataViews';

const categories = ['Profil', 'Rekognisi', 'Penelitian', 'Pengabdian', 'Publikasi', 'Produk/Jasa', 'Luaran', 'Integrasi'];

function Heading({ code, action }) {
  const screen = screens.find((item) => item.code === code);
  return <div className="frame-page-heading"><div><small>{screen.group}</small><h1>{screen.title}</h1></div>{action}</div>;
}

function useProgramRecords() {
  const program = getDemoUserProgram('Kaprodi');
  const records = getFacultyRecords();
  const programRecords = program ? records.filter((record) => record.program === program) : [];
  return { program, records: programRecords, accounts: getDemoAccounts().filter((account) => account.peran === 'Dosen' && account.prodi === program) };
}

function facultySummary(records, accounts = []) {
  const profiles = records.filter((record) => record.category === 'Profil');
  const byEmail = new Map();
  records.forEach((record) => {
    if (!byEmail.has(record.ownerEmail)) byEmail.set(record.ownerEmail, record.ownerName);
  });
  accounts.forEach((account) => {
    const email = String(account.email || '').toLowerCase();
    if (email && !byEmail.has(email)) byEmail.set(email, account.nama || email);
  });
  return [...byEmail.entries()].map(([email, name]) => ({
    email,
    name: profiles.find((record) => record.ownerEmail === email)?.values['Nama dosen'] || name,
    profile: profiles.find((record) => record.ownerEmail === email)?.values || {},
  }));
}

function KaprodiHome() {
  const { program, records, accounts } = useProgramRecords();
  const faculty = facultySummary(records, accounts);
  const latest = [...faculty].slice(0, 5);
  const savedViews = (() => { try { return JSON.parse(localStorage.getItem('simniaga-custom-tables') || '[]').length; } catch { return 0; } })();
  return <div className="frame-workspace"><Heading code="KP-01"/><div className="frame-metric-row frame-metric-three">{[['Jumlah dosen', String(faculty.length).padStart(2, '0')], ['Data tersimpan', String(records.length).padStart(2, '0')], ['Tampilan tersimpan', String(savedViews).padStart(2, '0')]].map(([label, value]) => <article key={label}><span>{label}</span><b>{value}</b></article>)}</div>{!program&&<div className="frame-warning">Program studi akun Kaprodi belum ditetapkan. Kajur perlu membuat akun Kaprodi dengan program studi sebelum data ditampilkan.</div>}<section className="frame-section"><h2>Ringkasan data prodi</h2><div className="frame-shortcuts">{categories.slice(0, 4).map((category) => { const count = records.filter((record) => record.category === category).length; return <Link key={category} to={`/app/KP-03?category=${encodeURIComponent(category)}`}><b>{category}</b><small>{count} data <span>Buka ›</span></small></Link>; })}</div></section><section className="frame-section"><h2>Dosen di {program || 'program studi Anda'}</h2><div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Nama','NIDN/NUPTK','Bidang keahlian','Data tersimpan','Aksi'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{latest.map((person) => { const own = records.filter((record) => record.ownerEmail === person.email); return <tr key={person.email}><td>{person.name}</td><td>{person.profile['NIDN/NUPTK'] || '—'}</td><td>{person.profile['Bidang keahlian'] || '—'}</td><td>{own.length}</td><td><Link to={`/app/KP-03?owner=${encodeURIComponent(person.email)}`}>Lihat detail</Link></td></tr>; })}{latest.length === 0&&<tr><td colSpan="5" className="frame-empty">{program?'Belum ada data dosen pada prodi ini.':'Akun Kaprodi belum memiliki prodi.'}</td></tr>}</tbody></table></div></section></div>;
}

function FacultyList() {
  const [query, setQuery] = useState('');
  const { program, records, accounts } = useProgramRecords();
  const faculty = facultySummary(records, accounts).filter((person) => `${person.name} ${person.profile['NIDN/NUPTK'] || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="frame-workspace"><Heading code="KP-02"/><div className="frame-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari dosen..."/></div>{!program&&<div className="frame-warning">Program studi akun Kaprodi belum ditetapkan oleh Kajur.</div>}<div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Nama','NIDN/NUPTK','Jabatan akademik','Bidang keahlian','Data','Aksi'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{faculty.map((person) => <tr key={person.email}><td>{person.name}</td><td>{person.profile['NIDN/NUPTK'] || '—'}</td><td>{person.profile['Jabatan akademik'] || '—'}</td><td>{person.profile['Bidang keahlian'] || '—'}</td><td>{records.filter((record) => record.ownerEmail === person.email).length}</td><td><Link to={`/app/KP-03?owner=${encodeURIComponent(person.email)}`}>Detail</Link></td></tr>)}{faculty.length===0&&<tr><td colSpan="6" className="frame-empty">{query?'Tidak ada dosen yang cocok.':program?'Belum ada data dosen prodi.':'Akun Kaprodi belum memiliki prodi.'}</td></tr>}</tbody></table></div></div>;
}

function FacultyDetail() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('category') || 'Profil');
  const [query, setQuery] = useState('');
  const { program, records, accounts } = useProgramRecords();
  const owner = params.get('owner') || '';
  const faculty = facultySummary(records, accounts).find((person) => person.email === owner);
  const visible = records.filter((record) => record.ownerEmail === owner && record.category === tab && JSON.stringify(record.values).toLowerCase().includes(query.toLowerCase()));
  const displayField = (key) => !['recordId','ownerEmail','program','Foto profil'].includes(key) && !key.startsWith('__doc_');
  const rows = visible.map((record) => Object.entries(record.values).filter(([key]) => displayField(key)).map(([, value]) => String(value || '—')));
  const columns = visible[0] ? Object.keys(visible[0].values).filter(displayField) : ['Data'];
  const exportRows = visible.map((record) => ({ Dosen: faculty?.name || record.ownerName, Prodi: program, Jenis: record.category, ...record.values }));
  return <div className="frame-workspace"><div className="frame-page-heading"><div><small><Link to="/app/KP-02">Dosen Prodi</Link> › Detail</small><h1>{faculty?.name || 'Detail Data dan Dokumen Dosen'}</h1></div><Button kind="secondary" onClick={() => downloadCsv(exportRows)}>Ekspor</Button></div><div className="frame-warning">Mode hanya lihat. Data ditampilkan dari isian Dosen yang terkait dengan prodi {program || 'yang ditetapkan ke akun Anda'}.</div><div className="frame-tabs">{categories.map((category) => <button type="button" className={tab===category?'active':''} key={category} onClick={() => setTab(category)}>{category}</button>)}</div><div className="frame-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari..."/></div>{!program&&<div className="frame-warning">Program studi akun Kaprodi belum ditetapkan oleh Kajur.</div>}<div className="frame-table-scroll"><table className="frame-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={visible[index].id}>{row.map((value, cellIndex) => <td key={cellIndex}>{value}</td>)}</tr>)}{rows.length===0&&<tr><td colSpan={columns.length} className="frame-empty">{owner?'Belum ada data untuk kategori ini.':'Pilih dosen dari daftar prodi untuk melihat detail.'}</td></tr>}</tbody></table></div></div>;
}

function OptionalDashboard() {
  const { records } = useProgramRecords();
  return <div className="frame-workspace"><Heading code="KP-04"/><div className="frame-metric-row">{[['Dosen', new Set(records.map((record) => record.ownerEmail)).size], ...categories.slice(2, 4).map((category) => [category, records.filter((record) => record.category === category).length]), ['Publikasi', records.filter((record) => record.category === 'Publikasi').length]].map(([label, value]) => <article key={label}><span>{label}</span><b>{String(value).padStart(2, '0')}</b></article>)}</div><section className="frame-section"><h2>Data prodi</h2><div className="frame-shortcuts">{categories.slice(2, 5).map((category) => <Link key={category} to={`/app/KP-03?category=${encodeURIComponent(category)}`}><b>{category}</b><small>{records.filter((record) => record.category === category).length} data <span>Buka ›</span></small></Link>)}</div></section></div>;
}

export default function KaprodiPage({ screen }) {
  if (screen.code === 'KP-01') return <KaprodiHome/>;
  if (screen.code === 'KP-02') return <FacultyList/>;
  if (screen.code === 'KP-03' || screen.code === 'PB-3') return <FacultyDetail/>;
  if (screen.code === 'KP-04') return <OptionalDashboard/>;
  if (screen.code.startsWith('T-')) return <CustomTable screen={screen}/>;
  return <KaprodiHome/>;
}
