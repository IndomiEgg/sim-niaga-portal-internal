export const summaryByRole = {
  Dosen:[['Total data tersimpan','24','+3 bulan ini','blue'],['Dokumen terverifikasi','18','75% dari total','green'],['Menunggu verifikasi','4','Perlu tindak lanjut','amber'],['Permintaan aktif','2','1 diperbarui hari ini','purple']],
  'Admin Prodi':[['Permohonan masuk','18','+6 hari ini','blue'],['Perlu verifikasi','7','3 mendekati tenggat','amber'],['Surat diproses','9','4 siap ditandatangani','purple'],['Selesai bulan ini','42','+12% dari bulan lalu','green']],
  Kaprodi:[['Dosen aktif','32','4 program studi','blue'],['Kelengkapan data','86%','+8% semester ini','green'],['Perlu ditinjau','12','Dokumen dan profil','amber'],['Laporan tersedia','8','Terakhir diperbarui hari ini','purple']],
  Kajur:[['Akun aktif','48','4 program studi','blue'],['Antrean persetujuan','6','2 permintaan penghapusan','amber'],['Layanan berjalan','9','Seluruh program studi','green'],['Aktivitas hari ini','27','Semua perubahan tercatat','purple']],
};

export const requests = [
  {ticket:'SK-2026-0148',name:'Nadia Putri Ananda',nim:'2305101008',service:'Surat keterangan aktif kuliah',date:'17 Nov 2026',status:'Perlu verifikasi'},
  {ticket:'SK-2026-0147',name:'Fajar Ramadhan',nim:'2305101021',service:'Surat pengantar magang',date:'17 Nov 2026',status:'Diproses'},
  {ticket:'SK-2026-0146',name:'Aulia Rahmi',nim:'2205101043',service:'Surat keterangan lulus',date:'16 Nov 2026',status:'Menunggu tanda tangan'},
  {ticket:'SK-2026-0145',name:'Dimas Pratama',nim:'2305101015',service:'Surat rekomendasi',date:'16 Nov 2026',status:'Selesai'},
  {ticket:'SK-2026-0144',name:'Putri Maharani',nim:'2205101007',service:'Surat keterangan aktif kuliah',date:'15 Nov 2026',status:'Perlu perbaikan'},
];

export const records = [
  {code:'PBL-2026-018',name:'Pengembangan model pembelajaran digital',owner:'Dr. Maya Putri',category:'Penelitian',year:'2026',status:'Terverifikasi'},
  {code:'PKM-2026-009',name:'Pendampingan UMKM produk lokal',owner:'Dr. Arif Hidayat',category:'Pengabdian',year:'2026',status:'Menunggu verifikasi'},
  {code:'PUB-2025-032',name:'Digitalisasi rantai pasok UMKM',owner:'Dra. Lina Sari',category:'Publikasi',year:'2025',status:'Terverifikasi'},
  {code:'DOK-2026-041',name:'Sertifikat kompetensi digital',owner:'Dr. Maya Putri',category:'Dokumen pendukung',year:'2026',status:'Perlu perbaikan'},
  {code:'MHS-2026-026',name:'Rekap kesiapan sidang akhir',owner:'Admin Prodi',category:'Kemahasiswaan',year:'2026',status:'Terverifikasi'},
];

export const activity = [
  ['Permohonan surat baru diterima','Nadia Putri · Surat aktif kuliah','10 menit lalu','blue'],
  ['Dokumen berhasil diverifikasi','Sertifikat kompetensi · Maya Putri','1 jam lalu','green'],
  ['Permintaan penghapusan menunggu persetujuan','Data publikasi · Dr. Arif Hidayat','2 jam lalu','amber'],
];
