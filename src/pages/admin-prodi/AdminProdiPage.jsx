import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Status } from '../../components/ui/Primitives';
import { screens } from '../../data/screens';
import { downloadCsv } from '../../utils/exportCsv';
import { addDemoDocument, getDemoDocuments, openDemoDocument, subscribeToDemoDocuments } from '../../services/demoDocuments';
import { openPrivateFile } from '../../services/demoPrivateFiles';
import { getDemoTicket, getDemoTickets, updateDemoTicket } from '../../services/demoRequests';
import { addStudentFile, getStudentFiles, getStudentFileError, openStudentFile } from '../../services/demoStudentFiles';
import { getUploadError } from '../../services/demoDocuments';
import { isLocalPreview } from '../../services/previewMode';

const buttonTabs = (items, active, select) => <div className="frame-tabs" role="tablist">{items.map(item=><button type="button" role="tab" aria-selected={active===item} className={active===item?'active':''} key={item} onClick={()=>select(item)}>{item}</button>)}</div>;
function FrameTable({columns, rows=[], empty='Belum ada data.'}) {
  return <div className="frame-table-scroll"><table className="frame-table"><thead><tr>{columns.map(col=><th key={col}>{col}</th>)}</tr></thead><tbody>{rows.length?rows.map((row,index)=><tr key={index}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>):<tr><td className="frame-empty" colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>;
}
function Filters({year=true, query, setQuery, onExport}) {
  return <div className="frame-filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari..." aria-label="Cari data"/>{year&&<select defaultValue=""><option value="">Tahun</option>{['2026','2025','2024','2023'].map(x=><option key={x}>{x}</option>)}</select>}{onExport&&<button className="button button-secondary" onClick={onExport}>Ekspor</button>}</div>;
}
function Title({screen, action}) { return <div className="frame-page-heading"><div><small>{screen.group}</small><h1>{screen.title}</h1></div>{action}</div>; }

function AdminDashboard() {
  const tickets=getDemoTickets();const counts={ 'Menunggu respon':tickets.filter(ticket=>ticket.status==='Menunggu respon admin prodi').length,'Diproses':tickets.filter(ticket=>ticket.status==='Diproses admin').length,'Dikembalikan':tickets.filter(ticket=>ticket.status==='Dikembalikan').length,'Menunggu TTD':tickets.filter(ticket=>ticket.status==='TTD Kajur').length };
  const latest=[...tickets].reverse().slice(0,5);const activity=tickets.flatMap(ticket=>(ticket.history||[]).map(entry=>({...entry,ticket:ticket.ticket}))).slice(-5).reverse();
  return <div className="frame-workspace"><Title screen={screens.find(x=>x.code==='A-01')}/><div className="frame-metric-row">{Object.entries(counts).map(([label,count])=><article key={label}><span>{label}</span><b>{String(count).padStart(2,'0')}</b></article>)}</div><section className="frame-section"><h2>Antrean permohonan surat</h2><div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Tiket','Nama','NIM','Peruntukan','Tanggal','Status'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{latest.map(ticket=><tr key={ticket.ticket}><td>{ticket.ticket}</td><td>{ticket.student}</td><td>{ticket.nim}</td><td>{ticket.purpose}</td><td>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</td><td>{ticket.status}</td></tr>)}{latest.length===0&&<tr><td colSpan="6" className="frame-empty">Belum ada permohonan surat.</td></tr>}</tbody></table></div></section><section className="frame-section"><h2>Aktivitas terakhir</h2><div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Waktu','Aksi','Objek'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{activity.map((entry,index)=><tr key={`${entry.ticket}-${index}`}><td>{new Date(entry.at).toLocaleString('id-ID')}</td><td>{entry.status}</td><td>{entry.ticket}</td></tr>)}{activity.length===0&&<tr><td colSpan="3" className="frame-empty">Belum ada aktivitas.</td></tr>}</tbody></table></div></section></div>;
}

function RelatedFaculty({screen}) {
  const [tab,setTab]=useState('EWMP'); const [query,setQuery]=useState('');
  return <div className="frame-workspace"><Title screen={screen} action={<Link to="/app/PB-2" className="button button-primary">＋ Tambah data</Link>}/>{buttonTabs(['EWMP','Pembimbing TA','Dosen tidak tetap','Dosen industri'],tab,setTab)}<Filters query={query} setQuery={setQuery}/><FrameTable columns={['Nama dosen','DTPS','PS sendiri','PS lain (PT)','PS luar PT','Penelitian','PkM','Tugas tambahan','Jumlah sks','Rata-rata']} empty={query?'Tidak ada hasil pencarian.':'Belum ada data dosen terkait.'}/><div className="frame-table-footer">Jumlah / rata-rata (dihitung otomatis)</div></div>;
}

function StudentData({screen}) {
  const [tab,setTab]=useState('Kegiatan dosen-mhs'); const [query,setQuery]=useState('');
  const tabs=['Kegiatan dosen-mhs','Lulusan','Prestasi','Kepuasan','Karya ilmiah'];
  return <div className="frame-workspace"><Title screen={screen} action={<Link to="/app/PB-2" className="button button-primary">＋ Tambah data</Link>}/><div className="frame-warning">Persentase kepuasan diperingatkan bila tidak berjumlah 100%. Angka ringkasan diisi manual.</div>{buttonTabs(tabs,tab,setTab)}<Filters query={query} setQuery={setQuery}/><FrameTable columns={tab==='Lulusan'?['Tahun lulus','Jumlah lulusan','IPK min','IPK rata-rata','IPK maks','Aksi']:['Tahun','Nama kegiatan','Prodi','Ringkasan','Aksi']} empty={query?'Tidak ada hasil pencarian.':`Belum ada data ${tab.toLowerCase()}.`}/></div>;
}

function SupportingDocuments({screen}) {
  const [query,setQuery]=useState('');
  const [documents,setDocuments]=useState([]);
  const [feedback,setFeedback]=useState('');
  useEffect(()=>{let active=true;const refresh=()=>getDemoDocuments().then((items)=>{if(active)setDocuments(items);}).catch((error)=>{if(active)setFeedback(error.message);});refresh();const unsubscribe=subscribeToDemoDocuments(refresh);return()=>{active=false;unsubscribe();};},[]);
  const visible=documents.filter(document=>document.name.toLowerCase().includes(query.toLowerCase()));
  const formatSize=(size)=>size<1024*1024?`${Math.max(1,Math.round(size/1024))} KB`:`${(size/(1024*1024)).toFixed(1)} MB`;
  return <div className="frame-workspace"><Title screen={screen} action={<label className="button button-primary">＋ Unggah<input type="file" accept=".pdf,application/pdf" hidden onChange={async e=>{const file=e.target.files?.[0];const error=getUploadError(file);if(error){setFeedback(error);e.target.value='';return;}if(file&&!/\.pdf$/i.test(file.name)){setFeedback('Unggah dokumen dalam format PDF.');return;}if(file){try{await addDemoDocument(file);setFeedback(`${file.name} ditambahkan (maks. 5 MB).`);}catch(uploadError){setFeedback(uploadError.message||'Dokumen gagal disimpan.');}}}}/></label>}/><Filters query={query} setQuery={setQuery}/>{feedback&&<p className="frame-feedback" role="status">{feedback}</p>}<div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Nama berkas','Terkait butir','Ukuran','Tanggal','Aksi'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{visible.map(document=><tr key={document.id}><td>{document.name}</td><td>—</td><td>{formatSize(document.size)}</td><td>{document.uploadedAt}</td><td><button type="button" onClick={()=>openDemoDocument(document)}>Lihat</button> · <button type="button" onClick={()=>openDemoDocument(document,true)}>Unduh</button></td></tr>)}{visible.length===0&&<tr><td className="frame-empty" colSpan="5">{query?'Tidak ada dokumen yang cocok.':'Belum ada dokumen pendukung.'}</td></tr>}</tbody></table></div></div>;
}

function StudentSearch({screen}) {
  const [query,setQuery]=useState(''); const [searched,setSearched]=useState(false);
  return <div className="frame-workspace"><Title screen={screen}/><form className="frame-filters frame-search-form" onSubmit={e=>{e.preventDefault();setSearched(true);}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari data kemahasiswaan..."/><select defaultValue=""><option value="">Butir</option><option>Lulusan</option><option>Prestasi</option><option>Kepuasan</option><option>Karya ilmiah</option></select><select defaultValue=""><option value="">Tahun</option><option>2026</option><option>2025</option></select><select defaultValue=""><option value="">Tingkat</option><option>Wilayah</option><option>Nasional</option><option>Internasional</option></select><Button type="submit">Cari</Button></form>{searched&&<FrameTable columns={['Butir','Ringkasan','Tahun','Tingkat','Aksi']} empty="Tidak ada hasil untuk kriteria pencarian."/>}</div>;
}

function RequestQueue({screen}) {
  const [query,setQuery]=useState('');
  const rows=getDemoTickets().filter(row=>Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()));
  return <div className="frame-workspace"><Title screen={screen}/><Filters year={false} query={query} setQuery={setQuery} onExport={()=>downloadCsv(rows)}/><div className="frame-table-scroll"><table className="frame-table"><thead><tr>{['Nomor tiket','Nama','NIM','Prodi','Peruntukan','Tanggal','Lama menunggu','Status','Aksi'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.ticket}><td>{row.ticket}</td><td>{row.student}</td><td>{row.nim}</td><td>{row.program}</td><td>{row.purpose}</td><td>{new Date(row.createdAt).toLocaleDateString('id-ID')}</td><td>—</td><td><Status value={row.status}/></td><td><Link to={`/app/A-07?ticket=${encodeURIComponent(row.ticket)}`}>Buka · Proses</Link></td></tr>)}{rows.length===0&&<tr><td colSpan="9" className="frame-empty">{query?'Tidak ada tiket yang cocok.':'Belum ada permohonan surat.'}</td></tr>}</tbody></table></div></div>;
}

