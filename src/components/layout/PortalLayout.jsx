import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roleProfiles, screens } from '../../data/screens';
import { logoutApi } from '../../services/api';
import { endLocalPreview, setLocalPreviewRole } from '../../services/previewMode';
import { Brand } from '../ui/Primitives';

const dosenNav = [
  ['Beranda', 'D-01'],
  ['Data Saya', null],
  ['Profil', 'D-02'],
  ['Rekognisi', 'D-03'],
  ['Penelitian', 'PB-1'],
  ['Pengabdian', 'D-05'],
  ['Publikasi', 'D-06'],
  ['Produk/Jasa', 'D-07'],
  ['Luaran', 'D-08'],
  ['Integrasi', 'D-09'],
  ['Dokumen Saya', 'D-10'],
  ['Data tersimpan', 'D-13'],
  ['Permintaan Hapus', 'D-12'],
  ['Akun', 'K-02'],
];

export function PortalLayout({ role, setRole, allowedRoles = Object.keys(roleProfiles), preview = false, current, children }) {
  const navigate = useNavigate();
  const profile = roleProfiles[role];
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = async () => { if (preview) endLocalPreview(); else { try { await logoutApi(); } catch { /* Local session is cleared even if the server is offline. */ } } navigate('/login', { replace: true }); };
  const navScreens = profile.nav.map((code) => screens.find((screen) => screen.code === code)).filter(Boolean);
  const groups = [...new Set(navScreens.map((item) => item.group))];

  if (role === 'Dosen') {
    return <div className={'portal-layout portal-layout-' + role.toLowerCase().replace(' ', '-')}>
      <aside className={'sidebar ' + (menuOpen ? 'sidebar-open' : '')}>
        <div className="dosen-sidebar-brand"><Brand /></div>
        <nav className="dosen-nav">
          {dosenNav.map(([label, code]) => code ? <Link key={label} onClick={() => setMenuOpen(false)} className={'dosen-nav-link ' + (current?.code === code ? 'active' : '')} to={'/app/' + code}>{label}</Link> : <div key={label} className="dosen-nav-section">{label}</div>)}
        </nav>
        <button className="dosen-logout" onClick={logout}>Keluar</button>
      </aside>
      <div className="portal-main">
        <header className="portal-header dosen-header">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu">☰</button>
          <label className="dosen-global-search"><span>⌕</span><input placeholder="Cari di cakupan data Anda..." /></label>
          <div className="dosen-user"><b>{profile.name}</b><small>Dosen · Prodi</small></div>
        </header>
        <main className="page-content dosen-page-content">{children}</main>
        <footer className="portal-footer dosen-footer">SIM Jurusan · Administrasi Niaga <span>{preview?'PRATINJAU LOKAL · data browser':'API terhubung'}</span></footer>
      </div>
    </div>;
  }

  return <div className="portal-layout">
    <aside className={'sidebar ' + (menuOpen ? 'sidebar-open' : '')}>
      <div className="sidebar-brand"><Brand /></div>
      <div className="side-workspace"><span className="workspace-icon">AN</span><span><b>Administrasi Niaga</b><small>Politeknik Negeri Medan</small></span><span className="chevron">⌄</span></div>
      <div className="role-switch"><label>{preview?'PRATINJAU ROLE LOKAL':'PERAN AKUN'}</label><select value={role} onChange={(event) => { const nextRole = event.target.value; if (!allowedRoles.includes(nextRole)) return; setRole(nextRole); if(preview)setLocalPreviewRole(nextRole);else localStorage.setItem('sim-role', nextRole); navigate('/app/' + roleProfiles[nextRole].nav[0], { replace: true }); }}>{allowedRoles.map((name) => <option key={name}>{name}</option>)}</select></div>
      <div className="side-nav">{groups.map((group) => <details className="nav-group" key={group} open={current?.group === group}><summary className="nav-label">{group}</summary>{navScreens.filter((item) => item.group === group).map((item) => <Link key={item.code} onClick={() => setMenuOpen(false)} className={'nav-link ' + (current?.code === item.code ? 'nav-active' : '')} to={'/app/' + item.code}><span className="nav-icon">{navIcon(item.code)}</span><span>{item.title.replace(/ \(.+\)/, '').replace(/ \(A[1-8]\)/, '')}</span></Link>)}</details>)}</div>
      <div className="sidebar-bottom"><div className="help-card"><span>✳</span><b>Butuh bantuan?</b><small>Pusat panduan SIM Niaga</small><button onClick={() => window.alert('Panduan SIM Niaga akan tersedia setelah konten disepakati.')}>Buka panduan →</button></div><div className="profile-row"><span className="avatar">{profile.initials}</span><span><b>{profile.name}</b><small>{role}</small></span><button aria-label="Keluar" onClick={logout}>↗</button></div></div>
    </aside>
    <div className="portal-main"><header className="portal-header"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu">☰</button><div className="breadcrumbs"><Link to={'/app/' + profile.nav[0]}>Beranda</Link><span>/</span><Link to={'/app/' + (navScreens.find((item) => item.group === current?.group)?.code || profile.nav[0])}>{current?.group || role}</Link><span>/</span><b>{current?.title || 'Beranda'}</b></div><div className="header-actions"><span className="header-date">SIM Jurusan Administrasi Niaga</span><button className="icon-button" aria-label="Cari" onClick={() => document.querySelector('.search-box input')?.focus()}>⌕</button><button className="icon-button notification-button" aria-label="Notifikasi" onClick={() => window.alert('Tidak ada notifikasi baru.')}>♧<i /></button><span className="header-avatar">{profile.initials}</span></div></header><main className="page-content">{children}</main><footer className="portal-footer"><span>SIM Data Jurusan · Administrasi Niaga</span><span>{preview?'PRATINJAU LOKAL · data uji hanya di browser':'API terhubung'}</span></footer></div>
  </div>;
}

function navIcon(code) {
  if (code.endsWith('01')) return '⌂';
  if (code.includes('02')) return '▣';
  if (code.includes('03')) return '▤';
  if (code.includes('04')) return '✓';
  if (code.includes('05')) return '⌕';
  if (code.includes('06')) return '▥';
  if (code.includes('07')) return '⇄';
  if (code.includes('08')) return '✉';
  if (code.includes('09')) return '◇';
  if (code.includes('10')) return '◷';
  return '▧';
}

