# HM Cheff Endustriyel Mutfak

HM Cheff için hazırlanmış React vitrini ve Firebase tabanlı yönetim paneli.
Mevcut sürüm satış/ödeme akışı içermez; ziyaretçiler ürünleri inceler, teklif
ve detay için telefon veya e-posta ile iletişime geçer.

## Teknoloji

- React + TypeScript + Vite
- Firebase Hosting
- Firebase Auth ile yönetici girişi
- Firestore ile ürün verisi
- Firebase Cloud Functions ile Cloudflare R2 imzalı yükleme URL'i
- Cloudflare R2 ile ürün görsel teslimi

## Yerel Geliştirme

```bash
npm install
npm install --prefix functions
npm run dev
```

Firebase ortam değişkenleri yoksa uygulama yerel demo verisiyle açılır.
Katalog: `http://127.0.0.1:5173/`
Yönetim paneli: `http://127.0.0.1:5173/admin`
Ürün detay sayfası: `http://127.0.0.1:5173/urun/{productId}`

## Ortam Değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın ve Firebase web app
ayarlarını doldurun.

```bash
cp .env.example .env.local
```

Cloudflare R2 görsel yükleme için `createCloudflareImageUpload` fonksiyonunu
deploy edin ve şu frontend değerlerini ayarlayın:

- `VITE_CLOUDFLARE_UPLOAD_FUNCTION_URL`
- `VITE_CLOUDFLARE_DELIVERY_BASE_URL`

Firebase Functions tarafında gereken değerler:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_DELIVERY_BASE_URL`
- `ALLOWED_ORIGINS`

Kurulum örneği:

```bash
cp functions/.env.example functions/.env
firebase functions:secrets:set CLOUDFLARE_R2_ACCESS_KEY_ID
firebase functions:secrets:set CLOUDFLARE_R2_SECRET_ACCESS_KEY
npm run functions:build
firebase deploy --only functions:createCloudflareImageUpload
```

`functions/.env` içindeki `ALLOWED_ORIGINS` değeri virgülle ayrılmış origin
listesidir:

```text
http://127.0.0.1:5173,http://localhost:5173,https://YOUR_DOMAIN
```

Deploy sonrası oluşan function URL'ini `.env` içinde
`VITE_CLOUDFLARE_UPLOAD_FUNCTION_URL` olarak kullanın. R2 public development URL
veya custom domain değerini de `VITE_CLOUDFLARE_DELIVERY_BASE_URL` olarak girin.

## Yönetici Yetkisi

Firestore yazma işlemleri Firebase Auth custom claim ile korunur. Admin paneline
erişecek kullanıcıda `admin: true` custom claim bulunmalıdır. Bu yetki frontend
üzerinden verilmez; Firebase Admin SDK, Firebase CLI veya güvenilir bir admin
ortamında tanımlanmalıdır.

Service account JSON dosyalarını repoya commit etmeyin; `.gitignore` bu dosyaları
yok sayacak şekilde ayarlanmıştır.

Public site sadece `status` değeri `published` olan ürünleri okuyabilir.

## Komutlar

```bash
npm run lint
npm run build
npm run functions:build
npm run emulators
npm run deploy
```
# hmcheff