function VerifyRequest({screen}) {
  const [params]=useSearchParams();const navigate=useNavigate();const [returned,setReturned]=useState(false);const [note,setNote]=useState('');const [fileError,setFileError]=useState('');const ticket=getDemoTicket(params.get('ticket'));const isRequest=Boolean(ticket);
  const reject=()=>{if(!note.trim()){setReturned(true);return;}updateDemoTicket({status:'Dikembalikan',returnReason:note},{status:'Dikembalikan',at:new Date().toISOString(),by:'Admin Prodi',note},ticket.ticket);navigate('/app/A-06');};
  const proceed=()=>{if(!isRequest)return;updateDemoTicket({status:'Diproses admin',returnReason:''},{status:'Diproses admin',at:new Date().toISOString(),by:'Admin Prodi'},ticket.ticket);navigate('/app/A-06');};
  return <div className="frame-workspace"><div className="frame-crumb"><Link to="/app/A-06">Permohonan Surat</Link><span>›</span><span>Detail</span></div><Title screen={screen}/><div className="frame-verify-grid"><section className="frame-card"><h2>Data permohonan</h2>{[['Prodi',ticket?.program],['Nama',ticket?.student],['NIM',ticket?.nim],['Peruntukan',ticket?.purpose]].map(([x,value])=><div className="frame-detail-row" key={x}><span>{x}</span><b>{isRequest?value||'—':'—'}</b></div>)}<div className="frame-document-view"><div className="frame-document-head"><b>Pratinjau scan KTM</b><small>Mode pratinjau membuka berkas yang tersimpan pada browser ini. Backend mengatur akses berdasarkan prodi.</small></div><div className="frame-document-placeholder">{isRequest&&ticket.ktmFile?<button className="button button-secondary" onClick={async()=>{try{await openPrivateFile(ticket.ticket,'ktm');setFileError('');}catch(error){setFileError(error.message||'Scan KTM tidak dapat dibuka.');}}}>Buka scan KTM</button>:isRequest?'Berkas privat belum tersedia pada sesi ini':'Tidak ada tiket yang dipilih'}</div>{fileError&&<p className="frame-feedback" role="alert">{fileError}</p>}</div></section><section className="frame-card"><h2>Linimasa status</h2><ol className="frame-status-list"><li className={ticket?.status==='Menunggu respon admin prodi'?'current':''}>Menunggu respon admin prodi</li><li className={ticket?.status==='Diproses admin'?'current':''}>Diproses admin</li><li className={ticket?.status==='TTD Kajur'?'current':''}>TTD Kajur</li><li className={ticket?.status==='Selesai'?'current':''}>Selesai</li></ol><label className="frame-label">Alasan pengembalian (wajib bila tidak sesuai)<textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Tuliskan alasan pengembalian"/></label><div className="frame-stack-actions"><Button disabled={!isRequest||ticket.status!=='Menunggu respon admin prodi'} onClick={proceed}>Sesuai — proses permohonan</Button><Button kind="secondary" disabled={!isRequest||ticket.status!=='Menunggu respon admin prodi'} onClick={reject}>Tidak sesuai — kembalikan</Button></div>{returned&&<p className="frame-feedback" role="status">{note.trim()?'Permohonan ditandai untuk dikembalikan pada mode demo.':'Isi alasan pengembalian terlebih dahulu.'}</p>}</section></div></div>;
}

