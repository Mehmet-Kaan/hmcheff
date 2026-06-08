import { type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Handshake, LayoutGrid, Mail, MapPin, Phone } from "lucide-react";

function readStoredProductsUi() {
  const storedUi = window.sessionStorage.getItem("hm-cheff-products-ui");
  if (!storedUi) return undefined;

  try {
    return JSON.parse(storedUi);
  } catch {
    return undefined;
  }
}

function getCatalogBackState() {
  const scrollY = Number(
    window.sessionStorage.getItem("hm-cheff-scroll:/urunler"),
  );

  return {
    hmCheffProductsScroll: Number.isFinite(scrollY) ? scrollY : undefined,
    hmCheffProductsUi: readStoredProductsUi(),
    restoreProductsScroll: true,
  };
}

export function SiteFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const catalogBackState = getCatalogBackState();
  const isProductDetail = location.pathname.startsWith("/urun/");
  const cameFromProducts = Boolean(
    (location.state as { fromProducts?: boolean } | null)?.fromProducts,
  );

  function handleCatalogBack(event: MouseEvent<HTMLAnchorElement>) {
    if (!isProductDetail || !cameFromProducts) return;

    event.preventDefault();
    navigate(-1);
  }

  return (
    <footer className="site-footer">
      <div className="page footer-grid">
        <div className="footer-brand">
          <span className="footer-brand-logo" aria-hidden="true">
            <img src="/hm-cheff-favicon.jpg" alt="" />
          </span>
          <div>
            <strong>HM Cheff Endustriyel Mutfak</strong>
            <p>Endüstriyel mutfak ekipmanları satış ve proje danışmanlığı.</p>
          </div>
        </div>
        <div>
          <span>
            <Phone className="icon" aria-hidden="true" />
            Telefon
          </span>
          <a href="tel:+905379874160">+90 537 987 41 60</a>
        </div>
        <div>
          <span>
            <Mail className="icon" aria-hidden="true" />
            E-posta
          </span>
          <a href="mailto:info@hmcheff.com.tr">info@hmcheff.com.tr</a>
        </div>
        {!isProductDetail && (
          <div>
            <span>
              <Handshake className="icon" aria-hidden="true" />
              İş Birliği
            </span>
            <Link to="/#is-birligi">Birlikte çalışalım</Link>
          </div>
        )}
        <div>
          <span>
            {isProductDetail ? (
              <LayoutGrid className="icon" aria-hidden="true" />
            ) : (
              <MapPin className="icon" aria-hidden="true" />
            )}
            {isProductDetail ? "Katalog" : "Merkez"}
          </span>
          {isProductDetail ? (
            <Link
              to="/urunler"
              state={catalogBackState}
              onClick={handleCatalogBack}
            >
              Tüm ürünler
            </Link>
          ) : (
            <Link to="/#iletisim">Ankara / Türkiye</Link>
          )}
        </div>
      </div>
    </footer>
  );
}
