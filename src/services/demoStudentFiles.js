// IndexedDB keeps uploaded demo documents available after refresh in the same browser.
const databaseName = 'simniaga-preview-files';
const storeName = 'student-documents';
let databasePromise;
const allowedExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']);

export function getStudentFileError(file) {
  if (!file) return 'Pilih berkas yang valid.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.has(extension)) return 'Format yang didukung: PDF, DOC/DOCX, XLS/XLSX, JPG, dan PNG.';
  if (file.size > 5 * 1024 * 1024) return 'Ukuran berkas maksimal 5 MB.';
  return '';
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Penyimpanan berkas lokal tidak tersedia.'));
  });
  return databasePromise;
}

function runStore(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Berkas demo gagal diproses.'));
    transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan berkas demo gagal.'));
  }));
}

export function getStudentFiles() {
  return runStore('readonly', (store) => store.getAll());
}

export function getStudentFile(id) {
  return runStore('readonly', (store) => store.get(id));
}

export function addStudentFile({ file, program, semester, nim, ticket, year, name }) {
  const validationError = getStudentFileError(file);
  if (validationError) throw new Error(validationError);
  const record = {
    id: `student-file-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    file,
    name: name || file.name || 'Berkas mahasiswa',
    size: file.size,
    type: file.type || 'application/octet-stream',
    program: String(program || '').trim(),
    semester: String(semester || '').trim(),
    year: String(year || '').trim(),
    nim: String(nim || '').trim(),
    ticket: String(ticket || '').trim(),
    createdAt: new Date().toISOString(),
  };
  return runStore('readwrite', (store) => store.put(record)).then(() => record);
}

export async function findStudentFiles({ program, semester, nim, ticket }) {
  const clean = (value) => String(value || '').trim().toLocaleLowerCase('id-ID');
  if (!program || !semester || !nim || !ticket) return [];
  const files = await getStudentFiles();
  return files.filter((record) =>
    clean(record.program) === clean(program)
    && record.semester === String(semester)
    && clean(record.nim) === clean(nim)
    && clean(record.ticket) === clean(ticket));
}

export async function removeStudentFile(id) {
  if (!id) return false;
  const existing = await getStudentFile(id);
  if (!existing) return false;
  await runStore('readwrite', (store) => store.delete(id));
  return true;
}

export function openStudentFile(record) {
  if (!record?.file) return;
  const url = URL.createObjectURL(record.file);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = record.name;
  link.rel = 'noreferrer';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
