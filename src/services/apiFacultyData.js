import { apiClient, unwrapApiData } from './api';

const resources = {
  Profil: { path: '/dosen/saya/profil', method: 'put' },
  Rekognisi: { path: '/dosen/saya/rekognisi', method: 'post' },
  Penelitian: { path: '/dosen/saya/penelitian', method: 'post' },
  'Pengabdian': { path: '/dosen/saya/pengabdian', method: 'post' },
  'Publikasi': { path: '/dosen/saya/publikasi', method: 'post' },
  'Produk/Jasa': { path: '/dosen/saya/produk-jasa', method: 'post' },
  'Luaran': { path: '/dosen/saya/luaran', method: 'post' },
  'Integrasi': { path: '/dosen/saya/integrasi-pembelajaran', method: 'post' },
};

const text = (value) => String(value || '').trim();
const number = (value) => value === '' || value == null ? undefined : Number(value);
const slug = (value) => text(value).toLocaleLowerCase('id-ID').replaceAll(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const documentId = (values, label) => number(values[`__doc_${label}`]);
const recognitionType = (value) => {
  const key = slug(value);
  if (key.startsWith('visiting')) return 'visiting';
  if (key.startsWith('keynote')) return 'keynote';
  if (key.startsWith('editor')) return 'editor';
  if (key.startsWith('staf_ahli')) return 'staf_ahli';
  if (key.startsWith('penghargaan')) return 'penghargaan';
  return key;
};

export function mapFacultyPayload(category, values) {
  switch (category) {
    case 'Profil':
      return {
        nidn_nuptk: text(values['NIDN/NUPTK']),
        bidang_keahlian: text(values['Bidang keahlian']),
        sesuai_kompetensi_inti_ps: values['Kesesuaian dengan kompetensi inti PS'] === 'Sesuai',
        jabatan_akademik: text(values['Jabatan akademik']),
      };
    case 'Rekognisi':
      return {
        bidang_keahlian: text(values['Bidang keahlian']),
        jenis_rekognisi: recognitionType(values['Jenis rekognisi (e)']),
        rekognisi: text(values.Deskripsi),
        tingkat: ['lokal', 'regional'].includes(slug(values['Tingkat (Wilayah/Nasional/Internasional)'])) ? 'wilayah' : slug(values['Tingkat (Wilayah/Nasional/Internasional)']),
        tahun: number(values.Tahun),
        dokumen_id: documentId(values, 'Bukti pendukung (PDF)'),
      };
    case 'Penelitian':
    case 'Pengabdian':
      return {
        tahun: number(values.Tahun),
        peran: slug(values.Peran),
        judul: text(values['Judul penelitian'] || values['Judul pengabdian']),
        skema: text(values.Skema),
        sumber_dana: text(values['Sumber dana']),
        jumlah_dana: number(values['Jumlah pendanaan (Rp)']),
        dokumen_id: documentId(values, 'Bukti lembar pengesahan (PDF)'),
      };
    case 'Publikasi':
      return {
        tahun: number(values.Tahun), peran: slug(values.Peran), judul: text(values.Judul),
        jenis: text(values['Jenis (Buku/Jurnal/Konferensi/Prosiding/Media)']), tautan: text(values['Tautan (opsional)']) || undefined,
        dokumen_id: documentId(values, 'Dokumen publikasi (PDF)'),
      };
    case 'Produk/Jasa':
      return { nama: text(values['Nama produk/jasa']), deskripsi: text(values['Deskripsi produk/jasa']), tahun: number(values.Tahun), dokumen_id: documentId(values, 'Bukti penggunaan (PDF)') };
    case 'Luaran':
      return { jenis_luaran: slug(values['Kelompok luaran']), peran: slug(values.Peran), judul: text(values['Judul luaran']), tahun: number(values.Tahun) };
    case 'Integrasi':
      return { mata_kuliah_id: number(values['ID mata kuliah']), bentuk_integrasi: slug(values['Bentuk integrasi']), tahun: number(values.Tahun) };
    default:
      throw new Error(`Butir ${category} belum memiliki pemetaan endpoint API.`);
  }
}

export async function saveFacultyRecordApi(category, values) {
  const resource = resources[category];
  if (!resource) throw new Error(`Butir ${category} belum memiliki endpoint API.`);
  const payload = mapFacultyPayload(category, values);
  const requiredFields = {
    Profil: ['nidn_nuptk', 'bidang_keahlian', 'sesuai_kompetensi_inti_ps', 'jabatan_akademik'],
    Rekognisi: ['bidang_keahlian', 'jenis_rekognisi', 'rekognisi', 'tingkat', 'tahun', 'dokumen_id'],
    Penelitian: ['tahun', 'peran', 'judul', 'skema', 'sumber_dana', 'jumlah_dana', 'dokumen_id'],
    Pengabdian: ['tahun', 'peran', 'judul', 'skema', 'sumber_dana', 'jumlah_dana', 'dokumen_id'],
    Publikasi: ['tahun', 'peran', 'judul', 'jenis', 'dokumen_id'],
    'Produk/Jasa': ['nama', 'deskripsi', 'tahun', 'dokumen_id'],
    Luaran: ['jenis_luaran', 'peran', 'judul', 'tahun'],
    Integrasi: ['mata_kuliah_id', 'bentuk_integrasi', 'tahun'],
  }[category] || [];
  if (requiredFields.some((field) => payload[field] === undefined || payload[field] === '' || Number.isNaN(payload[field]))) {
    throw new Error('Lengkapi seluruh isian wajib dan dokumen bukti sebelum menyimpan.');
  }
  const response = await apiClient[resource.method](resource.path, payload);
  return unwrapApiData(response);
}

export async function listFacultyRecordsApi(category) {
  const resource = resources[category];
  if (!resource) throw new Error(`Butir ${category} belum memiliki endpoint API.`);
  const path = category === 'Profil' ? '/dosen/saya/profil' : resource.path;
  return unwrapApiData(await apiClient.get(path));
}
