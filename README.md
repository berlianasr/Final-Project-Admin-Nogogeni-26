# � Nogogeni Surat

**Sistem Administrasi Surat Internal — Nogogeni ITS Team**

Aplikasi web internal untuk mendigitalisasi proses pembuatan dan pengelolaan surat organisasi Nogogeni ITS Team. Sistem ini menggantikan alur kerja manual (Google Docs/Spreadsheet) menjadi proses otomatis yang terintegrasi dengan **Supabase** sebagai database dan **Google Drive** sebagai penyimpanan arsip.

---

## 🎯 Tujuan

- **Efisiensi** — Mengotomatisasi pembuatan surat dalam jumlah besar (batch generate) dari template `.docx`.
- **Penomoran Otomatis** — Setiap surat mendapat nomor resmi secara otomatis dengan format `[Nomor]/Nogogeni ITS Team/[Bulan Romawi]/[Tahun]`.
- **Arsip Terpusat** — File surat tersimpan rapi di Google Drive dengan struktur folder `Tahun/Bulan`, dan metadata tercatat di database Supabase.

---

## 🛠️ Tech Stack

| Kategori      | Teknologi                                          |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router) — Desktop Only             |
| Language      | TypeScript                                         |
| Backend / DB  | Supabase (Auth & PostgreSQL)                       |
| Cloud Storage | Google Drive API (struktur folder: `Tahun/Bulan`)  |
| Styling       | Tailwind CSS 4                                     |
| Doc Engine    | Docxtemplater + PizZip (generate `.docx` dari template) |
| Font          | Geist & Geist Mono (Google Fonts)                  |

---

## 📂 Fitur Utama

### 1. 🏠 Dashboard Utama (`/`)
Menampilkan **nomor surat terakhir** secara real-time dan menyediakan navigasi cepat ke seluruh fitur.

### 2. 📂 Upload Template (`/template`)
Upload file template `.docx` yang berisi placeholder `<<snake_case>>`. Template digunakan sebagai dasar untuk generate surat.

### 3. ✍️ Manual Input (`/manual-input`)
Mendaftarkan surat yang dibuat secara manual (di luar sistem) agar mendapatkan **nomor surat resmi** dan tercatat di database.

### 4. ⚡ Generate Surat (`/generate`)
Fitur utama untuk **generate surat otomatis** dari template yang sudah diupload. Mendukung:
- Pemilihan template
- Pengisian data per placeholder
- Preview sebelum generate
- Batch generate dengan separator `;`
- Download hasil sebagai file `.docx` / `.zip`
- Upload otomatis ke Google Drive

### 5. 🗄️ Database (`/database`)
Melihat dan mengelola riwayat seluruh surat yang pernah di-generate, termasuk metadata dan status.

### 6. 🔐 Login (`/login`)
Autentikasi admin menggunakan email dan password melalui **Supabase Auth**. Hanya pengguna terautentikasi yang dapat mengakses sistem.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm

### Installation

```bash
# Clone repository
git clone <repository-url>
cd nogogeni-surat

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Environment Variables

Buat file `.env.local` dengan variabel berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
GOOGLE_DRIVE_FOLDER_ID=<google-drive-folder-id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account-email>
GOOGLE_PRIVATE_KEY=<service-account-private-key>
```

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── page.tsx            # Dashboard utama (nomor surat terakhir)
│   ├── login/              # Halaman login admin
│   ├── dashboard/          # Halaman profil user setelah login
│   ├── template/           # Upload & manajemen template .docx
│   ├── manual-input/       # Input surat manual
│   ├── generate/           # Generate surat dari template
│   ├── database/           # Riwayat & manajemen surat
│   ├── actions/            # Server actions (Google Drive API)
│   └── layout.tsx          # Root layout dengan Geist font
├── services/               # Business logic (surat, template, log, user)
├── lib/                    # Konfigurasi (Supabase client, dll)
├── modules/                # Modul fitur (auth, dll)
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions (roman converter, dll)
```

---

## 📝 Catatan

- Aplikasi ini dirancang khusus untuk **penggunaan desktop** (tidak responsif untuk mobile).

---

© 2026 Nogogeni ITS Team. Internal Administration System.