import { useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Building2,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Handshake,
  LayoutGrid,
  Mail,
  MessageSquareText,
  MapPin,
  Phone,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import corporateHeroBg from "../assets/bg3.jpeg";
import kitchenImg from "../assets/kitchen.jpeg";
import cakeImg from "../assets/cake.jpeg";
import hmFrontImg from "../assets/hmfront-optimized.jpeg";
import restaurantImg from "../assets/restaurant.jpeg";
import { useScrollReveal } from "../hooks/useScrollReveal";

const corporateHeroStyle = {
  "--corporate-hero-bg": `url(${corporateHeroBg})`,
} as CSSProperties;

export function HomePage() {
  useScrollReveal();
  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState("");
  const [contactError, setContactError] = useState("");

  function updateContactField(field: keyof typeof contactForm, value: string) {
    setContactForm((current) => ({ ...current, [field]: value }));
  }

  function updatePhoneField(value: string) {
    setContactForm((current) => ({
      ...current,
      phone: value.replace(/\D/g, "").slice(0, 15),
    }));
  }

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const normalizedEmail = contactForm.email.trim();
    const phoneDigits = contactForm.phone.trim();

    setContactError("");
    setContactStatus("");

    if (!/^\d{10,15}$/.test(phoneDigits)) {
      setContactError(
        "Telefon numarası sadece rakamlardan oluşmalı ve 10-15 hane olmalıdır.",
      );
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setContactError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    const subject = encodeURIComponent(
      `HM Cheff iletişim talebi: ${contactForm.name}`,
    );
    const body = encodeURIComponent(
      [
        `Ad Soyad: ${contactForm.name}`,
        `Firma: ${contactForm.company || "-"}`,
        `Telefon: ${phoneDigits}`,
        `E-posta: ${normalizedEmail}`,
        "",
        "Mesaj:",
        contactForm.message,
      ].join("\n"),
    );

    setContactStatus(
      "E-posta taslağı hazırlandı. Lütfen açılan e-posta penceresinden gönderimi tamamlayın.",
    );
    window.location.href = `mailto:info@hmcheff.com?subject=${subject}&body=${body}`;
  }

  return (
    <main>
      <section className="corporate-hero" style={corporateHeroStyle}>
        <div className="page corporate-hero-inner">
          <div className="hero-copy" data-reveal="up">
            <p className="eyebrow icon-text">
              <ChefHat className="icon" aria-hidden="true" />
              HM Cheff Endustriyel Mutfak
            </p>
            <h1>
              Profesyonel mutfaklar için güvenilir ekipman ve proje desteği.
            </h1>
            <p>
              Restoran, otel, kafe, pastane ve üretim mutfakları için ürün
              seçimi, tekliflendirme ve teknik danışmanlık süreçlerini tek çatı
              altında yönetiyoruz.
            </p>
            <div className="hero-actions">
              <Link
                className="button primary"
                to="/urunler"
                state={{ resetProductsScroll: true }}
              >
                <LayoutGrid className="icon" aria-hidden="true" />
                Ürünleri İncele
              </Link>
              <a className="button" href="tel:+902120000000">
                <Phone className="icon" aria-hidden="true" />
                Hemen Ara
              </a>
            </div>
          </div>
          <div className="hero-stat-panel" data-reveal="right">
            <div>
              <strong>Proje</strong>
              <span>Alan planına uygun ekipman önerisi</span>
            </div>
            <div>
              <strong>Ürün</strong>
              <span>Pişirme, soğutma, hazırlık ve servis grupları</span>
            </div>
            <div>
              <strong>Destek</strong>
              <span>Teklif ve teknik bilgi için doğrudan iletişim</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page intro-section" id="hakkimizda">
        <div className="intro-story" data-reveal="left">
          <p className="section-kicker icon-text">
            <Building2 className="icon" aria-hidden="true" />
            Kurumsal
          </p>
          <h2>
            HM Cheff, profesyonel mutfak yatırımlarında doğru ekipmana
            odaklanır.
          </h2>
          <div className="intro-copy">
            <p>
              Endüstriyel mutfak ekipmanı seçimi; kapasite, kullanım yoğunluğu,
              hijyen standardı, enerji verimliliği ve servis sürekliliği ile
              birlikte değerlendirilmelidir. HM Cheff Endustriyel Mutfak,
              işletmelerin gerçek ihtiyacını anlayarak uygun ürün gruplarını
              önceliklendirir.
            </p>
            <p>
              Bugünkü yapı satış odaklı bir online katalog olarak çalışır.
              Ziyaretçiler ürünleri detaylı inceleyebilir, teklif veya teknik
              bilgi için telefon ve e-posta üzerinden doğrudan iletişime
              geçebilir.
            </p>
          </div>
          <div className="intro-highlights">
            <span data-reveal="up" className="reveal-delay-1">
              <CheckCircle2 className="icon" aria-hidden="true" />
              İhtiyaca göre ürün seçimi
            </span>
            <span data-reveal="up" className="reveal-delay-2">
              <CheckCircle2 className="icon" aria-hidden="true" />
              Teknik özellik odaklı teklif
            </span>
            <span data-reveal="up" className="reveal-delay-3">
              <CheckCircle2 className="icon" aria-hidden="true" />
              Türkiye geneli talep takibi
            </span>
          </div>
        </div>
        <div className="intro-media" data-reveal="right">
          <img
            src={kitchenImg}
            alt="Profesyonel endüstriyel mutfak çalışma alanı"
          />
          <div className="intro-media-note">
            <strong>Doğru ekipman, daha düzenli operasyon.</strong>
            <span>
              Kapasite, alan ve kullanım yoğunluğuna göre ürün planlama.
            </span>
          </div>
        </div>
      </section>

      <section className="page service-section" id="hizmetler">
        <div className="section-heading" data-reveal="up">
          <p className="section-kicker icon-text">
            <Wrench className="icon" aria-hidden="true" />
            Hizmetler
          </p>
          <h2>İşletmenizin mutfak operasyonuna uygun çözümler</h2>
        </div>
        <div className="service-feature-layout">
          <div className="service-media" data-reveal="left">
            <img
              src={cakeImg}
              alt="Endüstriyel mutfak ekipmanları ve hazırlık alanı"
            />
            <div>
              <strong>Tek çatı altında ürün ve proje yaklaşımı</strong>
              <span>Pişirme, soğutma, hazırlık ve servis ekipmanları.</span>
            </div>
          </div>
          <div className="service-grid">
            <article data-reveal="up" className="reveal-delay-1">
              <LayoutGrid className="icon" aria-hidden="true" />
              <h3>Endüstriyel mutfak ürünleri</h3>
              <p>
                Pişirme, hazırlık, soğutma, bulaşık, servis ve depolama
                ekipmanları.
              </p>
            </article>
            <article data-reveal="up" className="reveal-delay-2">
              <Ruler className="icon" aria-hidden="true" />
              <h3>Proje danışmanlığı</h3>
              <p>
                Mutfak alanı, kapasite ve iş akışına göre doğru ürün planlaması.
              </p>
            </article>
            <article data-reveal="up" className="reveal-delay-3">
              <ClipboardCheck className="icon" aria-hidden="true" />
              <h3>Tekliflendirme</h3>
              <p>
                Ürün detayları, teknik ihtiyaçlar ve bütçeye göre net teklif
                süreci.
              </p>
            </article>
            <article data-reveal="up" className="reveal-delay-4">
              <Truck className="icon" aria-hidden="true" />
              <h3>Tedarik koordinasyonu</h3>
              <p>
                Talep edilen ürünlerin süreç takibi ve işletmeye uygun teslim
                planı.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="process-band">
        <div className="page process-grid">
          <div data-reveal="left">
            <p className="section-kicker icon-text">
              <Sparkles className="icon" aria-hidden="true" />
              Çalışma modeli
            </p>
            <h2>Talep, analiz, ürün seçimi ve teklif süreci net ilerler.</h2>
          </div>
          <ol className="process-list">
            <li data-reveal="up" className="reveal-delay-1">
              <span>01</span>
              <strong>İhtiyaç analizi</strong>
              <p>
                İşletme türü, günlük kapasite ve mevcut alan değerlendirilir.
              </p>
            </li>
            <li data-reveal="up" className="reveal-delay-2">
              <span>02</span>
              <strong>Ürün planı</strong>
              <p>
                Kategori ve teknik özelliklere göre uygun ekipman listesi
                hazırlanır.
              </p>
            </li>
            <li data-reveal="up" className="reveal-delay-3">
              <span>03</span>
              <strong>Teklif ve takip</strong>
              <p>Fiyat, termin ve ürün detayları müşteriyle paylaşılır.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="page reference-section">
        <div className="reference-layout">
          <div className="reference-media" data-reveal="left">
            <img
              src={restaurantImg}
              alt="Restoran ve profesyonel mutfak servis alanı"
            />
            <div>
              <strong>
                Farklı işletme tipleri için uyarlanabilir ürün seçimi
              </strong>
              <span>
                Kapasite, servis hızı ve operasyon düzeni birlikte
                değerlendirilir.
              </span>
            </div>
          </div>
          <div className="reference-content" data-reveal="right">
            <div className="section-heading">
              <p className="section-kicker icon-text">
                <Award className="icon" aria-hidden="true" />
                Çalıştığımız işletmeler
              </p>
              <h2>
                Restoranlardan üretim mutfaklarına kadar geniş kullanım alanı
              </h2>
            </div>
            <div className="reference-grid">
              {[
                "Restoran",
                "Otel",
                "Kafe",
                "Pastane",
                "Catering",
                "Üretim mutfağı",
              ].map((item) => (
                <div key={item} data-reveal="up">
                  <CheckCircle2 className="icon" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page cooperation-section" id="is-birligi">
        <div className="cooperation-intro" data-reveal="left">
          <p className="section-kicker icon-text">
            <Handshake className="icon" aria-hidden="true" />
            İş Birliği
          </p>
          <h2>Ürün, tedarik ve proje süreçlerinde birlikte çalışabiliriz.</h2>
          <p>
            HM Cheff, profesyonel mutfak ekipmanları alanında tedarikçiler,
            proje ekipleri ve işletmelerle uzun vadeli, şeffaf ve sürdürülebilir
            iş birlikleri kurmayı hedefler.
          </p>
          <a className="button primary" href="#iletisim">
            <Mail className="icon" aria-hidden="true" />
            İş birliği talebi gönder
          </a>
        </div>
        <div className="cooperation-grid">
          <article data-reveal="up" className="reveal-delay-1">
            <Truck className="icon" aria-hidden="true" />
            <h3>Tedarikçiler</h3>
            <p>
              Endüstriyel mutfak ekipmanları, yedek parça ve tamamlayıcı ürün
              gruplarında güvenilir tedarik kanallarıyla çalışırız.
            </p>
          </article>
          <article data-reveal="up" className="reveal-delay-2">
            <Ruler className="icon" aria-hidden="true" />
            <h3>Proje ortakları</h3>
            <p>
              Restoran, otel ve üretim mutfağı projelerinde alan planlama, ürün
              seçimi ve teklif süreçlerine destek veririz.
            </p>
          </article>
          <article data-reveal="up" className="reveal-delay-3">
            <ShieldCheck className="icon" aria-hidden="true" />
            <h3>Kurumsal müşteriler</h3>
            <p>
              Birden fazla lokasyon veya düzenli alım ihtiyacı olan işletmeler
              için planlı ürün ve teklif süreci oluştururuz.
            </p>
          </article>
        </div>
      </section>

      <section className="page contact-section" id="iletisim">
        <div className="contact-top-row">
          <div className="contact-info-card" data-reveal="left">
            <p className="section-kicker icon-text">
              <Phone className="icon" aria-hidden="true" />
              İletişim
            </p>
            <h2>Ürün, proje veya teklif talepleriniz için bize ulaşın.</h2>
            <p>
              Ürün kodu, ihtiyaç duyulan adet, işletme türü ve teslimat şehri
              bilgilerini paylaşmanız teklif sürecini hızlandırır.
            </p>
            <div className="contact-list">
              <a href="tel:+905379874160">
                <Phone className="icon" aria-hidden="true" />
                +90 537 987 41 60
              </a>
              <a href="mailto:info@hmcheff.com">
                <Mail className="icon" aria-hidden="true" />
                info@hmcheff.com
              </a>
              <span>
                <MapPin className="icon" aria-hidden="true" />
                Altındağ / Ankara
              </span>
            </div>
          </div>

          <form
            className="contact-form contact-form-card"
            onSubmit={handleContactSubmit}
            data-reveal="right"
          >
            <div className="contact-form-heading">
              <h3>
                <MessageSquareText className="icon" aria-hidden="true" />
                Teklif ve bilgi talep formu
              </h3>
              <p>
                Talebinizi iletin, ürün ve proje detayları için size dönüş
                yapalım.
              </p>
            </div>

            <div className="two-col">
              <div className="field">
                <label htmlFor="contact-name">Ad soyad</label>
                <div className="input-with-icon">
                  <User className="icon" aria-hidden="true" />
                  <input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(event) =>
                      updateContactField("name", event.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="contact-company">Firma</label>
                <div className="input-with-icon">
                  <Building2 className="icon" aria-hidden="true" />
                  <input
                    id="contact-company"
                    value={contactForm.company}
                    onChange={(event) =>
                      updateContactField("company", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="two-col">
              <div className="field">
                <label htmlFor="contact-phone">Telefon</label>
                <div className="input-with-icon">
                  <Phone className="icon" aria-hidden="true" />
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10,15}"
                    maxLength={15}
                    title="Telefon numarası sadece rakamlardan oluşmalı ve 10-15 hane olmalıdır."
                    value={contactForm.phone}
                    onChange={(event) => updatePhoneField(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="contact-email">E-posta</label>
                <div className="input-with-icon">
                  <Mail className="icon" aria-hidden="true" />
                  <input
                    id="contact-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                    title="Lütfen geçerli bir e-posta adresi girin."
                    value={contactForm.email}
                    onChange={(event) =>
                      updateContactField("email", event.target.value.trim())
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="contact-message">Talep detayı</label>
              <div className="textarea-with-icon">
                <MessageSquareText className="icon" aria-hidden="true" />
                <textarea
                  id="contact-message"
                  value={contactForm.message}
                  onChange={(event) =>
                    updateContactField("message", event.target.value)
                  }
                  placeholder="Ürün, adet, işletme türü ve teslimat şehrini paylaşabilirsiniz."
                  required
                />
              </div>
            </div>

            <button className="button primary" type="submit">
              <Send className="icon" aria-hidden="true" />
              Mesaj Gönder
            </button>
            {contactError && (
              <p className="contact-form-status error">{contactError}</p>
            )}
            {contactStatus && (
              <p className="contact-form-status">{contactStatus}</p>
            )}
          </form>
        </div>

        <div className="map-showcase" data-reveal="up">
          <figure className="map-photo-card">
            <img
              src={hmFrontImg}
              alt="HM Cheff Endustriyel Mutfak mağaza önü"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <strong>HM Cheff Endustriyel Mutfak</strong>
              <span>Mağazamızı ziyaret ederek ürünleri yerinde inceleyin.</span>
            </figcaption>
          </figure>

          <div className="map-panel" aria-label="HM Cheff harita">
            <iframe
              title="HM Cheff Endustriyel Mutfak harita"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1529.6239514619613!2d32.854864538895086!3d39.935844192880246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d34e5f213e9c29%3A0x353b0c31033e44ee!2zT3BlcmEgTWV5ZGFuxLEsIEtvc292YSBTay4gTm86MSwgMDYwNTAgQWx0xLFuZGHEny9BbmthcmE!5e0!3m2!1ssv!2str!4v1780952573607!5m2!1ssv!2str"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
