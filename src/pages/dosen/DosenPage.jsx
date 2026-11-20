import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Primitives';
import { apiClient, getApiDocumentUrl, getApiError, unwrapApiData, uploadApiDocument } from '../../services/api';
import { listFacultyRecordsApi, saveFacultyRecordApi } from '../../services/apiFacultyData';

const categories = ['Profil', 'Rekognisi', 'Penelitian', 'Pengabdian', 'Publikasi', 'Produk/Jasa', 'Luaran', 'Integrasi'];
const categoryRoutes = { Profil: 'D-02', Rekognisi: 'D-03', Penelitian: 'PB-1', Pengabdian: 'D-05', Publikasi: 'D-06', 'Produk/Jasa': 'D-07', Luaran: 'D-08', Integrasi: 'D-09' };
const entityTypes = { Rekognisi: 'rekognisi_dosen', Penelitian: 'penelitian_pkm_dosen', Pengabdian: 'penelitian_pkm_dosen', Publikasi: 'publikasi_dosen', 'Produk/Jasa': 'produk_jasa_dosen', Luaran: 'luaran_dosen', Integrasi: 'integrasi_pembelajaran' };
const apiResources = {
  Profil: '/dosen/saya/profil', Rekognisi: '/dosen/saya/rekognisi', Penelitian: '/dosen/saya/penelitian',
  Pengabdian: '/dosen/saya/pengabdian', Publikasi: '/dosen/saya/publikasi', 'Produk/Jasa': '/dosen/saya/produk-jasa',
  Luaran: '/dosen/saya/luaran', Integrasi: '/dosen/saya/integrasi-pembelajaran',
};

const responseRows = (response) => {
  const value = unwrapApiData(response);
  return Array.isArray(value) ? value : value ? [value] : [];
};

function useRows(category) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    listFacultyRecordsApi(category).then((items) => { if (active) setRows(Array.isArray(items) ? items : items ? [items] : []); })
      .catch((reason) => { if (active) setError(getApiError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category]);
  return { rows, setRows, loading, error, setError };
}

function Heading({ breadcrumb, title }) {
  const groups = breadcrumb.split(' › ');
  return <div className="dosen-heading"><nav className="dosen-breadcrumb" aria-label="Jejak halaman"><Link to="/app/D-13">Data Saya</Link>{groups.map((label, index) => <span key={`${label}-${index}`}>› {index < groups.length - 1 ? <Link to={`/app/${categoryRoutes[label] || 'D-13'}`}>{label}</Link> : <b>{label}</b>}</span>)}</nav><h1>{title}</h1></div>;
}

function Field({ label, children, wide = false }) {
  return <label className={'dosen-field' + (wide ? ' dosen-field-wide' : '')}><span>{label}</span>{children}</label>;
}

function TextInput({ label, type = 'text', required = false, wide = false, defaultValue }) {
  return <Field label={label} wide={wide}><input name={label} type={type} required={required} defaultValue={defaultValue} placeholder="Isi di sini"/></Field>;
}

function SelectInput({ label, options, required = false, defaultValue = '' }) {
  return <Field label={label}><select name={label} required={required} defaultValue={defaultValue}><option value="">Pilih</option>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}

function ChoiceInput({ label, options, required = false }) {
  return <Field label={label}><span className="dosen-choice">{options.map((option) => <label key={option}><input type="radio" name={label} value={option} required={required}/> {option}</label>)}</span></Field>;
}

function getCurrentAccount() {
  try { return JSON.parse(localStorage.getItem('simniaga-api-user') || 'null'); } catch { return null; }
}

function useMyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = () => apiClient.get('/dokumen/saya', { params: { page: 1, per_page: 100, kategori: 'bukti_dosen' } })
    .then((response) => { setDocuments(responseRows(response)); setError(''); })
    .catch((reason) => setError(getApiError(reason)))
    .finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);
  return { documents, setDocuments, error, setError, loading, refresh };
}

