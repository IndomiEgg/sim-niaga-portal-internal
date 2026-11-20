# SIM Niaga · Portal Internal

Frontend React + Vite untuk staf Jurusan Administrasi Niaga: Dosen, Admin Prodi, Kaprodi, dan Kajur.

## Menjalankan

```bash
npm ci
npm run dev
```

Login staf memakai API Laravel. Salin `.env.example` menjadi `.env.local`, lalu atur `VITE_API_BASE_URL` ke base API, misalnya `/api/v1`. Untuk development lokal, proxy Vite hanya aktif jika `VITE_API_PROXY_TARGET` diisi dengan origin backend. Aplikasi tidak lagi memakai target API eksternal bawaan.

## Batas integrasi saat ini

Form data dosen, profil, unggah dokumen, permintaan hapus, persetujuan Kajur, rekap, dan ekspor diarahkan ke endpoint kontrak API. Layar staf yang belum memiliki rute kontrak tampil sebagai belum tersedia dan tidak menyimpan data lokal. Proses Admin Prodi seperti verifikasi permohonan, unggah surat terbit, dan akun Kajur masih perlu endpoint/field konfirmasi dari backend sebelum implementasinya dapat diselesaikan.

P-07 berada di aplikasi layanan mahasiswa. Sesuai keputusan pemilik proyek, `POST /publik/akses-mahasiswa` harus menerima NIM dan `kode_pelacakan`, lalu backend memvalidasi kecocokan kode dengan NIM sebelum mengirim OTP. Perubahan ini perlu diterapkan pada backend/kontrak API.

## Validasi frontend

```bash
npm run lint
npm run build
```
