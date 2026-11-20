import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, PageTitle } from '../ui/Primitives';
import { apiClient, getApiError, unwrapApiData } from '../../services/api';

function activeProgramId(role) {
  try {
    const account = JSON.parse(localStorage.getItem('simniaga-api-user') || 'null');
    const assignment = (account?.peran || []).find((item) => (item.peran || item) === role);
    return assignment?.prodi?.id || '';
  } catch {
    return '';
  }
}

function useLoad(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    loader().then((data) => { if (active) setState({ data, loading: false, error: '' }); })
      .catch((reason) => { if (active) setState({ data: null, loading: false, error: getApiError(reason) }); });
    return () => { active = false; };
  // Loader identity is intentionally omitted; dependencies define when a request is repeated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  return state;
}

function Feedback({ error, loading, empty = 'Belum ada data.' }) {
  if (loading) return <p className="frame-feedback" role="status">Memuat data dari server…</p>;
  if (error) return <p className="frame-feedback" role="alert">{error}</p>;
  return <p className="frame-empty">{empty}</p>;
}

function ReportList() {
  const { data, loading, error } = useLoad(async () => unwrapApiData(await apiClient.get('/rekap/butir')) || [], []);
  const rows = Array.isArray(data) ? data : [];
  return <><PageTitle eyebrow="REKAP DATA" title="Tabel rekap" description="Daftar butir rekap yang diizinkan untuk peran dan program studi Anda."/><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>KODE</th><th>NAMA BUTIR</th><th>KELOMPOK</th><th>TAMPILAN</th></tr></thead><tbody>{rows.map((item) => <tr key={item.kode}><td>{item.kode}</td><td>{item.nama}</td><td>{item.kelompok || '—'}</td><td>{(item.tampilan || []).map((view) => <Link key={view.id} className="button button-secondary" to={`/app/T-02?kode=${encodeURIComponent(item.kode)}&view=${view.id}`}>{view.nama}</Link>)}<Link className="button button-primary" to={`/app/T-02?kode=${encodeURIComponent(item.kode)}`}>Buka rekap</Link></td></tr>)}{!rows.length && <tr><td colSpan="4"><Feedback error={error} loading={loading} empty="Tidak ada butir rekap yang tersedia untuk akun ini."/></td></tr>}</tbody></table></div></section></>;
}