function UploadInput({ label, required = true, reusable = true }) {
  const { documents, refresh } = useMyDocuments();
  const [documentId, setDocumentId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const matches = documents.filter((document) => String(document.nama_asli || '').toLowerCase().includes(query.toLowerCase()));
  const choose = (document) => { setDocumentId(String(document.id)); setDocumentName(document.nama_asli); setShowPicker(false); setError(''); };
  return <div className="dosen-upload-field"><b>{label} (PDF){required && ' *'}</b><div className="dosen-upload-control"><label>{documentName || 'Pilih berkas PDF'}<input type="file" accept="application/pdf,.pdf" required={required && !documentId} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setError('Ukuran dokumen maksimal 5 MB.'); event.target.value = ''; return; } setBusy(true); setError(''); try { const document = await uploadApiDocument(file, 'bukti_dosen'); choose(document); await refresh(); } catch (reason) { setError(getApiError(reason)); event.target.value = ''; } finally { setBusy(false); } }}/></label>{reusable && <button type="button" onClick={() => setShowPicker(true)}>Pilih dokumen tersimpan</button>}</div><input type="hidden" name={`__doc_${label}`} value={documentId}/>{busy && <small>Mengunggah dokumen…</small>}{error && <small role="alert">{error}</small>}{showPicker && <div className="dosen-modal-backdrop"><section className="dosen-modal dosen-picker" role="dialog" aria-modal="true"><h2>Pilih dokumen tersimpan</h2><input placeholder="Cari dokumen…" value={query} onChange={(event) => setQuery(event.target.value)}/><div>{matches.map((document) => <button type="button" key={document.id} className="dosen-picker-row" onClick={() => choose(document)}>{document.nama_asli}</button>)}{!matches.length && <p className="dosen-empty">{documents.length ? 'Tidak ada dokumen yang cocok.' : 'Belum ada dokumen yang tersimpan di server.'}</p>}</div><div className="dosen-modal-actions"><button type="button" className="dosen-cancel" onClick={() => setShowPicker(false)}>Tutup</button></div></section></div>}</div>;
}

