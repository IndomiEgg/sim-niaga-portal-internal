import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Primitives';
import { addDemoDocument, getDemoDocuments, getUploadError, openDemoDocument, removeDemoDocument, subscribeToDemoDocuments } from '../../services/demoDocuments';
import { getDemoUser, getDemoUserProgram, getFacultyRecords, saveFacultyRecord } from '../../services/demoFacultyData';
import { apiClient, getApiDocumentUrl, getApiError, uploadApiDocument, unwrapApiData } from '../../services/api';
import { listFacultyRecordsApi, saveFacultyRecordApi } from '../../services/apiFacultyData';
import { isLocalPreview } from '../../services/previewMode';


function Heading({ breadcrumb, title }) {
  const groups = breadcrumb.split(' › ');
  const pathFor = routeForBreadcrumb;
  return <div className="dosen-heading"><nav className="dosen-breadcrumb" aria-label="Jejak halaman"><Link to="/app/D-13">Data Saya</Link>{groups.map((label, index) => <span key={`${label}-${index}`}>› {index < groups.length - 1 || label !== 'Tambah' ? pathFor(label) ? <Link to={'/app/' + pathFor(label)}>{label}</Link> : <Link to="/app/D-13">{label}</Link> : <b>{label}</b>}</span>)}</nav><h1>{title}</h1></div>;
}

function routeForBreadcrumb(label) {
  return ({ Profil: 'D-02', Rekognisi: 'D-03', Penelitian: 'PB-1', 'Pengabdian (A4)': 'D-05', Pengabdian: 'D-05', 'Publikasi (A5)': 'D-06', Publikasi: 'D-06', 'Produk/Jasa (A6)': 'D-07', 'Luaran Penelitian/PkM (A7)': 'D-08', Luaran: 'D-08', 'Integrasi Pembelajaran (A8)': 'D-09', Integrasi: 'D-09', 'Dokumen Saya': 'D-10', 'Permintaan Hapus': 'D-12' })[label];
}

function useDemoDocuments() {
  const [documents,setDocuments]=useState([]);
  useEffect(()=>{
    let active=true;
    const refresh=()=>getDemoDocuments().then((items)=>{if(active)setDocuments(items);}).catch(()=>{});
    refresh();
    const unsubscribe=subscribeToDemoDocuments(refresh);
    return()=>{active=false;unsubscribe();};
  },[]);
  return documents;
}