function ProcessLetter({screen}) {
  const [params]=useSearchParams();
  const [complete,setComplete]=useState(false);
  const [saving,setSaving]=useState(false);
  const [semester,setSemester]=useState('');
  const [note,setNote]=useState('');
  const [file,setFile]=useState(null);
  const [feedback,setFeedback]=useState('');
  const ticket=getDemoTicket(params.get('ticket'));
  const finish=async(event)=>{
    event.preventDefault();
    if(!ticket||ticket.status!=='TTD Kajur')return;
    if(!isLocalPreview()){setFeedback('Unggah surat terbit ke server belum dapat disimpan: kontrak endpoint layanan berkas mahasiswa belum tersedia. Data tiket tidak diubah.');return;}
    if(!file||!semester){setFeedback('Pilih surat terbit dan semester terlebih dahulu.');return;}
    if(!/\\.pdf$/i.test(file.name)){setFeedback('Surat terbit harus berupa PDF.');return;}
    setSaving(true);setFeedback('');
    try{
      const document=await addStudentFile({file,program:ticket.program,semester,nim:ticket.nim,ticket:ticket.ticket,name:`Surat ${ticket.ticket}.pdf`});
      updateDemoTicket({status:'Selesai',fileId:document.id,processNote:note},{status:'Selesai',at:new Date().toISOString(),by:'Admin Prodi'},ticket.ticket);
      setComplete(true);
      setFeedback('Surat tersimpan dan tersedia di P-07 dengan prodi, semester, NIM, dan kode tiket permohonan.');
    }catch(error){setFeedback(error.message||'Surat gagal disimpan.');}
    finally{setSaving(false);}
  };
  return <div className="frame-workspace"><div className="frame-crumb"><Link to="/app/A-06">Permohonan Surat</Link><span>›</span><Link to={`/app/A-07?ticket=${encodeURIComponent(params.get('ticket')||'')}`}>Detail dan Verifikasi</Link><span>›</span><span>Proses</span></div><Title screen={screen}/><form className="frame-card frame-process-card" onSubmit={finish}><h2>Proses</h2><label className="frame-label">Catatan proses<textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Catatan proses"/></label><h2>Surat terbit</h2><p className="frame-warning">Surat hanya dapat diunggah setelah status TTD Kajur. Semester ditambahkan sebagai metadata pencarian P-07.</p><label className="frame-label">Semester mahasiswa<select required value={semester} onChange={e=>setSemester(e.target.value)}><option value="">Pilih semester</option>{Array.from({length:8},(_,index)=>String(index+1)).map(value=><option key={value} value={value}>{value}</option>)}</select></label><label className="frame-label">Surat yang sudah ditandatangani Kajur (PDF, maks. 5 MB)<span className="frame-file-upload">{file?.name || 'Seret & lepas berkas di sini, atau Pilih berkas'}<input type="file" accept=".pdf,application/pdf" required onChange={e=>{const selected=e.target.files?.[0];const error=getUploadError(selected);if(error){setFeedback(error);e.target.value='';setFile(null);}else{setFeedback('');setFile(selected||null);}}}/></span></label><div className="frame-form-actions"><Button type="submit" disabled={!ticket||ticket.status!=='TTD Kajur'||saving||complete}>{saving?'Menyimpan…':'Unggah dan selesaikan'}</Button></div>{feedback&&<p className="frame-feedback" role={complete?'status':'alert'}>{feedback}</p>}{!ticket&&<p className="frame-feedback">Belum ada permohonan yang dipilih.</p>}{ticket&&ticket.status!=='TTD Kajur'&&<p className="frame-feedback">Surat hanya dapat diproses setelah Kajur menandatangani.</p>}</form></div>;
}