function FormShell({ category, breadcrumb, title, children, note }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [values, setValues] = useState(null);
  const save = async () => {
    setSaving(true); setError('');
    try { await saveFacultyRecordApi(category, values); setSaved(true); setConfirming(false); }
    catch (reason) { setError(getApiError(reason)); setConfirming(false); }
    finally { setSaving(false); }
  };
  return <div className="dosen-screen"><Heading breadcrumb={breadcrumb} title={title}/><div className={'dosen-form-layout ' + (note ? 'dosen-form-layout-with-note' : 'dosen-form-layout-wide')}><form className="dosen-form-card" onSubmit={(event) => { event.preventDefault(); const formValues = Object.fromEntries([...new FormData(event.currentTarget)].map(([key, value]) => [key, value instanceof File ? value.name : value])); setValues(formValues); setConfirming(true); }} onInput={() => { setSaved(false); setError(''); }}>{children}<div className="dosen-form-actions"><Button type="submit" disabled={saving||saved}>{saved ? 'Tersimpan' : 'Simpan'}</Button><Link to={`/app/${categoryRoutes[category]}`} className="dosen-cancel">Batal</Link></div>{error && <p className="dosen-save-message" role="alert">{error}</p>}{saved && <p className="dosen-save-message" role="status">Data tersimpan di server.</p>}</form>{note && <aside className="dosen-note"><h2>Keterangan</h2>{note}</aside>}</div>{confirming && <div className="dosen-modal-backdrop"><section className="dosen-modal dosen-delete-modal" role="dialog" aria-modal="true"><h2>Pastikan data sudah benar</h2><p>Setelah tersimpan, data ini hanya dapat diubah melalui mekanisme yang diizinkan backend.</p><div className="dosen-modal-actions"><Button type="button" kind="secondary" disabled={saving} onClick={() => setConfirming(false)}>Periksa lagi</Button><Button type="button" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Ya, simpan data'}</Button></div></section></div>}</div>;
}

function ProfileForm() {
  const { rows, loading, error } = useRows('Profil');
  const profile = rows[0] || {};
  return <FormShell category="Profil" breadcrumb="Profil" title="Profil Dosen"><div className="dosen-form-section"><h2>Profil akademik</h2><div className="dosen-fields-grid"><TextInput label="NIDN/NUPTK" required defaultValue={profile.nidn_nuptk}/><TextInput label="Bidang keahlian" required defaultValue={profile.bidang_keahlian}/><ChoiceInput label="Kesesuaian dengan kompetensi inti PS" options={['Sesuai', 'Tidak sesuai']} required/><SelectInput label="Jabatan akademik" options={['Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Profesor']} required/></div>{loading && <p>Memuat profil…</p>}{error && <p role="alert">{error}</p>}</div></FormShell>;
}

function RecognitionForm() {
  return <FormShell category="Rekognisi" breadcrumb="Rekognisi › Tambah" title="Tambah Rekognisi"><div className="dosen-form-section"><h2>Rekognisi</h2><div className="dosen-fields-grid"><TextInput label="Bidang keahlian" required/><SelectInput label="Jenis rekognisi (e)" options={['Visiting lecturer/scholar', 'Keynote/Invited speaker', 'Editor/mitra bestari jurnal', 'Staf ahli/narasumber', 'Penghargaan prestasi']} required/><SelectInput label="Tingkat (Wilayah/Nasional/Internasional)" options={['Wilayah', 'Nasional', 'Internasional']} required/><TextInput label="Tahun" type="number" required/><TextInput label="Deskripsi" required wide/><UploadInput label="Bukti pendukung"/></div></div></FormShell>;
}

function ResearchForm({ category = 'Penelitian' }) {
  const title = category === 'Pengabdian' ? 'Tambah Pengabdian' : 'Tambah Penelitian';
  const heading = category;
  return <FormShell category={category} breadcrumb={`${heading} › Tambah`} title={title}><div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Tahun" type="number" required/><ChoiceInput label="Peran" options={['Ketua', 'Anggota']} required/><TextInput label="Skema" required/><TextInput label="Sumber dana" required/><TextInput label="Jumlah pendanaan (Rp)" type="number" required/><TextInput label={category === 'Pengabdian' ? 'Judul pengabdian' : 'Judul penelitian'} required wide/><UploadInput label="Bukti lembar pengesahan"/></div></div></FormShell>;
}

function PublicationForm() {
  return <FormShell category="Publikasi" breadcrumb="Publikasi › Tambah" title="Tambah Publikasi"><div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Tahun" type="number" required/><ChoiceInput label="Peran" options={['Penulis pertama', 'Korespondensi', 'Anggota']} required/><SelectInput label="Jenis (Buku/Jurnal/Konferensi/Prosiding/Media)" options={['Buku', 'Jurnal', 'Konferensi', 'Prosiding', 'Media massa']} required/><TextInput label="Tautan (opsional)"/><TextInput label="Judul" required wide/><UploadInput label="Dokumen publikasi"/></div></div></FormShell>;
}

function ProductForm() {
  return <FormShell category="Produk/Jasa" breadcrumb="Produk/Jasa › Tambah" title="Tambah Produk/Jasa"><div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Nama produk/jasa" required/><TextInput label="Tahun" type="number" required/><TextInput label="Deskripsi produk/jasa" required wide/><UploadInput label="Bukti penggunaan"/></div></div></FormShell>;
}

function OutputForm() {
  return <FormShell category="Luaran" breadcrumb="Luaran › Tambah" title="Tambah Luaran Penelitian/PkM"><div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><SelectInput label="Kelompok luaran" options={['HKI', 'Teknologi tepat guna', 'Produk', 'Karya seni', 'Rekayasa sosial', 'Buku ISBN', 'Bab buku']} required/><ChoiceInput label="Peran" options={['Ketua', 'Anggota']} required/><TextInput label="Tahun" type="number" required/><TextInput label="Judul luaran" required wide/></div></div></FormShell>;
}

function IntegrationForm() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; apiClient.get('/dosen/saya/mata-kuliah', { params: { page: 1, per_page: 100 } }).then((response) => { if (active) setCourses(responseRows(response)); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, []);
  return <FormShell category="Integrasi" breadcrumb="Integrasi › Tambah" title="Tambah Integrasi Pembelajaran"><div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><Field label="Mata kuliah"><select name="ID mata kuliah" required defaultValue=""><option value="">Pilih mata kuliah</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.kode} · {course.nama}</option>)}</select></Field><TextInput label="Tahun" type="number" required/><SelectInput label="Bentuk integrasi" options={['Materi tambahan', 'Studi kasus', 'Bab buku ajar']} required/></div>{error && <p role="alert">{error}</p>}</div></FormShell>;
}

