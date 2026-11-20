import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { roleProfiles } from '../../data/screens';
import { Brand, Button } from '../../components/ui/Primitives';
import { apiClient, apiTokenKey, getApiError } from '../../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestedRole = params.get('role');
  const savedRole = localStorage.getItem('sim-role');
  const role = roleProfiles[requestedRole] ? requestedRole : roleProfiles[savedRole] ? savedRole : 'Admin Prodi';
  const roleNames = { dosen: 'Dosen', admin_prodi: 'Admin Prodi', kaprodi: 'Kaprodi', kajur: 'Kajur' };

  return <div className="login-page">
    <Link to="/" className="login-back">← Kembali ke layanan publik</Link>
    <div className="login-card">
      <Brand/><small className="auth-subtitle">SIM Jurusan Administrasi Niaga</small><h1>Login Staf</h1>
      <form onSubmit={async (event)=>{
        event.preventDefault(); setError(''); setLoading(true);
        const form=event.currentTarget;
        try {
          const {data:response}=await apiClient.post('/auth/login',{email:form.elements.email.value.trim().toLowerCase(),password:form.elements.password.value,nama_perangkat:'web'});
          const result=response?.data||response; const account=result.pengguna||result.user||{};
          const roles=(account.peran||[]).map((item)=>({apiRole:item.peran||item,role:roleNames[item.peran||item]})).filter((item)=>item.role);
          const selected=roles.find((item)=>item.role===role)||(!requestedRole&&roles[0]);
          if(!selected){setError(`Akun berhasil dikenali, tetapi tidak memiliki peran ${role}. Gunakan tautan login sesuai peran akun.`);return;}
          localStorage.setItem(apiTokenKey,result.token); localStorage.setItem('sim-role',selected.role); localStorage.setItem('simniaga-api-user',JSON.stringify(account));
          navigate(account.wajib_ganti_password?'/app/K-02':`/app/${roleProfiles[selected.role].nav[0]}`);
        } catch(err){setError(getApiError(err));} finally{setLoading(false);}
      }}>
        <label>Email<input name="email" required type="email" placeholder="nama@polmed.ac.id" autoComplete="username"/></label>
        <label>Password<input name="password" required type="password" placeholder="Masukkan password" autoComplete="current-password"/></label>
        <Button type="submit" disabled={loading}>{loading?'Menghubungkan…':'Masuk'}</Button>
        <Link className="auth-secondary-button" to="/app/K-03">Lupa password</Link>
      </form>
      {error&&<p className="auth-notice" role="alert">{error}</p>}
      <p className="auth-footnote">Login memakai akun staf yang sudah dibuat di backend.</p>
    </div>
  </div>;
}

export function SystemPage({screen}) {
  const [saved,setSaved]=useState(false);
  const [requested,setRequested]=useState(false);
  const [error,setError]=useState('');
  const isChange=screen.code==='K-02';
  const isForgot=screen.code==='K-03';
  return <div className="login-page"><div className="login-card auth-state-card"><Brand/><div className="auth-mark">{isChange?'●':isForgot?'●':'!'}</div><h1>{screen.code==='K-04'?'Akses Ditolak':isChange?'Ganti Password':'Lupa Password'}</h1>{screen.code==='K-04'?<><p>Anda tidak berhak membuka halaman ini.</p><Link className="button button-primary auth-return" to="/">Kembali ke beranda</Link><Link className="auth-secondary-button" to="/login">Login ulang</Link></>:isChange?<><p>Wajib saat login pertama</p><form onSubmit={async e=>{e.preventDefault();setError('');const form=e.currentTarget;try{await apiClient.post('/auth/ganti-password',{password_lama:form.elements.password_lama.value,password_baru:form.elements.password_baru.value,password_baru_confirmation:form.elements.password_baru_confirmation.value});setSaved(true);}catch(err){setError(getApiError(err));}}}><label>Password lama<input name="password_lama" type="password" required autoComplete="current-password"/></label><label>Password baru<input name="password_baru" type="password" required minLength="8" autoComplete="new-password"/></label><label>Konfirmasi password baru<input name="password_baru_confirmation" type="password" required minLength="8" autoComplete="new-password"/></label><Button type="submit">Simpan password baru</Button></form><small className="auth-hint">Gunakan minimal 8 karakter.</small>{error&&<p className="auth-notice" role="alert">{error}</p>}{saved&&<p className="auth-notice" role="status">Password berhasil diubah di server.</p>}</>:<><p>Kajur dapat mereset ke password default.</p><Link className="button button-primary auth-return" to="/login">Kembali ke login</Link><Button kind="secondary" onClick={()=>setRequested(true)}>Minta reset (opsional)</Button><small className="auth-hint">Kontak: Kajur</small>{requested&&<p className="auth-notice" role="status">Permintaan reset tidak tersedia di kontrak API; hubungi Kajur.</p>}</>}</div></div>;
}