function ServiceForm({screen,kind}) {
  const [saved,setSaved]=useState(false); const [feedback,setFeedback]=useState(''); const [file,setFile]=useState(null); const [studentFiles,setStudentFiles]=useState([]); const [loading,setLoading]=useState(false); const isNotice=kind==='peringatan'; const isMarks=kind==='marksheet';
  const title=isNotice?'Input SP':'Unggah berkas mahasiswa';
  useEffect(()=>{if(!isMarks)return undefined;let active=true;getStudentFiles().then(rows=>{if(active)setStudentFiles(rows);}).catch(error=>{if(active)setFeedback(error.message||'Daftar berkas tidak dapat dimuat.');});return()=>{active=false;};},[isMarks]);
  const save=async(event)=>{event.preventDefault();const form=event.currentTarget;if(isMarks){if(!isLocalPreview()){setFeedback('Penyimpanan berkas mahasiswa ke server belum dapat diaktifkan karena kontrak endpoint belum tersedia. Data tidak disimpan lokal pada akun aktif.');return;}const metadata={program:form.elements.prodi.value,semester:form.elements.semester.value,nim:form.elements.nim.value,ticket:form.elements.ticket.value,year:form.elements.tahun.value};if(!file){setFeedback('Pilih berkas terlebih dahulu.');return;}const validationError=getStudentFileError(file);if(validationError){setFeedback(validationError);return;}const request=getDemoTicket(metadata.ticket);if(!request){setFeedback('Kode tiket tidak ditemukan. Gunakan kode tiket privat dari bukti permohonan mahasiswa.');return;}if(request.nim!==metadata.nim||request.program!==metadata.program){setFeedback('NIM atau program studi tidak sama dengan data pada tiket tersebut.');return;}setLoading(true);setFeedback('');try{const result=await addStudentFile({...metadata,file,name:form.elements.nama_berkas.value||file.name});setStudentFiles(await getStudentFiles());setFeedback(`Berkas ${result.name} tersimpan dan dapat dicari melalui P-07.`);setSaved(true);form.reset();setFile(null);}catch(error){setFeedback(error.message||'Berkas gagal disimpan.');}finally{setLoading(false);}return;}if(!file){setFeedback('Pilih surat peringatan terlebih dahulu.');return;}if(!isLocalPreview()){setFeedback('Penyimpanan surat peringatan ke server belum tersedia pada kontrak API saat ini.');return;}try{await addDemoDocument(file);setSaved(true);setFeedback('Surat peringatan tersimpan pada mode pratinjau.');}catch(error){setFeedback(error.message||'Surat peringatan gagal disimpan.');}};
  return <div className="frame-workspace"><Title screen={screen}/><form className="frame-card frame-form-card" onSubmit={save}><h2>{title}</h2>{isMarks&&<><p className="frame-warning">P-07 menyediakan berkas untuk mahasiswa. Masukkan metadata yang cocok dengan permohonan dan kode tiket privat.</p><div className="frame-form-grid"><label className="frame-label">Nama berkas<input name="nama_berkas" placeholder="Contoh: Surat keterangan aktif"/></label><label className="frame-label">Nama mahasiswa<input name="nama" required placeholder="Isi di sini"/></label><label className="frame-label">NIM<input name="nim" required placeholder="Isi di sini"/></label><label className="frame-label">Prodi<select name="prodi" required defaultValue=""><option value="">Pilih prodi</option>{['Administrasi Bisnis','Manajemen Bisnis','MICE','Bahasa Inggris'].map(x=><option key={x}>{x}</option>)}</select></label><label className="frame-label">Semester<select name="semester" required defaultValue=""><option value="">Pilih semester</option>{Array.from({length:8},(_,index)=><option key={index+1} value={index+1}>{index+1}</option>)}</select></label><label className="frame-label">Kode tiket privat<input name="ticket" required defaultValue={getDemoTicket()?.ticket||''} placeholder="Salin dari bukti permohonan"/></label><label className="frame-label">Tahun ajaran<input name="tahun" placeholder="Opsional"/></label></div></>}{isNotice&&<div className="frame-form-grid"><label className="frame-label">Nama mahasiswa<input required placeholder="Isi di sini"/></label><label className="frame-label">NIM<input required placeholder="Isi di sini"/></label><label className="frame-label">Prodi<select required defaultValue=""><option value="">Pilih prodi</option>{['Administrasi Bisnis','Manajemen Bisnis','MICE','Bahasa Inggris'].map(x=><option key={x}>{x}</option>)}</select></label><label className="frame-label">Tingkat<div className="frame-radio-row">{['SP 1','SP 2','SP 3'].map(x=><label key={x}><input type="radio" name="tingkat" required/> {x}</label>)}</div></label></div>}<label className="frame-label frame-full">{isNotice?'Surat peringatan (PDF, maks. 5 MB)':'Berkas mahasiswa (PDF, DOC/DOCX, XLS/XLSX, JPG/PNG · maks. 5 MB)'}<span className="frame-file-upload">{file?.name || 'Seret & lepas berkas di sini, atau Pilih berkas'}<input type="file" accept={isNotice?'.pdf,application/pdf':'.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf'} required onChange={e=>{const selected=e.target.files?.[0];const error=isMarks?getStudentFileError(selected):getUploadError(selected);if(error){setFeedback(error);e.target.value='';setFile(null);}else{setFeedback('');setFile(selected||null);}}}/></span></label>{isMarks&&<FrameTable columns={['Prodi','NIM','Semester','Tahun ajaran','Berkas']} rows={studentFiles.map(row=>[row.program,row.nim,row.semester,row.year||'—',<button type="button" key={row.id} onClick={()=>openStudentFile(row)}>{row.name} · Unduh</button>])}/>}<div className="frame-form-actions"><Button type="submit" disabled={loading}>{loading?'Menyimpan…':'Simpan'}</Button><Link className="button button-secondary" to="/app/A-01">Batal</Link></div>{feedback&&<p className="frame-feedback" role={saved?'status':'alert'}>{feedback}</p>}</form></div>;
}