function DosenDashboard() {
  const account = getCurrentAccount();
  const [counts, setCounts] = useState({});
  const [documents, setDocuments] = useState(0);
  const [deletions, setDeletions] = useState([]);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      ...categories.map((category) => listFacultyRecordsApi(category).then((rows) => [category, Array.isArray(rows) ? rows.length : rows ? 1 : 0])),
      apiClient.get('/dokumen/saya', { params: { page: 1, per_page: 100 } }).then((response) => ['Dokumen', responseRows(response).length]),
      apiClient.get('/permintaan-hapus/saya', { params: { page: 1, per_page: 100 } }).then((response) => ['Penghapusan', responseRows(response)]),
      listFacultyRecordsApi('Profil').then((rows) => ['ProfilData', (Array.isArray(rows) ? rows[0] : rows) || null]),
    ]).then((results) => {
      if (!active) return;
      const next = Object.fromEntries(results.filter(([key]) => key !== 'Penghapusan' && key !== 'ProfilData'));
      setCounts(next); setDocuments(next.Dokumen || 0); setDeletions(results.find(([key]) => key === 'Penghapusan')?.[1] || []); setProfile(results.find(([key]) => key === 'ProfilData')?.[1] || null);
    }).catch((reason) => { if (active) setError(getApiError(reason)); });
    return () => { active = false; };
  }, []);
  const links = [['D-02', 'Profil'], ['D-03', 'Rekognisi'], ['PB-1', 'Penelitian'], ['D-05', 'Pengabdian'], ['D-06', 'Publikasi'], ['D-07', 'Produk/Jasa'], ['D-08', 'Luaran'], ['D-09', 'Integrasi']];
  return <div className="dosen-screen"><Heading breadcrumb="Beranda" title="Beranda Dosen"/>{error && <p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-profile-summary"><span className="dosen-person-icon" aria-hidden="true"/><button type="button" className="dosen-profile-identity" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}><b>{account?.nama || 'Profil dosen'} <span aria-hidden="true">⌄</span></b><small>{[profile?.nidn_nuptk, account?.peran?.find?.((item) => item.peran === 'dosen')?.prodi?.nama, profile?.bidang_keahlian].filter(Boolean).join(' · ') || 'Lengkapi profil akademik.'}</small></button><div className="dosen-progress"><b>Profil akademik</b><span><i/></span></div></section>{profileOpen && <section className="dosen-list-panel dosen-dashboard-profile"><div><b>Email</b><span>{account?.email || '—'}</span></div><div><b>NIDN/NUPTK</b><span>{profile?.nidn_nuptk || '—'}</span></div><div><b>Bidang keahlian</b><span>{profile?.bidang_keahlian || '—'}</span></div><Link to="/app/D-02">Lihat profil →</Link></section>}<section className="dosen-metrics"><article><span>Data profil dan butir</span><b>{Object.values(counts).filter((value) => typeof value === 'number').reduce((sum, value) => sum + value, 0)}</b></article><article><span>Dokumen tersimpan</span><b>{documents}</b></article><article><span>Permintaan hapus</span><b>{deletions.length}</b></article></section><section className="dosen-section"><h2>Data saya</h2><div className="dosen-data-cards">{links.map(([code, label]) => <Link key={code} to={`/app/${code}`}><b>{label}</b><small>{counts[label] ?? '—'} data</small><span>Buka ›</span></Link>)}</div></section><section className="dosen-section dosen-delete-preview"><div className="dosen-section-title"><h2>Permintaan hapus terbaru</h2><Link to="/app/D-12">Lihat semua ›</Link></div><div className="dosen-table-wrap"><table><thead><tr><th>Data</th><th>Tanggal</th><th>Alasan</th><th>Status</th></tr></thead><tbody>{deletions.slice(0, 3).map((row) => <tr key={row.id}><td>{row.ringkasan_data || row.entitas_tipe}</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '—'}</td><td>{row.alasan || '—'}</td><td>{row.status}</td></tr>)}{deletions.length === 0 && <tr><td colSpan="4" className="dosen-empty">Belum ada permintaan hapus.</td></tr>}</tbody></table></div></section></div>;
}

