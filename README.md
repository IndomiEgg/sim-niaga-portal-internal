# SIM Niaga · Portal Internal

Frontend staf: Dosen, Admin Prodi, Kaprodi, dan Kajur.

## Menjalankan

```bash
npm ci
npm run dev
```

Mode pratinjau lokal tersedia dari halaman login pada `localhost`/`127.0.0.1`. Data pratinjau tersimpan di browser.

## API

Atur `VITE_API_BASE_URL` sesuai alamat backend Laravel. Untuk berbagi permohonan dan dokumen dengan aplikasi layanan mahasiswa, kedua aplikasi harus memakai backend/API yang sama. Data IndexedDB pratinjau tidak dibagi lintas origin.
