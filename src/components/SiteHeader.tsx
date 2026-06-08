import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Factory,
  Home,
  LayoutGrid,
  MapPin,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { isFirebaseConfigured } from "../lib/firebase";

type SiteHeaderProps = {
  active: "home" | "corporate" | "products" | "contact";
  productDetail?: boolean;
};

export function SiteHeader({ active, productDetail = false }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="topbar">
      <div className="topbar-strip">
        <div className="topbar-strip-inner">
          <span className="icon-text">
            <Factory className="icon" aria-hidden="true" />
            Profesyonel endüstriyel mutfak çözümleri
          </span>
          <span className="icon-text">
            <MapPin className="icon" aria-hidden="true" />
            Ankara merkezli satış ve danışmanlık
          </span>
        </div>
      </div>
      <div className="topbar-inner">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand-logo" aria-hidden="true">
            <img src="/hm-cheff-favicon.jpg" alt="" />
          </span>
          <span>
            HM Cheff Endustriyel Mutfak
            <small>{isFirebaseConfigured ? "Canlı katalog" : "Demo katalog"}</small>
          </span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          aria-label={isMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X className="icon" aria-hidden="true" /> : <Menu className="icon" aria-hidden="true" />}
        </button>

        <nav
          className={`nav-actions ${isMenuOpen ? "is-open" : ""}`}
          id="site-menu"
          aria-label="Ana menü"
        >
          <Link
            className={`nav-link ${active === "home" ? "active" : ""}`}
            to="/"
            onClick={closeMenu}
          >
            <Home className="icon" aria-hidden="true" />
            Ana Sayfa
          </Link>
          <Link
            className={`nav-link ${active === "corporate" ? "active" : ""}`}
            to="/#hakkimizda"
            onClick={closeMenu}
          >
            <Building2 className="icon" aria-hidden="true" />
            Kurumsal
          </Link>
          <Link
            className={`nav-link ${active === "products" ? "active" : ""}`}
            to="/urunler"
            state={{ resetProductsScroll: true }}
            onClick={closeMenu}
          >
            <LayoutGrid className="icon" aria-hidden="true" />
            Ürünler
          </Link>
          {productDetail ? (
            <a className="nav-link" href="tel:+902120000000" onClick={closeMenu}>
              <Phone className="icon" aria-hidden="true" />
              Ara
            </a>
          ) : (
            <Link
              className={`nav-link ${active === "contact" ? "active" : ""}`}
              to="/#iletisim"
              onClick={closeMenu}
            >
              <Phone className="icon" aria-hidden="true" />
              İletişim
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
