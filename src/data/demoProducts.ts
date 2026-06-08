import type { Product } from "../types";

const contactEmail = "info@hmcheff.com.tr";
const contactPhone = "+902120000000";

export const demoProducts: Product[] = [
  {
    id: "demo-konveksiyon-firin",
    title: "Endüstriyel Konveksiyon Fırın",
    category: "Fırın & Pişirme",
    price: 68500,
    currency: "TRY",
    condition: "new",
    location: "İstanbul",
    summary:
      "Yoğun servis mutfakları için paslanmaz gövdeli, çok tepsili profesyonel fırın.",
    description:
      "Restoran, otel ve pastane kullanımı için uygun; homojen ısı dağılımı, güçlü fan sistemi ve kolay temizlenebilir iç hacim sunar.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
        alt: "Endüstriyel fırın ve profesyonel mutfak",
      },
    ],
    status: "published",
    featured: true,
    contactEmail,
    contactPhone,
    createdAt: new Date("2026-05-10T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-01T10:00:00.000Z").toISOString(),
  },
  {
    id: "demo-dikey-buzdolabi",
    title: "Çift Kapılı Dikey Buzdolabı",
    category: "Soğutma",
    price: 92500,
    currency: "TRY",
    condition: "new",
    location: "İstanbul",
    summary:
      "Geniş hacimli, çift kapılı ve profesyonel işletmeler için tasarlanmış soğutucu.",
    description:
      "Cafe, restoran ve üretim mutfaklarında gıda güvenliği için stabil soğutma performansı sağlar.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1588451639943-6b743e93d0f2?auto=format&fit=crop&w=1200&q=80",
        alt: "Profesyonel mutfak soğutma alanı",
      },
    ],
    status: "published",
    featured: true,
    contactEmail,
    contactPhone,
    createdAt: new Date("2026-05-14T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-30T10:00:00.000Z").toISOString(),
  },
  {
    id: "demo-paslanmaz-tezgah",
    title: "Paslanmaz Çelik Hazırlık Tezgahı",
    category: "Hazırlık Ekipmanları",
    price: 18500,
    currency: "TRY",
    condition: "new",
    location: "Kocaeli",
    summary:
      "Hijyenik üretim alanları için sağlam, kolay temizlenebilir çalışma tezgahı.",
    description:
      "304 kalite paslanmaz yüzey, alt raf opsiyonu ve farklı ölçülerde üretim seçeneği ile profesyonel mutfaklara uygundur.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
        alt: "Paslanmaz profesyonel mutfak tezgahı",
      },
    ],
    status: "published",
    featured: false,
    contactEmail,
    contactPhone,
    createdAt: new Date("2026-05-19T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-29T10:00:00.000Z").toISOString(),
  },
  {
    id: "demo-sanayi-ocak",
    title: "3 Gözlü Sanayi Tipi Ocak",
    category: "Ocak & Izgara",
    price: 37200,
    currency: "TRY",
    condition: "refurbished",
    location: "Ankara",
    summary:
      "Yoğun pişirme operasyonları için yüksek güçlü, yenilenmiş sanayi tipi ocak.",
    description:
      "Kontrolleri yapılmış, servis mutfaklarında günlük kullanıma uygun, güçlü brülör yapısına sahip ocak.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1514986888952-8cd320577b68?auto=format&fit=crop&w=1200&q=80",
        alt: "Profesyonel ocak ve pişirme alanı",
      },
    ],
    status: "published",
    featured: false,
    contactEmail,
    contactPhone,
    createdAt: new Date("2026-05-24T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-02T10:00:00.000Z").toISOString(),
  },
  {
    id: "demo-davlumbaz",
    title: "Endüstriyel Davlumbaz Sistemi",
    category: "Havalandırma",
    price: null,
    currency: "TRY",
    condition: "new",
    location: "İstanbul",
    summary:
      "Mutfak ölçüsüne göre projelendirilen paslanmaz davlumbaz ve filtre sistemi.",
    description:
      "Keşif ve ölçülendirme sonrası tekliflendirilir. Restoran ve üretim mutfakları için uygundur.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
        alt: "Endüstriyel mutfak havalandırma sistemi",
      },
    ],
    status: "hidden",
    featured: false,
    contactEmail,
    contactPhone,
    createdAt: new Date("2026-05-28T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-03T10:00:00.000Z").toISOString(),
  },
];