function DosenDashboard() {
  const documents=useDemoDocuments();
  const user=getDemoUser();
  const records=getFacultyRecords().filter((record)=>record.ownerEmail===user?.email?.toLowerCase());
  const savedCount=(category)=>records.filter((record)=>record.category===category).length;
  const profile=records.find((record)=>record.category==='Profil')?.values||{};
  const [profileOpen,setProfileOpen]=useState(false);
  const profilePhoto=localStorage.getItem(`simniaga-dosen-profile-photo:${user?.email?.toLowerCase()||''}`);
  let deleteRequests=[];try{deleteRequests=JSON.parse(localStorage.getItem('simniaga-dosen-delete-requests')||'[]');}catch{/* Invalid saved demo data is ignored. */}
  const deleteCount=deleteRequests.filter((request)=>!request.ownerEmail||request.ownerEmail===user?.email?.toLowerCase()).length;
  const dataCounts={
    'D-02':savedCount('Profil'),'D-03':savedCount('Rekognisi'),'PB-1':savedCount('Penelitian'),
    'D-05':savedCount('Pengabdian'),'D-06':savedCount('Publikasi'),'D-07':savedCount('Produk/Jasa'),
    'D-08':savedCount('Luaran'),'D-09':savedCount('Integrasi'),
  };
  const cards = [
    ['D-02', 'Profil'],
    ['D-03', 'Rekognisi'],
    ['PB-1', 'Penelitian'],
    ['D-05', 'Pengabdian'],
    ['D-06', 'Publikasi'],
    ['D-07', 'Produk/Jasa'],
    ['D-08', 'Luaran'],
    ['D-09', 'Integrasi'],
  ];
  return <div className="dosen-screen">
    <Heading breadcrumb="Beranda" title="Beranda Dosen" />
    <section className="dosen-profile-summary">
      {profilePhoto?<img className="dosen-person-icon dosen-profile-photo" src={profilePhoto} alt="Foto profil dosen"/>:<span className="dosen-person-icon" aria-hidden="true" />}
      <button type="button" className="dosen-profile-identity" aria-expanded={profileOpen} onClick={()=>setProfileOpen((open)=>!open)}><b>{profile['Nama dosen']||user?.name||user?.email||'Nama dosen belum diisi'} <span aria-hidden="true">⌄</span></b><small>{[profile['NIDN/NUPTK'],getDemoUserProgram('Dosen'),profile['Bidang keahlian']].filter(Boolean).join(' · ')||'Lengkapi profil untuk menampilkan ringkasan.'}</small></button>
      <div className="dosen-progress"><b>Kelengkapan profil</b><span><i /></span></div>
    </section>
    {profileOpen&&<section className="dosen-list-panel dosen-dashboard-profile" aria-label="Detail profil"><div><b>Email</b><span>{user?.email||'—'}</span></div><div><b>Program studi</b><span>{getDemoUserProgram('Dosen')||'—'}</span></div>{Object.entries(profile).filter(([key])=>!['recordId','ownerEmail','program','Foto profil'].includes(key)&&!key.startsWith('__doc_')).map(([label,value])=><div key={label}><b>{label}</b><span>{value||'—'}</span></div>)}<Link to="/app/D-02">Lihat dan lengkapi profil →</Link></section>}
    <section className="dosen-metrics" aria-label="Ringkasan data dosen">
      <article><span>Data tersimpan</span><b>{String(Object.values(dataCounts).reduce((sum,count)=>sum+count,0)).padStart(2,'0')}</b></article>
      <article><span>Dokumen tersimpan</span><b>{String(documents.length).padStart(2,'0')}</b></article>
      <article><span>Kelengkapan profil</span><b>%</b></article>
      <article><span>Permintaan hapus</span><b>{String(deleteCount).padStart(2,'0')}</b></article>
    </section>
    <section className="dosen-section">
      <h2>Data saya</h2>
      <div className="dosen-data-cards">{cards.map(([code, label]) => <Link key={code} to={'/app/' + code}><b>{label}</b><small>{dataCounts[code]||0} data</small><span>Buka ›</span></Link>)}</div>
    </section>
    <section className="dosen-section dosen-delete-preview">
      <div className="dosen-section-title"><h2>Permintaan hapus terbaru</h2><Link to="/app/D-12">Lihat semua ›</Link></div>
      <div className="dosen-table-wrap"><table><thead><tr><th>Data</th><th>Tanggal</th><th>Alasan</th><th>Status</th></tr></thead><tbody>{deleteRequests.slice(-3).reverse().map((request,index)=><tr key={`${request.data}-${index}`}><td>{request.data}</td><td>{request.requestedAt}</td><td>{request.reason}</td><td>{request.status}</td></tr>)}{deleteCount===0&&<tr><td colSpan="4" className="dosen-empty">Belum ada permintaan hapus.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}

function Field({ label, children, wide = false }) {
  return <label className={'dosen-field' + (wide ? ' dosen-field-wide' : '')}><span>{label}</span>{children}</label>;
}

function TextInput({ label, placeholder = 'Isi di sini', wide = false, type = 'text', defaultValue }) {
  return <Field label={label} wide={wide}><input name={label} type={type} placeholder={placeholder} defaultValue={defaultValue} /></Field>;
}

function SelectInput({ label, options = [], wide = false, defaultValue = '' }) {
  return <Field label={label} wide={wide}><select name={label} defaultValue={defaultValue}><option value="">Isi di sini</option>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}

function ChoiceInput({ label, options, defaultValue = '' }) {
  return <Field label={label}><span className="dosen-choice">{options.map((option) => <label key={option}><input type="radio" name={label} value={option} defaultChecked={defaultValue===option} /> {option}</label>)}</span></Field>;
}

function UploadInput({ label, reusable = true }) {
  const selectionKey=`simniaga-selected-doc:${label}`;
  const [selected,setSelected]=useState(()=>localStorage.getItem(selectionKey)||'');
  const [documentId,setDocumentId]=useState(()=>localStorage.getItem(`simniaga-selected-doc-id:${label}`)||'');
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const documents=useDemoDocuments();
  const [showPicker,setShowPicker]=useState(false);
  const [query,setQuery]=useState('');
  const matches=documents.filter((document)=>document.name.toLowerCase().includes(query.toLowerCase()));
  const selectDocument=(document)=>{setDocumentId(String(document.id));setSelected(document.name);localStorage.setItem(selectionKey,document.name);localStorage.setItem(`simniaga-selected-doc-id:${label}`,String(document.id));setShowPicker(false);};
  return <div className="dosen-upload-field"><b>{label} (PDF)</b><div className="dosen-upload-control"><label>{selected?`Dokumen: ${selected}`:'Seret & lepas berkas di sini, atau Pilih berkas'}<input name={label} type="file" accept="application/pdf,.pdf" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const message=getUploadError(file);if(message){setError(message);e.target.value='';return;}setError('');setUploading(true);try{if(isLocalPreview()){const local=await addDemoDocument(file);selectDocument(local);return;}const doc=await uploadApiDocument(file,'bukti_dosen');const local=await addDemoDocument(file);const displayName=doc.nama_asli||file.name;const id=String(doc.id);setDocumentId(id);setSelected(displayName);localStorage.setItem(selectionKey,displayName);localStorage.setItem(`simniaga-selected-doc-id:${label}`,id);localStorage.setItem(`simniaga-demo-doc-link:${id}`,local.id);}catch(err){setError(getApiError(err));e.target.value='';}finally{setUploading(false);}}}/></label>{reusable&&<button type="button" onClick={()=>setShowPicker(true)}>Pilih dokumen tersimpan</button>}</div><input type="hidden" name={`__doc_${label}`} value={documentId}/>{uploading&&<small>{isLocalPreview()?'Menyimpan berkas pratinjau…':'Mengunggah ke server…'}</small>}{error&&<small role="alert">{error}</small>}{showPicker&&<div className="dosen-modal-backdrop"><section className="dosen-modal dosen-picker" role="dialog" aria-modal="true" aria-label="Pilih dokumen tersimpan"><h2>Pilih dokumen tersimpan</h2><input aria-label="Cari dokumen" placeholder="Cari dokumen..." value={query} onChange={(event)=>setQuery(event.target.value)}/><div className="dosen-picker-layout"><div>{matches.map((document)=><button type="button" key={document.id} className="dosen-picker-row" onClick={()=>selectDocument(document)}>{document.name}</button>)}{matches.length===0&&<p className="dosen-empty">{query?'Tidak ada dokumen yang cocok.':'Belum ada dokumen tersimpan.'}</p>}</div></div><div className="dosen-modal-actions"><button type="button" className="dosen-cancel" onClick={()=>setShowPicker(false)}>Tutup</button></div></section></div>}</div>;
}

