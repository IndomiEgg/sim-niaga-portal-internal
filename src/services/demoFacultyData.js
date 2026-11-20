// Shared localStorage-backed record store used by Dosen, Kaprodi, and Kajur demo screens.
const recordsKey = 'simniaga-demo-faculty-records';
const changedEvent = 'simniaga:faculty-records-changed';

function parseArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function getDemoUser() {
  try {
    return JSON.parse(localStorage.getItem('simniaga-demo-user') || 'null');
  } catch {
    return null;
  }
}

export function getDemoAccounts() {
  return parseArray('simniaga-demo-accounts');
}

export function getDemoUserProgram(role = 'Dosen') {
  const user = getDemoUser();
  if (!user?.email) return '';
  const account = getDemoAccounts().find((row) =>
    row.email?.toLowerCase() === user.email.toLowerCase()
    && (!role || row.peran === role));
  return account?.prodi || user.prodi || '';
}

export function getFacultyRecords() {
  const stored = parseArray(recordsKey).filter((record) => !record.softDeleted);
  const legacyCategories = [
    ['simniaga-dosen-profil', 'Profil'],
    ['simniaga-dosen-rekognisi', 'Rekognisi'],
    ['simniaga-dosen-penelitian', 'Penelitian'],
    ['simniaga-dosen-pengabdian', 'Pengabdian'],
    ['simniaga-dosen-publikasi', 'Publikasi'],
    ['simniaga-dosen-produk-jasa', 'Produk/Jasa'],
    ['simniaga-dosen-luaran', 'Luaran'],
    ['simniaga-dosen-integrasi', 'Integrasi'],
  ];
  const knownIds = new Set(stored.map((record) => `${record.category}:${record.ownerEmail}:${record.id}`));
  const legacy = legacyCategories.flatMap(([key, category]) => parseArray(key).map((values, index) => {
    const ownerEmail = String(values.ownerEmail || '').toLowerCase();
    const id = String(values.recordId || `${key}-${ownerEmail || 'unknown'}-${index}`);
    const identity = `${category}:${ownerEmail}:${id}`;
    if (knownIds.has(identity)) return null;
    knownIds.add(identity);
    const user = getDemoAccounts().find((account) => account.email?.toLowerCase() === ownerEmail);
    const savedValues = Object.fromEntries(Object.entries(values).filter(([key]) => !['ownerEmail', 'program'].includes(key)));
    return {
      id,
      ownerEmail,
      ownerName: values['Nama dosen'] || user?.nama || ownerEmail || 'Dosen',
      program: values.program || user?.prodi || '',
      category,
      createdAt: values.createdAt || new Date().toISOString(),
      values: { ...savedValues, recordId: values.recordId || id, ownerEmail, program: values.program || user?.prodi || '' },
    };
  }).filter(Boolean));
  return [...stored, ...legacy];
}

export function permanentlyDeleteDemoFacultyRecord(id, targetKey = '') {
  if (!id) return false;
  const records = parseArray(recordsKey);
  const retained = records.filter((record) => String(record.id) !== String(id));
  const legacyKeys = new Set([
    targetKey,
    'simniaga-dosen-profil',
    'simniaga-dosen-rekognisi',
    'simniaga-dosen-penelitian',
    'simniaga-dosen-pengabdian',
    'simniaga-dosen-publikasi',
    'simniaga-dosen-produk-jasa',
    'simniaga-dosen-luaran',
    'simniaga-dosen-integrasi',
  ].filter(Boolean));
  let removed = retained.length !== records.length;
  if (removed) localStorage.setItem(recordsKey, JSON.stringify(retained));

  // Purge the legacy category cache too, so an approved deletion cannot reappear.
  legacyKeys.forEach((key) => {
    const rows = parseArray(key);
    const next = rows.filter((row) => String(row.recordId) !== String(id));
    if (next.length !== rows.length) {
      localStorage.setItem(key, JSON.stringify(next));
      removed = true;
    }
  });
  if (!removed) return false;
  window.dispatchEvent(new Event(changedEvent));
  return true;
}

export function saveFacultyRecord({ category, values }) {
  const user = getDemoUser();
  const existing = category === 'Profil'
    ? getFacultyRecords().find((record) => record.category === category && record.ownerEmail === user?.email?.toLowerCase())
    : null;
  const record = {
    id: existing?.id || values.recordId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ownerEmail: user?.email?.toLowerCase() || '',
    ownerName: values['Nama dosen'] || user?.name || user?.email || 'Dosen',
    program: getDemoUserProgram('Dosen'),
    category,
    createdAt: new Date().toISOString(),
    values,
  };
  const records = getFacultyRecords().filter((item) => item.id !== record.id);
  localStorage.setItem(recordsKey, JSON.stringify([record, ...records]));
  window.dispatchEvent(new Event(changedEvent));
  return record;
}

export function removeFacultyRecord(id) {
  if (!id) return false;
  const records = getFacultyRecords();
  const next = records.filter((record) => record.id !== id);
  if (next.length === records.length) return false;
  localStorage.setItem(recordsKey, JSON.stringify(next));
  window.dispatchEvent(new Event(changedEvent));
  return true;
}

export function subscribeToFacultyRecords(listener) {
  const update = () => listener();
  window.addEventListener(changedEvent, update);
  window.addEventListener('storage', update);
  return () => {
    window.removeEventListener(changedEvent, update);
    window.removeEventListener('storage', update);
  };
}