async function downloadReport(code, params) {
  const response = await apiClient.get(`/rekap/${encodeURIComponent(code)}/ekspor`, { params: { ...params, format: 'xlsx' }, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${code}-rekap.xlsx`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function ReportResult({ exportOnly = false }) {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('kode') || '';
  const role = localStorage.getItem('sim-role') || '';
  const fixedProgramId = activeProgramId(role);
  const [programId, setProgramId] = useState(searchParams.get('prodi_id') || fixedProgramId);
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (role !== 'Kajur') return undefined;
    let active = true;
    apiClient.get('/referensi/prodi', { params: { jurusan_an_saja: true } }).then((response) => {
      if (active) setPrograms(unwrapApiData(response) || []);
    }).catch((reason) => { if (active) setError(getApiError(reason)); });
    return () => { active = false; };
  }, [role]);
  const { data, loading, error: loadError } = useLoad(async () => {
    if (!code || !programId) return null;
    return unwrapApiData(await apiClient.get(`/rekap/${encodeURIComponent(code)}`, { params: { prodi_id: programId, ...(searchParams.get('view') ? { tampilan_id: searchParams.get('view') } : {}) } }));
  }, [code, programId, refreshKey]);
  const exportFile = async () => {
    setExporting(true); setError('');
    try { await downloadReport(code, { prodi_id: programId, ...(searchParams.get('view') ? { tampilan_id: searchParams.get('view') } : {}) }); }
    catch (reason) { setError(getApiError(reason)); }
    finally { setExporting(false); }
  };
  const columns = data?.kolom || [];
  const rows = data?.baris || [];
  if (exportOnly) return <><PageTitle eyebrow="REKAP DATA" title="Ekspor rekap" description="Ekspor diambil dari hasil rekap server."/><div className="panel"><label>Program studi<select value={programId} onChange={(event) => setProgramId(event.target.value)} disabled={role !== 'Kajur'}><option value="">Pilih program studi</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.nama}</option>)}</select></label><p>Kode butir: {code || '—'}</p><Button onClick={exportFile} disabled={!code || !programId || exporting}>{exporting ? 'Mengunduh…' : 'Unduh Excel'}</Button>{(error || loadError) && <p role="alert">{error || loadError}</p>}</div></>;
  return <><PageTitle eyebrow="REKAP DATA · HASIL" title={data?.judul || `Rekap ${code || ''}`} description={`Data disiapkan oleh backend${data?.ts ? ` untuk TS ${data.ts}` : ''}.` } actions={<Button kind="secondary" onClick={exportFile} disabled={!code || !programId || exporting}>{exporting ? 'Mengunduh…' : 'Ekspor Excel'}</Button>}/>{role === 'Kajur' && <div className="frame-filters"><label>Program studi<select value={programId} onChange={(event) => { setProgramId(event.target.value); setRefreshKey((key) => key + 1); }}><option value="">Pilih program studi</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.nama}</option>)}</select></label></div>}{(error || loadError) && <p className="frame-feedback" role="alert">{error || loadError}</p>}{!code && <p className="frame-feedback">Pilih butir rekap dari daftar terlebih dahulu.</p>}{!programId && role !== 'Kajur' && <p className="frame-feedback">Akun Kaprodi belum memiliki program studi yang terhubung pada respons login.</p>}<section className="panel table-panel"><div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.grup && <small>{column.grup}<br/></small>}{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || `${row._grup || 'row'}-${index}`}>{columns.map((column) => <td key={column.key}>{row._grup ? column.key === '_grup' ? row._grup : '' : row[column.key] == null ? '—' : String(row[column.key])}</td>)}</tr>)}{!loading && !rows.length && <tr><td colSpan={Math.max(columns.length, 1)}><Feedback error={loadError} loading={loading} empty="Rekap belum memiliki baris data."/></td></tr>}</tbody></table></div></section></>;
}

function TableBuilder() {
  const [butir, setButir] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selected, setSelected] = useState('');
  const [chosen, setChosen] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; apiClient.get('/admin/butir-data', { params: { page: 1, per_page: 100 } }).then((response) => { if (active) setButir(unwrapApiData(response) || []); }).catch((reason) => { if (active) setError(getApiError(reason)); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!selected) return undefined;
    let active = true;
    apiClient.get(`/admin/butir-data/${selected}/kolom`, { params: { page: 1, per_page: 100 } }).then((response) => { if (active) setColumns(unwrapApiData(response) || []); }).catch((reason) => { if (active) setError(getApiError(reason)); });
    return () => { active = false; };
  }, [selected]);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSaved(false); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiClient.post('/admin/tampilan-tabel', {
        nama: form.get('nama'), butir_data_id: Number(selected), lembaga_akreditasi: form.get('lembaga') || undefined,
        visibilitas: form.get('visibilitas'),
        kolom: chosen.map((id, index) => { const column = columns.find((item) => String(item.id) === id); return { sumber_kolom: column.nama_kolom, label: column.label, urutan: index + 1, agregasi: 'none', tampil_dokumen: column.tipe === 'file' }; }),
      });
      setSaved(true); event.currentTarget.reset(); setChosen([]);
    } catch (reason) { setError(getApiError(reason)); }
    finally { setBusy(false); }
  };
  return <><PageTitle eyebrow="TABEL KUSTOM" title="Penyusun tampilan tabel" description="Konfigurasi tampilan disimpan melalui API Kajur."/><section className="panel"><form className="record-form" onSubmit={submit}><label>Nama tampilan<input name="nama" required maxLength="255"/></label><label>Butir data<select required value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Pilih butir</option>{butir.map((item) => <option key={item.id} value={item.id}>{item.kode} · {item.nama}</option>)}</select></label><label>Lembaga akreditasi<input name="lembaga" maxLength="255"/></label><label>Visibilitas<select name="visibilitas" defaultValue="kaprodi_dan_kajur"><option value="kajur">Kajur</option><option value="kaprodi_dan_kajur">Kaprodi dan Kajur</option></select></label><fieldset><legend>Kolom tampilan</legend>{columns.map((column) => <label key={column.id}><input type="checkbox" checked={chosen.includes(String(column.id))} onChange={(event) => setChosen((previous) => event.target.checked ? [...previous, String(column.id)] : previous.filter((id) => id !== String(column.id)))}/>{column.label}</label>)}{selected && !columns.length && <p>Butir ini belum memiliki kolom yang dapat dipilih.</p>}</fieldset><Button type="submit" disabled={busy||!selected||!chosen.length}>{busy ? 'Menyimpan…' : 'Simpan tampilan'}</Button>{saved && <p role="status">Tampilan tabel tersimpan.</p>}{error && <p role="alert">{error}</p>}</form></section></>;
}

export function CustomTable({ screen }) {
  if (screen.code === 'T-01') return <ReportList/>;
  if (screen.code === 'T-02') return <ReportResult/>;
  if (screen.code === 'T-03') return <TableBuilder/>;
  if (screen.code === 'T-04') return <ReportResult exportOnly/>;
  return <ReportList/>;
}
