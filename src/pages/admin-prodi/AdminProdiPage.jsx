import { ContractWorkspace } from '../../components/common/ContractWorkspace';

const pathFor = (screen) => {
  const raw = localStorage.getItem('simniaga-api-user');
  let account = {};
  try { account = JSON.parse(raw || '{}'); } catch { /* Use the unavailable state when account context is malformed. */ }
  const role = (account.peran || []).find((item) => (item.peran || item) === 'admin_prodi');
  const programId = role?.prodi?.id || account.prodi?.id;
  if (!programId) return null;
  const routes = {
    'A-01': `/prodi/${programId}/antrean-layanan`, 'A-06': `/prodi/${programId}/antrean-layanan`,
    'A-10': `/prodi/${programId}/surat-peringatan`, 'A-11': `/prodi/${programId}/marksheet`,
    'A-12': `/prodi/${programId}/pendaftaran-sidang`,
  };
  return routes[screen.code] || null;
};

export default function AdminProdiPage({ screen }) {
  return <ContractWorkspace screen={screen} endpoint={pathFor(screen)} description="Data dimuat dari API backend. Proses perubahan mengikuti endpoint yang tersedia pada kontrak." empty="Belum ada data dari backend."/>;
}