function AdminService({screen}) {
  const [tab,setTab]=useState('Permohonan'); const [query,setQuery]=useState('');
  return <div className="frame-workspace"><Title screen={screen}/>{buttonTabs(['Permohonan','Surat peringatan','Marksheet','Pendaftaran sidang'],tab,setTab)}<Filters query={query} setQuery={setQuery}/><FrameTable columns={['Nomor/nama','NIM','Prodi','Tanggal','Status','Aksi']} empty="Belum ada data layanan."/><div className="frame-inline-action"><Link to={tab==='Permohonan'?'/app/A-06':tab==='Surat peringatan'?'/app/A-10':tab==='Marksheet'?'/app/A-11':'/app/A-12'}>Buka pengelolaan {tab.toLowerCase()} →</Link></div></div>;
}

function ReadinessList({screen}) {
  const [query,setQuery]=useState('');
  return <div className="frame-workspace"><Title screen={screen}/><Filters query={query} setQuery={setQuery}/><FrameTable columns={['Nama','NIM','Prodi','Tanggal daftar','Dokumen','Status','Aksi']} empty="Belum ada pendaftaran kesiapan sidang."/></div>;
}

export default function AdminProdiPage({screen}) {
  if(screen.code==='A-01') return <AdminDashboard/>;
  if(screen.code==='A-02') return <RelatedFaculty screen={screen}/>;
  if(screen.code==='A-03') return <StudentData screen={screen}/>;
  if(screen.code==='A-04') return <SupportingDocuments screen={screen}/>;
  if(screen.code==='A-05') return <StudentSearch screen={screen}/>;
  if(screen.code==='A-06') return <RequestQueue screen={screen}/>;
  if(screen.code==='A-07') return <VerifyRequest screen={screen}/>;
  if(screen.code==='A-08') return <ProcessLetter screen={screen}/>;
  if(screen.code==='A-10') return <ServiceForm screen={screen} kind="peringatan"/>;
  if(screen.code==='A-11') return <ServiceForm screen={screen} kind="marksheet"/>;
  if(screen.code==='A-12') return <ReadinessList screen={screen}/>;
  return <AdminService screen={screen}/>;
}
