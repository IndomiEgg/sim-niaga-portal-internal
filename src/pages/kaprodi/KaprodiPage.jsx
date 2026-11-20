import { CustomTable } from '../../components/common/PortalDataViews';
import { ContractWorkspace } from '../../components/common/ContractWorkspace';

export default function KaprodiPage({ screen }) {
  if (screen.code.startsWith('T-')) return <CustomTable screen={screen}/>;
  return <ContractWorkspace screen={screen} endpoint="/rekap/butir" description="Daftar butir dan rekap yang diizinkan untuk program studi pada akun Anda." empty="Belum ada butir rekap."/>;
}