function FormShell({ breadcrumb, title, children, noteTitle = 'Keterangan', note }) {
  const [saved, setSaved] = useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [confirming,setConfirming]=useState(false);
  const [pendingValues,setPendingValues]=useState(null);
  const firstCrumb = breadcrumb.split(' › ')[0];
  const parentCode = firstCrumb === 'Penelitian' ? 'PB-1' : 'D-13';
  const dataKey = `simniaga-dosen-${firstCrumb.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const saveData = async () => {
    if (!pendingValues) return;
    const submittedValues = pendingValues;
    setSaving(true);setError('');
    try {
      const recordId = isLocalPreview()
        ? globalThis.crypto?.randomUUID?.() || String(Date.now())
        : (await saveFacultyRecordApi(firstCrumb,submittedValues))?.id || '';
      const values = { ...submittedValues, recordId };
      const prior=JSON.parse(localStorage.getItem(dataKey)||'[]');
      const remaining=firstCrumb==='Profil'?prior.filter((row)=>row.ownerEmail!==values.ownerEmail):prior;
      localStorage.setItem(dataKey,JSON.stringify([...remaining,values]));
      saveFacultyRecord({category:firstCrumb,values});
      setSaved(true);setConfirming(false);setPendingValues(null);
    } catch(err) { setError(getApiError(err));setConfirming(false); }
    finally { setSaving(false); }
  };
  return <div className="dosen-screen">
    <Heading breadcrumb={breadcrumb} title={title} />
    <div className={"dosen-form-layout " + (note ? "dosen-form-layout-with-note" : "dosen-form-layout-wide")}>
      <form className="dosen-form-card" onInput={()=>{setSaved(false);setError('');}} onSubmit={(event) => { event.preventDefault(); const values=Object.fromEntries([...new FormData(event.currentTarget)].map(([key,value])=>[key,value instanceof File?value.name:value])); const user=getDemoUser(); values.ownerEmail=user?.email?.toLowerCase()||''; values.program=getDemoUserProgram('Dosen');setPendingValues(values);setConfirming(true); }}>
        {children}
        <div className="dosen-form-actions"><Button type="submit" disabled={saved||saving}>{saving?'Menyimpan…':saved ? 'Tersimpan' : 'Simpan'}</Button><Link to={'/app/'+parentCode} className="dosen-cancel">Batal</Link></div>
        {error&&<p className="dosen-save-message" role="alert">{error}</p>}{saved && <p className="dosen-save-message" role="status">{isLocalPreview()?'Data berhasil disimpan pada pratinjau lokal.':'Data berhasil disimpan ke server SIM.'}</p>}
      </form>
      {note && <aside className="dosen-note"><h2>{noteTitle}</h2>{note}</aside>}
    </div>
    {confirming&&<div className="dosen-modal-backdrop"><section className="dosen-modal dosen-delete-modal" role="dialog" aria-modal="true" aria-labelledby="save-confirm-title"><h2 id="save-confirm-title">Pastikan data sudah benar</h2><p>Setelah disimpan, data ini tidak dapat diubah dari halaman dosen. Periksa kembali seluruh isian dan dokumen sebelum melanjutkan.</p><div className="dosen-modal-actions"><Button type="button" kind="secondary" disabled={saving} onClick={()=>setConfirming(false)}>Periksa lagi</Button><Button type="button" disabled={saving} onClick={saveData}>{saving?'Menyimpan…':'Ya, simpan data'}</Button></div></section></div>}
  </div>;
}

function ProfileForm() {
  const user=getDemoUser();
  const existing=getFacultyRecords().find((record)=>record.category==='Profil'&&record.ownerEmail===user?.email?.toLowerCase())?.values||{};
  return <FormShell breadcrumb="Profil" title="Profil Dosen">
    <div className="dosen-form-section"><h2>Identitas</h2><div className="dosen-fields-grid"><TextInput label="Nama dosen" placeholder="(otomatis)" defaultValue={existing['Nama dosen']||user?.name||''} /><TextInput label="NIDN/NUPTK" defaultValue={existing['NIDN/NUPTK']||''} /><TextInput label="Bidang keahlian" defaultValue={existing['Bidang keahlian']||''} /><ChoiceInput label="Kesesuaian dengan kompetensi inti PS" options={['Sesuai', 'Tidak sesuai']} defaultValue={existing['Kesesuaian dengan kompetensi inti PS']||''} /></div></div>
    <div className="dosen-form-section"><h2>Pendidikan pasca sarjana</h2><div className="dosen-fields-grid"><SelectInput label="Magister/Terapan/Spesialis" options={['Magister', 'Magister Terapan', 'Spesialis']} defaultValue={existing['Magister/Terapan/Spesialis']||''} /><TextInput label="Asal pendidikan magister" defaultValue={existing['Asal pendidikan magister']||''} /><SelectInput label="Doktor/Terapan/Spesialis" options={['Doktor', 'Doktor Terapan', 'Spesialis']} defaultValue={existing['Doktor/Terapan/Spesialis']||''} /><TextInput label="Asal pendidikan doktor" defaultValue={existing['Asal pendidikan doktor']||''} /><UploadInput label="Bukti pendidikan (PDF)" /></div></div>
    <div className="dosen-form-section"><h2>Jabatan dan sertifikat</h2><div className="dosen-fields-grid"><SelectInput label="Jabatan akademik" options={['Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Guru Besar/Profesor']} defaultValue={existing['Jabatan akademik']||''} /><TextInput label="No. sertifikat pendidik" defaultValue={existing['No. sertifikat pendidik']||''} /><UploadInput label="Bukti jabatan akademik (PDF)" /><UploadInput label="Sertifikat pendidik (PDF)" /><UploadInput label="Sertifikat kompetensi/profesi/industri (PDF) + Tambah" /><ProfilePhotoInput /></div></div>
    <div className="dosen-form-section"><h2>Mata kuliah</h2><div className="dosen-fields-grid"><TextInput label="MK pada PS diakreditasi (tag)" /><TextInput label="MK pada PS lain (tag)" /><ChoiceInput label="Kesesuaian bidang keahlian dengan MK" options={['Sesuai', 'Tidak sesuai']} /></div></div>
  </FormShell>;
}

function ProfilePhotoInput() {
  const user=getDemoUser();
  const key=`simniaga-dosen-profile-photo:${user?.email?.toLowerCase()||''}`;
  const [photo,setPhoto]=useState(()=>localStorage.getItem(key)||'');
  const [error,setError]=useState('');
  return <div className="dosen-upload-field"><b>Foto profil</b>{photo&&<img className="dosen-photo-preview" src={photo} alt="Pratinjau foto profil"/>}<label className="dosen-upload-control">{photo?'Ganti foto profil':'Pilih foto profil'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){setError('Ukuran foto maksimal 5 MB.');event.target.value='';return;}if(!isLocalPreview()){setError('Penyimpanan foto profil ke server belum tersedia pada kontrak API.');event.target.value='';return;}const reader=new FileReader();reader.onload=()=>{const value=String(reader.result||'');localStorage.setItem(key,value);setPhoto(value);setError('');};reader.onerror=()=>setError('Foto gagal dibaca. Silakan pilih berkas lain.');reader.readAsDataURL(file);}}/></label><input type="hidden" name="Foto profil" value={photo}/>{error&&<small role="alert">{error}</small>}</div>;
}

function RecognitionForm() {
  return <FormShell breadcrumb="Rekognisi › Tambah" title="Tambah Rekognisi" note={<><p>a) Visiting lecturer/scholar</p><p>b) Keynote/Invited speaker</p><p>c) Editor/mitra bestari jurnal</p><p>d) Staf ahli/narasumber</p><p>e) Penghargaan prestasi</p></>}>
    <div className="dosen-form-section"><h2>Rekognisi</h2><div className="dosen-fields-grid"><TextInput label="Nama dosen" placeholder="(otomatis)" /><TextInput label="Bidang keahlian" /><SelectInput label="Jenis rekognisi (e)" options={['Visiting lecturer/scholar', 'Keynote/Invited speaker', 'Editor/mitra bestari jurnal', 'Staf ahli/narasumber', 'Penghargaan prestasi']} /><SelectInput label="Tingkat (Wilayah/Nasional/Internasional)" options={['Lokal', 'Regional', 'Nasional', 'Internasional']} /><TextInput label="Tahun" type="number" /><TextInput label="Deskripsi" wide /><UploadInput label="Bukti pendukung (PDF)" /></div></div>
  </FormShell>;
}

function ResearchForm() {
  return <FormShell breadcrumb="Penelitian › Tambah" title="Tambah Penelitian" note={<><p>Data penelitian yang terdokumentasi di Polmed.</p><p>Nama dosen terisi otomatis.</p></>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Tahun" type="number" /><TextInput label="Nama dosen" placeholder="(otomatis)" /><ChoiceInput label="Peran" options={['Ketua', 'Anggota']} /><TextInput label="Skema" /><TextInput label="Sumber dana" /><TextInput label="Jumlah pendanaan (Rp)" type="number" /><TextInput label="Judul penelitian" wide /><UploadInput label="Bukti lembar pengesahan (PDF)" /></div></div>
  </FormShell>;
}

function CommunityServiceForm() {
  return <FormShell breadcrumb="Pengabdian › Tambah" title="Tambah Pengabdian" note={<><p>Kegiatan terdokumentasi di Polmed</p><p>Nama terisi otomatis</p><p>Tidak ada tombol Hapus</p></>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><SelectInput label="Tahun" /><TextInput label="Nama dosen" placeholder="(otomatis)" /><ChoiceInput label="Peran" options={['Ketua', 'Anggota']} /><TextInput label="Skema" /><TextInput label="Sumber dana" /><TextInput label="Jumlah pendanaan (Rp)" type="number" /><TextInput label="Judul pengabdian" wide /><UploadInput label="Bukti lembar pengesahan (PDF)" /></div></div>
  </FormShell>;
}

function PublicationForm() {
  return <FormShell breadcrumb="Publikasi › Tambah" title="Tambah Publikasi" note={<><p>Link jurnal opsional</p><p>Nama terisi otomatis</p><p>Tidak ada tombol Hapus</p></>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Tahun" type="number" /><ChoiceInput label="Peran" options={['Penulis pertama', 'Korespondensi', 'Anggota']} /><SelectInput label="Jenis (Buku/Jurnal/Konferensi/Prosiding/Media)" options={['Buku', 'Jurnal', 'Konferensi', 'Prosiding', 'Media massa']} /><TextInput label="Tautan (opsional)" /><TextInput label="Judul" wide /><UploadInput label="Dokumen publikasi (PDF)" /></div></div>
  </FormShell>;
}

function ProductForm() {
  return <FormShell breadcrumb="Produk/Jasa › Tambah" title="Tambah Produk/Jasa" note={<><p>Digunakan industri/masyarakat</p><p>Nama terisi otomatis</p><p>Tidak ada tombol Hapus</p></>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Nama dosen" placeholder="(otomatis)" /><TextInput label="Nama produk/jasa" /><TextInput label="Tahun" type="number" /><TextInput label="Deskripsi produk/jasa" wide /><UploadInput label="Bukti penggunaan (PDF)" /></div></div>
  </FormShell>;
}

function OutputForm() {
  return <FormShell breadcrumb="Luaran › Tambah" title="Tambah Luaran Penelitian/PkM" note={<p>Luaran dicatat sesuai data penelitian atau PkM.</p>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="Nama dosen" placeholder="(otomatis)" /><SelectInput label="Kelompok luaran" options={['HKI', 'Teknologi tepat guna', 'Produk', 'Karya seni', 'Rekayasa sosial', 'Buku ISBN', 'Bab buku']} /><ChoiceInput label="Peran" options={['Ketua', 'Anggota']} /><TextInput label="Tahun" type="number" /><TextInput label="Judul luaran" wide /><UploadInput label="Bukti luaran (PDF)" /></div></div>
  </FormShell>;
}

function IntegrationForm() {
  return <FormShell breadcrumb="Integrasi › Tambah" title="Tambah Integrasi Pembelajaran" note={<><p>Materi tambahan, studi kasus, bab buku ajar</p><p>Nama terisi otomatis</p><p>Tidak ada tombol Hapus</p></>}>
    <div className="dosen-form-section"><h2>Isian</h2><div className="dosen-fields-grid"><TextInput label="ID mata kuliah" type="number" /><TextInput label="Tahun" type="number" /><SelectInput label="Bentuk integrasi" options={['Materi tambahan', 'Studi kasus', 'Bab buku ajar']} /></div></div>
  </FormShell>;
}

function DataList({ screen }) {
  const title = screen.code === 'PB-1' ? 'Penelitian' : screen.title;
  const storageKey = 'simniaga-dosen-penelitian';
  const [rows,setRows] = useState(() => { try { const all=JSON.parse(localStorage.getItem(storageKey)||'[]').filter((row)=>!row.softDeleted);const email=getDemoUser()?.email?.toLowerCase();return email?all.filter((row)=>row.ownerEmail===email):all; } catch { return []; } });
  const [loadError,setLoadError]=useState('');
  useEffect(()=>{if(isLocalPreview())return undefined;let active=true;listFacultyRecordsApi('Penelitian').then((data)=>{if(!active)return;const mapped=(Array.isArray(data)?data:[]).map((row)=>({recordId:row.id,Tahun:row.tahun,'Nama dosen':row.nama_dosen,Peran:row.peran,Skema:row.skema,'Sumber dana':row.sumber_dana,'Jumlah pendanaan (Rp)':row.jumlah_dana,'Judul penelitian':row.judul,'Bukti lembar pengesahan (PDF)':row.dokumen?.nama_asli||'',ownerEmail:getDemoUser()?.email?.toLowerCase()||''}));setRows(mapped);localStorage.setItem(storageKey,JSON.stringify(mapped));}).catch((error)=>{if(active)setLoadError(getApiError(error));});return()=>{active=false;};},[]);
  const [query, setQuery] = useState('');
  const filteredRows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()));
  return <div className="dosen-screen"><Heading breadcrumb={title} title={title} />{loadError&&<p className="dosen-save-message" role="alert">{loadError}</p>}<section className="dosen-list-panel"><div className="dosen-list-toolbar"><input aria-label="Cari data" placeholder="Cari..." value={query} onChange={e=>setQuery(e.target.value)} /><Link to="/app/PB-2" className="dosen-primary-link">＋ Tambah data</Link></div><div className="dosen-table-wrap"><table><thead><tr><th>Tahun</th><th>Nama dosen</th><th>Peran</th><th>Judul</th><th>Skema</th><th>Sumber dana</th><th>Jumlah (Rp)</th><th>Bukti</th><th>Aksi</th></tr></thead><tbody>{filteredRows.map((row,index)=><tr key={row.recordId||`${row['Judul penelitian']||'data'}-${index}`}><td>{row.Tahun||'—'}</td><td>{row['Nama dosen']||'—'}</td><td>{row.Peran||'—'}</td><td><Link to={`/app/PB-3?item=${row.recordId||index}`}>{row['Judul penelitian']||'Tanpa judul'}</Link></td><td>{row.Skema||'—'}</td><td>{row['Sumber dana']||'—'}</td><td>{row['Jumlah pendanaan (Rp)']||'—'}</td><td>{row['Bukti lembar pengesahan (PDF)']?'PDF':'—'}</td><td><Link to={`/app/PB-3?item=${row.recordId||index}`}>Lihat</Link> · <Link to={`/app/D-12b?item=${row.recordId||index}`}>Ajukan hapus</Link></td></tr>)}{filteredRows.length===0&&<tr><td colSpan="9" className="dosen-empty">{query?'Tidak ada data sesuai pencarian.':'Belum ada data tercatat.'}</td></tr>}</tbody></table></div></section></div>;
}

function ResearchDetail() {
  const [params] = useSearchParams();
  const [row,setRow]=useState(()=>{if(!isLocalPreview())return null;try{return JSON.parse(localStorage.getItem('simniaga-dosen-penelitian')||'[]').find((item)=>String(item.recordId)===params.get('item'))||null;}catch{return null;}});const [error,setError]=useState('');
  useEffect(()=>{if(isLocalPreview())return undefined;let active=true;apiClient.get(`/dosen/saya/penelitian/${params.get('item')}`).then((response)=>{if(active){const data=response.data?.data||response.data||{};setRow({Tahun:data.tahun,Peran:data.peran,Skema:data.skema,'Sumber dana':data.sumber_dana,'Jumlah pendanaan (Rp)':data.jumlah_dana,'Judul penelitian':data.judul});}}).catch((err)=>{if(active)setError(getApiError(err));});return()=>{active=false;};},[params]);
  return <div className="dosen-screen"><Heading breadcrumb="Penelitian › Detail" title="Detail Penelitian"/>{error&&<p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-list-panel"><div className="dosen-form-section"><h2>Isian</h2><dl className="dosen-detail-grid">{[['Tahun','Tahun'],['Peran','Peran'],['Skema','Skema'],['Sumber dana','Sumber dana'],['Jumlah pendanaan (Rp)','Jumlah pendanaan (Rp)'],['Judul penelitian','Judul penelitian']].map(([label,key])=><div key={key}><dt>{label}</dt><dd>{row?.[key]||'—'}</dd></div>)}</dl><div className="dosen-form-actions"><Link className="dosen-cancel" to="/app/PB-1">Kembali ke daftar</Link><Link className="dosen-primary-link" to={`/app/D-12b?item=${params.get('item')||''}`}>Ajukan hapus</Link></div></div></section></div>;
}

function DocumentsPage() {
  const documents=useDemoDocuments();const [query,setQuery]=useState('');const [type,setType]=useState('Semua jenis');const [deleteTarget,setDeleteTarget]=useState(null);const [feedback,setFeedback]=useState('');
  const user=getDemoUser();
  const records=getFacultyRecords().filter((record)=>record.ownerEmail===user?.email?.toLowerCase());
  const usagesFor=(document)=>records.flatMap((record)=>Object.entries(record.values||{}).filter(([key,value])=>key.startsWith('__doc_')&&(String(value)===String(document.id)||localStorage.getItem(`simniaga-demo-doc-link:${value}`)===document.id)).map(([key])=>`${record.category} · ${key.replace(/^__doc_/, '')}`));
  const filtered=documents.filter(doc=>(type==='Semua jenis'||doc.type===type)&&doc.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="dosen-screen"><div className="dosen-page-row"><Heading breadcrumb="Dokumen Saya" title="Dokumen Saya"/><label className="dosen-primary-link">＋ Unggah dokumen baru<input type="file" accept=".pdf,application/pdf" hidden onChange={async e=>{const file=e.target.files?.[0];const error=getUploadError(file);if(error){setFeedback(error);e.target.value="";return;}if(file){try{await addDemoDocument(file);setFeedback(`${file.name} ditambahkan ke Dokumen Saya.`);}catch(uploadError){setFeedback(uploadError.message||'Berkas gagal disimpan.');}}}}/></label></div>{feedback&&<p className="dosen-save-message" role="status">{feedback}</p>}<section className="dosen-list-panel"><div className="dosen-doc-tools"><input placeholder="Cari berkas..." value={query} onChange={e=>setQuery(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>Semua jenis</option><option>application/pdf</option></select></div><div className="dosen-table-wrap"><table><thead><tr><th>Nama berkas</th><th>Jenis</th><th>Ukuran</th><th>Tanggal unggah</th><th>Dipakai pada</th><th>Aksi</th></tr></thead><tbody>{filtered.map(doc=>{const usage=usagesFor(doc);return <tr key={doc.id}><td>{doc.name}</td><td>{doc.type||'Dokumen'}</td><td>{(doc.size/1024/1024).toFixed(2)} MB</td><td>{doc.uploadedAt}</td><td>{usage.length?usage.join(', '):'Belum digunakan'}</td><td><button type="button" onClick={()=>openDemoDocument(doc)}>Lihat</button> · <button type="button" onClick={()=>openDemoDocument(doc,true)}>Unduh</button> · <button type="button" onClick={()=>setDeleteTarget(doc)}>Hapus</button></td></tr>;})}{filtered.length===0&&<tr><td colSpan="6" className="dosen-empty">{query?'Tidak ada dokumen sesuai pencarian.':'Belum ada dokumen tersimpan.'}</td></tr>}</tbody></table></div><div className="dosen-pagination">Menampilkan {filtered.length} data</div></section>{deleteTarget&&<div className="dosen-modal-backdrop"><section className="dosen-modal dosen-delete-modal" role="dialog" aria-modal="true"><h2>Hapus dokumen dari Dokumen Saya?</h2><p><b>{deleteTarget.name}</b> akan dihapus dari daftar dokumen. Data formulir yang sudah disimpan tetap ada.</p><div className="dosen-modal-actions"><Button type="button" kind="secondary" onClick={()=>setDeleteTarget(null)}>Batal</Button><Button type="button" onClick={async()=>{await removeDemoDocument(deleteTarget.id);setDeleteTarget(null);setFeedback('Dokumen dihapus. Data formulir yang telah disimpan tetap dipertahankan.');}}>Hapus dokumen</Button></div></section></div>}</div>;
}

function DocumentPicker() {
  const navigate=useNavigate();
  const [activeTab, setActiveTab] = useState('Pilih dari tersimpan');
  const localDocuments=useDemoDocuments();const [remoteDocuments,setRemoteDocuments]=useState([]);const [query,setQuery]=useState('');const [selected,setSelected]=useState(null);const [uploaded,setUploaded]=useState(null);const documents=[...remoteDocuments,...localDocuments];const filtered=documents.filter(doc=>doc.name.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{if(isLocalPreview())return undefined;let active=true;apiClient.get('/dokumen/saya',{params:{page:1,per_page:100,kategori:'bukti_dosen'}}).then((response)=>{if(active)setRemoteDocuments((unwrapApiData(response)||[]).map((doc)=>({id:doc.id,name:doc.nama_asli,size:doc.ukuran_byte,type:doc.mime,remote:true})));}).catch(()=>{});return()=>{active=false;};},[]);
  const confirm=()=>{const document=activeTab==='Unggah baru'?uploaded:selected;if(!document)return;const label=sessionStorage.getItem('simniaga-picker-field')||'Dokumen pendukung';localStorage.setItem(`simniaga-selected-doc:${label}`,document.name);localStorage.setItem(`simniaga-selected-doc-id:${label}`,String(document.id));navigate(sessionStorage.getItem('simniaga-picker-return')||'/app/PB-2');};
  const openDocument=async(document)=>{if(!document)return;if(!document.remote){openDemoDocument(document);return;}try{const url=await getApiDocumentUrl(document.id);if(url)window.open(url,'_blank','noopener,noreferrer');}catch(error){window.alert(getApiError(error));}};
  return <div className="dosen-modal-backdrop"><section className="dosen-modal dosen-picker"><h2>Pilih dokumen tersimpan</h2><div className="dosen-picker-tabs"><button className={activeTab==='Pilih dari tersimpan'?'active':''} onClick={()=>setActiveTab('Pilih dari tersimpan')}>Pilih dari tersimpan</button><button className={activeTab==='Unggah baru'?'active':''} onClick={()=>setActiveTab('Unggah baru')}>Unggah baru</button></div>{activeTab==='Pilih dari tersimpan'?<div className="dosen-picker-layout"><div><input placeholder="Cari dokumen..." value={query} onChange={e=>setQuery(e.target.value)}/>{filtered.map(doc=><button key={doc.id} className={'dosen-picker-row '+(selected?.id===doc.id?'selected':'')} onClick={()=>setSelected(doc)}>{doc.name}</button>)}{filtered.length===0&&<p className="dosen-empty">{query?'Tidak ada dokumen yang cocok.':'Belum ada dokumen tersimpan.'}</p>}</div><div className="dosen-preview">{selected?<><b>{selected.name}</b><button onClick={()=>openDocument(selected)}>Buka pratinjau</button></>:'Pratinjau dokumen'}</div></div>:<label className="dosen-upload-control dosen-picker-upload">{uploaded?.name||'Pilih berkas PDF'}<input type="file" accept=".pdf,application/pdf" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const error=getUploadError(file);if(error){window.alert(error);e.target.value="";setUploaded(null);return;}try{if(isLocalPreview()){const local=await addDemoDocument(file);setUploaded({id:local.id,name:file.name,file:local.file});return;}const doc=await uploadApiDocument(file,'bukti_dosen');const local=await addDemoDocument(file);setUploaded({id:doc.id,name:doc.nama_asli||file.name,file});localStorage.setItem(`simniaga-demo-doc-link:${doc.id}`,local.id);}catch(err){window.alert(getApiError(err));setUploaded(null);}}}/></label>}<div className="dosen-modal-actions"><Button disabled={!(activeTab==='Unggah baru'?uploaded:selected)} onClick={confirm}>Pakai dokumen ini</Button><button className="dosen-cancel" onClick={()=>navigate(sessionStorage.getItem('simniaga-picker-return')||'/app/PB-2')}>Tutup</button></div></section></div>;
}

function DeletionDialog() {
  const [params] = useSearchParams();
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState('');
  let selected=null;
  try{selected=JSON.parse(localStorage.getItem('simniaga-dosen-penelitian')||'[]').find((record)=>String(record.recordId)===params.get('item'))||null;}catch{/* Invalid saved demo data is ignored. */}
  return <div className="dosen-modal-backdrop"><form className="dosen-modal dosen-delete-modal" onSubmit={async e=>{e.preventDefault();if(!selected)return;const reason=e.currentTarget.elements.reason.value;if(isLocalPreview()){let prior=[];try{prior=JSON.parse(localStorage.getItem('simniaga-dosen-delete-requests')||'[]');}catch{/* Ignore invalid preview rows. */}localStorage.setItem('simniaga-dosen-delete-requests',JSON.stringify([...prior,{id:Date.now(),owner:getDemoUser()?.name||'Dosen Pratinjau',ownerEmail:getDemoUser()?.email||'',data:selected['Judul penelitian']||'Data penelitian',reason,status:'Menunggu persetujuan',requestedAt:new Date().toLocaleDateString('id-ID'),targetKey:'simniaga-dosen-penelitian',targetId:selected.recordId,targetSnapshot:JSON.stringify(selected)}]));setSubmitted(true);return;}if(!Number.isInteger(Number(selected.recordId))){setError('Simpan data ini ke server terlebih dahulu sebelum meminta penghapusan.');return;}try{await apiClient.post('/permintaan-hapus',{entitas_tipe:'penelitian_pkm_dosen',entitas_id:Number(selected.recordId),alasan:reason});setSubmitted(true);}catch(err){setError(getApiError(err));}}}><h2>Ajukan hapus data</h2><Field label="Data yang diminta hapus"><input name="data" required readOnly value={selected?.['Judul penelitian']||''} placeholder="Buka permintaan dari baris data" /></Field><Field label="Alasan penghapusan *"><textarea name="reason" required rows="4" /></Field><p className="dosen-modal-note">Data hanya dihapus permanen setelah Kajur memvalidasi permintaan dan mengonfirmasi penghapusan.</p>{submitted&&<p className="dosen-save-message" role="status">{isLocalPreview()?'Permintaan pratinjau tersimpan di browser dan menunggu validasi Kajur.':'Permintaan tersimpan di server dan menunggu validasi Kajur.'}</p>}{error&&<p className="dosen-save-message" role="alert">{error}</p>}{!selected&&<p className="dosen-modal-note">Pilih Ajukan hapus dari baris data yang ingin dihapus.</p>}<div className="dosen-modal-actions"><Button type="submit" disabled={submitted||!selected}>Kirim permintaan</Button><Link to="/app/D-12" className="dosen-cancel">{submitted?'Selesai':'Batal'}</Link></div></form></div>;
}

function DeletionPage({ dialog = false }) {
  const [requests,setRequests]=useState(()=>{if(!isLocalPreview())return [];try{return JSON.parse(localStorage.getItem('simniaga-dosen-delete-requests')||'[]');}catch{return [];}});const [error,setError]=useState('');
  useEffect(()=>{if(isLocalPreview())return undefined;let active=true;apiClient.get('/permintaan-hapus/saya',{params:{page:1,per_page:100}}).then((response)=>{if(active)setRequests(unwrapApiData(response)||[]);}).catch((err)=>{if(active)setError(getApiError(err));});return()=>{active=false;};},[]);
  const status=(value)=>({menunggu:'Menunggu persetujuan',disetujui:'Disetujui · dihapus permanen',ditolak:'Ditolak'}[value]||value);
  return <div className="dosen-screen"><div className="dosen-page-row"><Heading breadcrumb="Permintaan Hapus" title="Permintaan Hapus"/><Link className="dosen-primary-link" to="/app/D-12b">＋ Ajukan hapus</Link></div>{error&&<p className="dosen-save-message" role="alert">{error}</p>}<section className="dosen-list-panel"><div className="dosen-table-wrap"><table><thead><tr><th>Data</th><th>Tanggal</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{requests.map((row)=><tr key={row.id}><td>{row.ringkasan_data||row.data||row.entitas_tipe}</td><td>{row.created_at?new Date(row.created_at).toLocaleDateString('id-ID'):row.requestedAt||'—'}</td><td>{row.alasan||row.reason||'—'}</td><td>{status(row.status)}</td><td>—</td></tr>)}{requests.length===0&&<tr><td colSpan="5" className="dosen-empty">{isLocalPreview()?'Belum ada permintaan pada pratinjau lokal.':'Belum ada permintaan penghapusan di server.'}</td></tr>}</tbody></table></div></section>{dialog && <DeletionDialog />}</div>;
}

function AllDataPage() {
  const [query,setQuery]=useState('');
  const savedDocuments=useDemoDocuments();
  const user=getDemoUser();
  const records=getFacultyRecords().filter((record)=>record.ownerEmail===user?.email?.toLowerCase()&&record.category!=='Profil');
  const visible=records.filter((record)=>`${record.category} ${JSON.stringify(record.values||{})}`.toLowerCase().includes(query.toLowerCase()));
  const categories=[...new Set(visible.map((record)=>record.category))];
  const fieldsFor=(category)=>[...new Set(visible.filter((record)=>record.category===category).flatMap((record)=>Object.keys(record.values||{}).filter((key)=>!['recordId','ownerEmail','program'].includes(key))))];
  const valueFor=(record,key)=>{
    const value=record.values?.[key];
    if(key.startsWith('__doc_')){
      const fileId=localStorage.getItem(`simniaga-demo-doc-link:${value}`)||value;
      const file=savedDocuments.find((document)=>String(document.id)===String(fileId));
      return file?<button type="button" onClick={()=>openDemoDocument(file)}>{file.name} · Lihat</button>:<span>Dokumen dihapus atau tidak tersedia</span>;
    }
    return String(value||'—');
  };
  return <div className="dosen-screen"><Heading breadcrumb="Data Saya" title="Data yang sudah disimpan"/><p className="dosen-save-message">Pilih bagian yang ingin dilihat. Data di sini hanya dapat dibaca.</p><section className="dosen-list-panel"><input className="dosen-search" aria-label="Cari data tersimpan" placeholder="Cari lintas butir..." value={query} onChange={e=>setQuery(e.target.value)}/>{visible.length===0?<p className="dosen-empty">{query?'Tidak ada data yang cocok.':'Belum ada data formulir tersimpan. Data Profil ditampilkan di Beranda Dosen.'}</p>:<div className="dosen-saved-records">{categories.map((category)=>{const categoryRecords=visible.filter((record)=>record.category===category);const fields=fieldsFor(category);return <details className="dosen-saved-record" key={category}><summary><b>{category}</b><span>{categoryRecords.length} data tersimpan</span></summary><div className="dosen-table-wrap"><table><thead><tr>{['Program studi',...fields,'Tanggal disimpan'].map((field)=><th key={field}>{field.replace(/^__doc_/, '')}</th>)}</tr></thead><tbody>{categoryRecords.map((record)=><tr key={record.id}><td>{record.program||'—'}</td>{fields.map((field)=><td key={field}>{valueFor(record,field)}</td>)}<td>{new Date(record.createdAt).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table></div></details>;})}</div>}</section></div>;
}

export default function DosenPage({ screen }) {
  if (screen.code === 'D-01') return <DosenDashboard />;
  if (screen.code === 'D-02') return <ProfileForm />;
  if (screen.code === 'D-03') return <RecognitionForm />;
  if (screen.code === 'D-05') return <CommunityServiceForm />;
  if (screen.code === 'D-06') return <PublicationForm />;
  if (screen.code === 'D-07') return <ProductForm />;
  if (screen.code === 'D-08') return <OutputForm />;
  if (screen.code === 'D-09') return <IntegrationForm />;
  if (screen.code === 'D-10') return <DocumentsPage />;
  if (screen.code === 'D-11') return <div className="dosen-screen"><ResearchForm /><DocumentPicker /></div>;
  if (screen.code === 'D-12') return <DeletionPage />;
  if (screen.code === 'D-12b') return <div className="dosen-screen"><DataList screen={{ code: 'PB-1', title: 'Penelitian' }} /><DeletionDialog /></div>;
  if (screen.code === 'D-13') return <AllDataPage />;
  if (screen.code === 'PB-2') return <ResearchForm />;
  if (screen.code === 'PB-3') return <ResearchDetail />;
  return <DataList screen={screen} />;
}





