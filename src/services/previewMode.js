const previewKey = 'simniaga-local-preview';
const snapshotKey = 'simniaga-local-preview-snapshot';
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const sessionKeys = [previewKey, 'sim-role', 'simniaga-api-token', 'simniaga-api-user', 'simniaga-demo-user'];

export const previewRoles = ['Dosen', 'Admin Prodi', 'Kaprodi', 'Kajur'];

function previewAccounts() {
  return [
    { nama: 'Dosen Pratinjau', email: 'dosen.preview@local.test', peran: 'Dosen', prodi: 'D3 Administrasi Bisnis', status: 'Aktif' },
    { nama: 'Admin Prodi Pratinjau', email: 'admin.preview@local.test', peran: 'Admin Prodi', prodi: 'D3 Administrasi Bisnis', status: 'Aktif' },
    { nama: 'Kaprodi Pratinjau', email: 'kaprodi.preview@local.test', peran: 'Kaprodi', prodi: 'D3 Administrasi Bisnis', status: 'Aktif' },
    { nama: 'Kajur Pratinjau', email: 'kajur.preview@local.test', peran: 'Kajur', prodi: 'D3 Administrasi Bisnis', status: 'Aktif' },
  ];
}

export function canUseLocalPreview() {
  return import.meta.env.DEV && typeof window !== 'undefined' && localHosts.has(window.location.hostname);
}

export function isLocalPreview() {
  return canUseLocalPreview() && localStorage.getItem(previewKey) === '1';
}

export function setLocalPreviewRole(role) {
  if (!isLocalPreview() || !previewRoles.includes(role)) return false;
  const account = previewAccounts().find((item) => item.peran === role);
  localStorage.setItem('sim-role', role);
  localStorage.setItem('simniaga-demo-user', JSON.stringify({
    email: account.email,
    role,
    name: account.nama,
    prodi: account.prodi,
  }));
  return true;
}

export function startLocalPreview(role) {
  if (!canUseLocalPreview() || !previewRoles.includes(role)) return false;

  // Keep form, ticket, document, and account demo data shared across all preview roles.
  if (!isLocalPreview()) {
    const snapshot = Object.fromEntries(sessionKeys.map((key) => [key, localStorage.getItem(key)]));
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
  }

  localStorage.removeItem('simniaga-api-token');
  localStorage.removeItem('simniaga-api-user');
  localStorage.setItem(previewKey, '1');
  const currentAccounts = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('simniaga-demo-accounts') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  })();
  const accounts = [...currentAccounts];
  previewAccounts().forEach((account) => {
    if (!accounts.some((item) => item.email?.toLowerCase() === account.email.toLowerCase())) accounts.push(account);
  });
  localStorage.setItem('simniaga-demo-accounts', JSON.stringify(accounts));
  setLocalPreviewRole(role);
  return true;
}

export function endLocalPreview() {
  let snapshot;
  try { snapshot = JSON.parse(localStorage.getItem(snapshotKey) || 'null'); } catch { /* Ignore a malformed session snapshot. */ }
  sessionKeys.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(snapshotKey);
  if (snapshot && typeof snapshot === 'object') {
    sessionKeys.forEach((key) => {
      const value = snapshot[key];
      if (!(key in snapshot)) return;
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
  }
  // Shared local demo content is intentionally retained for later review.
}