function DataList({ screen }) {
  const category = screen.code === 'PB-1' ? 'Penelitian' : categories.find((name) => categoryRoutes[name] === screen.code) || 'Penelitian';
  const { rows, loading, error } = useRows(category);
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const fields = category === 'Penelitian' || category === 'Pengabdian'
    ? ['tahun', 'peran', 'judul', 'skema', 'sumber_dana', 'jumlah_dana']
    : Object.keys(filtered[0] || {}).filter((key) => !['id', 'dokumen', 'permintaan_hapus_menunggu'].includes(key));
  return <div className="dosen-screen"><Heading breadcrumb={category} title={category}/><section className="dosen-list-panel"><div className="dosen-list-toolbar"><input aria-label="Cari data" placeholder="Cari..." value={query} onChange={(event) => setQuery(event.target.value)}/><Link to={`/app/${categoryRoutes[category] === 'PB-1' ? 'PB-2' : categoryRoutes[category]}`} className="dosen-primary-link">＋ Tambah data</Link></div>{error && <p className="dosen-save-message" role="alert">{error}</p>}<div className="dosen-table-wrap"><table><thead><tr>{fields.map((field) => <th key={field}>{field.replaceAll('_', ' ')}</th>)}<th>Dokumen</th><th>Aksi</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}>{fields.map((field) => <td key={field}>{row[field] ?? '—'}</td>)}<td>{row.dokumen?.nama_asli || '—'}</td><td><Link to={`/app/PB-3?category=${encodeURIComponent(category)}&item=${row.id}`}>Lihat</Link>{entityTypes[category] && <> · <Link to={`/app/D-12b?category=${encodeURIComponent(category)}&item=${row.id}`}>Ajukan hapus</Link></>}</td></tr>)}{!filtered.length && <tr><td colSpan={fields.length + 2} className="dosen-empty">{loading ? 'Memuat dari server…' : 'Belum ada data yang sesuai.'}</td></tr>}</tbody></table></div></section></div>;
}

function ResearchDetail() {
  const [params] = useSearchParams();
  const category = params.get('category') || 'Penelitian';
  const item = params.get('item') || '';
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const endpoint = apiResources[category];
  useEffect(() => { let active = true; if (!endpoint || !item) return undefined; apiClient.get(`${endpoint}/${encodeURIComponent(item)}`).then((response) => { if (active) setRow(unwrapApiData(response)); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, [endpoint, item]);
  return <div className="dosen-screen"><Heading breadcrumb={`${category} › Detail`} title={`Detail ${category}`}/>{error && <p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-list-panel"><dl className="dosen-detail-grid">{Object.entries(row || {}).filter(([key, value]) => !['id', 'dokumen', 'permintaan_hapus_menunggu'].includes(key) && typeof value !== 'object').map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{String(value ?? '—')}</dd></div>)}{row?.dokumen && <div><dt>Dokumen</dt><dd>{row.dokumen.nama_asli || '—'}</dd></div>}</dl><div className="dosen-form-actions"><Link className="dosen-cancel" to={`/app/${categoryRoutes[category] || 'PB-1'}`}>Kembali ke daftar</Link>{entityTypes[category] && <Link className="dosen-primary-link" to={`/app/D-12b?category=${encodeURIComponent(category)}&item=${item}`}>Ajukan hapus</Link>}</div></section></div>;
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const load = () => apiClient.get('/dokumen/saya', { params: { page: 1, per_page: 100 } }).then((response) => setDocuments(responseRows(response))).catch((reason) => setError(getApiError(reason)));
  useEffect(() => { load(); }, []);
  const filtered = documents.filter((document) => String(document.nama_asli || '').toLowerCase().includes(query.toLowerCase()));
  const open = async (id) => { try { const url = await getApiDocumentUrl(id); if (!url) throw new Error('Server tidak memberikan tautan dokumen.'); window.open(url, '_blank', 'noopener,noreferrer'); } catch (reason) { setError(getApiError(reason)); } };
  return <div className="dosen-screen"><div className="dosen-page-row"><Heading breadcrumb="Dokumen Saya" title="Dokumen Saya"/><label className="dosen-primary-link">＋ Unggah dokumen<input type="file" accept="application/pdf,.pdf" hidden onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setError('Ukuran dokumen maksimal 5 MB.'); return; } try { const document = await uploadApiDocument(file, 'bukti_dosen'); setFeedback(`${document.nama_asli || file.name} diunggah ke server.`); await load(); } catch (reason) { setError(getApiError(reason)); } finally { event.target.value = ''; } }}/></label></div>{error && <p className="dosen-save-message" role="alert">{error}</p>}{feedback && <p className="dosen-save-message" role="status">{feedback}</p>}<section className="dosen-list-panel"><div className="dosen-doc-tools"><input placeholder="Cari berkas…" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="dosen-table-wrap"><table><thead><tr><th>Nama berkas</th><th>Jenis</th><th>Ukuran</th><th>Aksi</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.id}><td>{document.nama_asli}</td><td>{document.kategori || document.mime || '—'}</td><td>{((document.ukuran_byte || 0) / 1024 / 1024).toFixed(2)} MB</td><td><button type="button" onClick={() => open(document.id)}>Buka / unduh</button></td></tr>)}{!filtered.length && <tr><td colSpan="4" className="dosen-empty">Tidak ada dokumen tersimpan di server.</td></tr>}</tbody></table></div></section><p className="dosen-note">Penghapusan dokumen tidak tersedia di kontrak API saat ini.</p></div>;
}

