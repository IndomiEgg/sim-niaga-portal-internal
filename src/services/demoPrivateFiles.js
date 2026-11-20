// Sensitive preview uploads stay in IndexedDB and never enter localStorage.
const databaseName = 'simniaga-preview-private-files';
const storeName = 'private-files';
let databasePromise;

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Penyimpanan berkas privat tidak tersedia.'));
  });
  return databasePromise;
}

function runStore(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Berkas privat gagal diproses.'));
    transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan berkas privat gagal.'));
  }));
}

export function savePrivateFile(recordId, field, file) {
  if (!recordId || !field || !file) return Promise.resolve(false);
  const id = `${recordId}:${field}`;
  return runStore('readwrite', (store) => store.put({ id, file, name: file.name, type: file.type, size: file.size })).then(() => true);
}

export function getPrivateFile(recordId, field) {
  if (!recordId || !field) return Promise.resolve(null);
  return runStore('readonly', (store) => store.get(`${recordId}:${field}`)).then((record) => record?.file || null);
}

export async function openPrivateFile(recordId, field) {
  // Open a tab before awaiting IndexedDB so the browser treats it as a user action.
  const previewWindow = window.open('about:blank', '_blank');
  const file = await getPrivateFile(recordId, field);
  if (!file) {
    previewWindow?.close();
    throw new Error('Berkas scan tidak tersedia di browser ini. Pastikan berkas dibuat di browser dan alamat yang sama.');
  }
  const url = URL.createObjectURL(file);
  if (previewWindow) {
    previewWindow.opener = null;
    previewWindow.location.href = url;
  } else {
    const link = window.document.createElement('a');
    link.href = url;
    link.download = file.name || 'scan-ktm';
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  return true;
}
