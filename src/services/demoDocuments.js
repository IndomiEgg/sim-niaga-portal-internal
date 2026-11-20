// IndexedDB keeps preview uploads available after refresh without putting file bytes in localStorage.
const databaseName = 'simniaga-preview-faculty-files';
const storeName = 'documents';
let databasePromise;
const listeners = new Set();
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Penyimpanan dokumen lokal tidak tersedia.'));
  });
  return databasePromise;
}

function runStore(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Dokumen gagal diproses.'));
    transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan dokumen lokal gagal.'));
  }));
}

export function getUploadError(file) {
  if (!file) return '';
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return 'Ukuran berkas maksimal 5 MB.';
  return '';
}

function notify() {
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event('simniaga:demo-documents-changed'));
}

export function subscribeToDemoDocuments(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoDocuments() {
  return runStore('readonly', (store) => store.getAll()).then((documents) => documents.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
}

export function getDemoDocument(id) {
  return runStore('readonly', (store) => store.get(id));
}

export async function addDemoDocument(file) {
  if (!file) return null;
  const validationError = getUploadError(file);
  if (validationError) throw new Error(validationError);
  const document = {
    id: `demo-file-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploadedAt: new Date().toLocaleDateString('id-ID'),
    createdAt: new Date().toISOString(),
  };
  await runStore('readwrite', (store) => store.put(document));
  notify();
  return document;
}

export async function removeDemoDocument(id) {
  const document = await getDemoDocument(id);
  if (!document) return false;
  await runStore('readwrite', (store) => store.delete(id));
  notify();
  return true;
}

export function openDemoDocument(document, download = false) {
  if (!document?.file) return;
  const url = URL.createObjectURL(document.file);
  const link = window.document.createElement('a');
  link.href = url;
  if (download) link.download = document.name;
  else link.target = '_blank';
  link.rel = 'noreferrer';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
