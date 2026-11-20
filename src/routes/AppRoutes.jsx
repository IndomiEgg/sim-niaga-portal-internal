import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { roleProfiles, screens } from '../data/screens';
import { PortalLayout } from '../components/layout/PortalLayout';
import { LoginPage, SystemPage } from '../pages/auth/AuthPages';
import DosenPage from '../pages/dosen/DosenPage';
import AdminProdiPage from '../pages/admin-prodi/AdminProdiPage';
import KaprodiPage from '../pages/kaprodi/KaprodiPage';
import KajurPage from '../pages/kajur/KajurPage';
import { apiTokenKey } from '../services/api';
import { isLocalPreview } from '../services/previewMode';

const getScreen = (code) => screens.find((screen) => screen.code.toLowerCase() === (code || '').toLowerCase());

function PortalRoute() {
  const { screenCode } = useParams();
  const [apiUser] = useState(() => { try { return JSON.parse(localStorage.getItem('simniaga-api-user') || 'null'); } catch { return null; } });
  const preview = isLocalPreview();
  const allowedRoles = preview ? Object.keys(roleProfiles) : (apiUser?.peran || []).map((item) => ({ dosen: 'Dosen', admin_prodi: 'Admin Prodi', kaprodi: 'Kaprodi', kajur: 'Kajur' }[item.peran || item])).filter((role) => roleProfiles[role]);
  const [role, setRole] = useState(() => { const saved = localStorage.getItem('sim-role'); return allowedRoles.includes(saved) ? saved : allowedRoles[0] || 'Admin Prodi'; });
  if ((!preview && !localStorage.getItem(apiTokenKey)) || !allowedRoles.length) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/app/K-04" replace />;
  const screen = getScreen(screenCode) || getScreen(roleProfiles[role].nav[0]);
  if (screen.code === 'K-01') return <Navigate to="/login" replace />;
  if (screen.code.startsWith('K-')) return <SystemPage screen={screen} />;
  const allowed = screen.users.split(',').some((user) => ['Semua', 'Semua peran berakun'].includes(user.trim()) || user.trim() === role) || roleProfiles[role].nav.includes(screen.code);
  if (!allowed) return <Navigate to="/app/K-04" replace />;
  const Page = ({ Dosen: DosenPage, 'Admin Prodi': AdminProdiPage, Kaprodi: KaprodiPage, Kajur: KajurPage })[role];
  return <PortalLayout role={role} setRole={setRole} allowedRoles={allowedRoles} preview={preview} current={screen}><Page screen={screen} /></PortalLayout>;
}

export function AppRoutes() {
  return <Routes><Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<LoginPage />} /><Route path="/app/:screenCode" element={<PortalRoute />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
}

export function AppRouter({ children }) { return <BrowserRouter>{children}</BrowserRouter>; }