function DocumentPicker() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; apiClient.get('/dokumen/saya', { params: { page: 1, per_page: 100, kategori: 'bukti_dosen' } }).then((response) => { if (active) setDocuments(responseRows(response)); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, []);
  const filtered = documents.filter((document) => String(document.nama_asli || '').toLowerCase().includes(query.toLowerCase()));
  return <div className="dosen-screen"><Heading breadcrumb="Dokumen Saya" title="Pilih dokumen tersimpan"/><section className="dosen-list-panel"><input placeholder="Cari dokumen…" value={query} onChange={(event) => setQuery(event.target.value)}/>{error && <p role="alert">{error}</p>}<div className="dosen-table-wrap"><table><thead><tr><th>Nama dokumen</th><th>Kategori</th><th>Ukuran</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.id}><td>{document.nama_asli}</td><td>{document.kategori}</td><td>{((document.ukuran_byte || 0) / 1024 / 1024).toFixed(2)} MB</td></tr>)}{!filtered.length && <tr><td colSpan="3">Tidak ada dokumen yang tersedia.</td></tr>}</tbody></table></div></section></div>;
}

function DeletionDialog() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const category = params.get('category') || 'Penelitian';
  const item = params.get('item') || '';
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const endpoint = apiResources[category];
  useEffect(() => { let active = true; if (!endpoint || !item) return undefined; apiClient.get(`${endpoint}/${encodeURIComponent(item)}`).then((response) => { if (active) setRow(unwrapApiData(response)); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, [endpoint, item]);
  const submit = async (event) => {
    event.preventDefault(); if (!row || !entityTypes[category]) return;
    setSaving(true); setError('');
    try { await apiClient.post('/permintaan-hapus', { entitas_tipe: entityTypes[category], entitas_id: Number(row.id), alasan: event.currentTarget.elements.reason.value }); setSubmitted(true); }
    catch (reason) { setError(getApiError(reason)); }
    finally { setSaving(false); }
  };
  const title = row?.judul || row?.nama || row?.nama_produk || `${category} #${item}`;
  return <div className="dosen-modal-backdrop"><form className="dosen-modal dosen-delete-modal" onSubmit={submit}><h2>Ajukan penghapusan data</h2><p>Permintaan akan dikirim ke Kajur. Data hanya dihapus setelah permintaan disetujui.</p><Field label="Data yang diminta hapus"><input readOnly value={title}/></Field><Field label="Alasan penghapusan"><textarea name="reason" required rows="4"/></Field>{error && <p role="alert">{error}</p>}{submitted && <p role="status">Permintaan penghapusan tersimpan di server.</p>}<div className="dosen-modal-actions"><Button type="submit" disabled={!row||saving||submitted}>{saving ? 'Mengirim…' : 'Kirim permintaan'}</Button><button type="button" className="dosen-cancel" onClick={() => navigate(-1)}>Kembali</button></div></form></div>;
}

function DeletionPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; apiClient.get('/permintaan-hapus/saya', { params: { page: 1, per_page: 100 } }).then((response) => { if (active) setRows(responseRows(response)); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, []);
  const labels = { menunggu: 'Menunggu persetujuan', disetujui: 'Disetujui', ditolak: 'Ditolak' };
  return <div className="dosen-screen"><div className="dosen-page-row"><Heading breadcrumb="Permintaan Hapus" title="Permintaan Hapus"/></div>{error && <p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-list-panel"><div className="dosen-table-wrap"><table><thead><tr><th>Data</th><th>Tanggal</th><th>Alasan</th><th>Status</th><th>Catatan Kajur</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.ringkasan_data || row.entitas_tipe}</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '—'}</td><td>{row.alasan || '—'}</td><td>{labels[row.status] || row.status}</td><td>{row.catatan_kajur || '—'}</td></tr>)}{!rows.length && <tr><td colSpan="5" className="dosen-empty">Belum ada permintaan penghapusan dari server.</td></tr>}</tbody></table></div></section></div>;
}

function AllDataPage() {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all(categories.filter((category) => category !== 'Profil').map(async (category) => ({ category, rows: await listFacultyRecordsApi(category) })))
      .then((result) => { if (active) setRecords(result.flatMap(({ category, rows }) => (Array.isArray(rows) ? rows : rows ? [rows] : []).map((row) => ({ ...row, category })))); })
      .catch((reason) => { if (active) setError(getApiError(reason)); });
    return () => { active = false; };
  }, []);
  const visible = records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(visible.map((record) => record.category))];
  return <div className="dosen-screen"><Heading breadcrumb="Data Saya" title="Data yang sudah disimpan"/><p className="dosen-save-message">Data berasal dari server dan hanya dapat dibaca pada halaman ini.</p>{error && <p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-list-panel"><input className="dosen-search" aria-label="Cari data tersimpan" placeholder="Cari lintas butir…" value={query} onChange={(event) => setQuery(event.target.value)}/>{groups.length === 0 ? <p className="dosen-empty">Belum ada data formulir tersimpan.</p> : <div className="dosen-saved-records">{groups.map((category) => { const rows = visible.filter((record) => record.category === category); const keys = [...new Set(rows.flatMap((record) => Object.keys(record).filter((key) => !['id', 'category', 'dokumen', 'permintaan_hapus_menunggu'].includes(key))))]; return <details className="dosen-saved-record" key={category}><summary><b>{category}</b><span>{rows.length} data</span></summary><div className="dosen-table-wrap"><table><thead><tr>{keys.map((key) => <th key={key}>{key.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((record) => <tr key={record.id}>{keys.map((key) => <td key={key}>{String(record[key] ?? '—')}</td>)}</tr>)}</tbody></table></div></details>; })}</div>}</section></div>;
}

export default function DosenPage({ screen }) {
  if (screen.code === 'D-01') return <DosenDashboard/>;
  if (screen.code === 'D-02') return <ProfileForm/>;
  if (screen.code === 'D-03') return <RecognitionForm/>;
  if (screen.code === 'D-05') return <ResearchForm category="Pengabdian"/>;
  if (screen.code === 'D-06') return <PublicationForm/>;
  if (screen.code === 'D-07') return <ProductForm/>;
  if (screen.code === 'D-08') return <OutputForm/>;
  if (screen.code === 'D-09') return <IntegrationForm/>;
  if (screen.code === 'D-10') return <DocumentsPage/>;
  if (screen.code === 'D-11') return <DocumentPicker/>;
  if (screen.code === 'D-12') return <DeletionPage/>;
  if (screen.code === 'D-12b') return <div className="dosen-screen"><DataList screen={{ code: 'PB-1', title: 'Penelitian' }}/><DeletionDialog/></div>;
  if (screen.code === 'D-13') return <AllDataPage/>;
  if (screen.code === 'PB-2') return <ResearchForm/>;
  if (screen.code === 'PB-3') return <ResearchDetail/>;
  return <DataList screen={screen}/>;
}
