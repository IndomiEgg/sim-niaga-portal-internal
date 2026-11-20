import { CustomTable } from '../../components/common/PortalDataViews';
import { ContractWorkspace } from '../../components/common/ContractWorkspace';

const contractedScreens = {
  'KJ-01': ['/admin/permintaan-hapus', 'Ringkasan data persetujuan yang tersedia dari backend.'],
  'KJ-04': ['/admin/permintaan-hapus', 'Permintaan hapus berasal dari pengajuan dosen. Keputusan disimpan oleh endpoint backend.'],
  'KJ-06': ['/rekap/butir', 'Pilih butir untuk melihat rekap lintas program studi.'],
};

export default function KajurPage({ screen }) {
  if (screen.code.startsWith('T-')) return <CustomTable screen={screen}/>;
  const [endpoint, description] = contractedScreens[screen.code] || [];
  return <ContractWorkspace screen={screen} endpoint={endpoint} description={description || 'Tampilan ini belum memiliki endpoint yang tercantum dalam kontrak API.'} empty="Belum ada data dari backend."/>;
}
