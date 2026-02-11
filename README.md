# 🚀 Nogogeni Internal Letter Generator & DMS
**Final Project Magang - Divisi Administrasi Nogogeni ITS Team**

Sistem manajemen surat terpusat untuk mendigitalisasi proses manual (GDocs/Spreadsheet) menjadi alur kerja otomatis yang terintegrasi dengan Database dan Cloud Storage.

## 🎯 Tujuan Produk
- **Efisiensi:** Mengurangi beban kerja manual pembuatan ±800 surat per periode.
- **Inovasi:** Otomatisasi penomoran, pembuatan file PDF, dan pengiriman (Email/WA).
- **Integritas:** Memastikan arsip tersimpan rapi di Google Drive dengan metadata di Supabase.

## 🛠️ Tech Stack & Status
- **Framework:** Next.js (App Router) - Desktop Only.
- **Backend/DB:** Supabase (Auth & Database **CONNECTED**).
- **Storage:** Google Drive API (Folder structure: Year/Month).
- **Styling:** Tailwind CSS.

## 📂 Struktur Menu Utama
1. **Dashboard:** Informasi nomor surat terbaru & statistik.
2. **Generate Surat:** Auto-form & Batch generate (3 jenis surat).
3. **Daftar Surat:** List, search, filter, & status tracking.
4. **Kirim Surat:** Integrasi Email & WhatsApp.
5. **Template Surat:** Manajemen & validasi placeholder `<<snake_case>>`.
6. **Masukkan Surat Manual:** Penomoran otomatis untuk file docx eksternal.
7. **Arsip File:** Akses langsung folder Drive.
8. **Manajemen Akun:** Audit trail & profil staff.

## 📝 Catatan Implementasi
Proyek ini menggunakan **Vibe Coding** dengan konteks AI yang ketat. Semua logika bisnis seperti penomoran romawi, batch processing dengan separator `;`, dan lifecycle surat harus mengikuti aturan di `AI_CONTEXT.md`.