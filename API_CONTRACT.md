# VAC STECHOQ API Contract

Dokumen ini berisi spesifikasi API (API Contract) untuk komunikasi antara aplikasi mobile (Frontend) dan server (Backend). 
Base URL untuk seluruh request adalah `/api`.

Semua *endpoint* yang memerlukan autentikasi harus menyertakan Header:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication

### A. Register User
Mendaftarkan user baru. (User belum memiliki perangkat saat tahap ini).

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body (application/json):**
  ```json
  {
    "name": "John Doe",
    "hospitalName": "RSUD Sehat",
    "username": "johndoe",
    "password": "securepassword123"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "username": "johndoe"
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "Registration failed. Username may already exist."
  }
  ```

### B. Login User
Mengautentikasi user dan mendapatkan JWT token. Token ini memiliki *payload* yang berisi `userId` dan `deviceId` (dari perangkat yang saat ini aktif/di-bind). Jika user belum menghubungkan perangkat apa pun, `deviceId` akan bernilai `null`.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body (application/json):**
  ```json
  {
    "username": "johndoe",
    "password": "securepassword123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "userId": 1,
      "deviceId": null,
      "username": "johndoe"
    }
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

---

## 2. Device Management

### A. Bind / Change Active Device
Menghubungkan perangkat baru berdasarkan hasil pemindaian QR Code. Ini akan memutus koneksi (mengubah `isActive = false` di tabel relasi `TrDeviceUser`) dari device lama (jika ada) dan membuat koneksi ke device baru, lalu mengembalikan token JWT yang baru.

- **URL:** `/api/device/bind`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token)
- **Request Body (application/json):**
  ```json
  {
    "qrKey": "aBcDe"
  }
  ```
- **Success Response (200 OK):**
  Aplikasi mobile *WAJIB* menyimpan `newToken` ini untuk menimpa token lama, karena payload `deviceId`-nya sudah berubah/terisi.
  ```json
  {
    "message": "Device bound successfully",
    "newToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "userId": 1,
      "newDeviceId": 2
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "Invalid qrKey or device not found"
  }
  ```

---

## 3. Therapy Sessions (History)

### A. Upload/Save Therapy Session
Mengirim data riwayat terapi (hasil sinkronisasi dari alat BLE) untuk disimpan ke database backend.
**Catatan untuk Backend:** `userId` dan `deviceId` tidak dikirim dari body, melainkan wajib diekstrak dari JWT token middleware.

- **URL:** `/api/therapy-sessions`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token)
- **Request Body (application/json):**
  ```json
  {
    "sessionDate": "2026-07-13",
    "title": "Sesi Terapi Pagi",
    "date": "13 Jul 2026",
    "mode": "Kontinyu",
    "duration": "45 Menit"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "message": "Therapy session saved successfully"
  }
  ```

### B. Get Therapy Sessions
Mengambil riwayat terapi milik user yang sedang login (berdasarkan token).

- **URL:** `/api/therapy-sessions`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **URL Query Parameters (Optional):**
  - `year` (string) -> `?year=2026` (Digunakan untuk memfilter string `sessionDate` yang berawalan tahun tertentu).
- **Success Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "deviceId": 1,
        "sessionDate": "2026-07-13",
        "title": "Sesi Terapi Pagi",
        "date": "13 Jul 2026",
        "mode": "Kontinyu",
        "duration": "45 Menit",
        "createdAt": "2026-07-13T10:00:00.000Z"
      },
      {
        "id": 2,
        "userId": 1,
        "deviceId": 1,
        "sessionDate": "2026-07-12",
        "title": "Sesi Terapi Sore",
        "date": "12 Jul 2026",
        "mode": "Intermiten",
        "duration": "30 Menit",
        "createdAt": "2026-07-12T15:30:00.000Z"
      }
    ]
  }
  ```
