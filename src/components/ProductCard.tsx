import { Link, useLocation } from "react-router-dom";
import { Eye, Mail, MapPin, Phone, Tag } from "lucide-react";
import { formatPrice } from "../lib/formatters";
import type { Product, ProductCondition } from "../types";

type ProductCardProps = {
  catalogState?: {
    category: string;
    query: string;
    sort: string;
  };
  product: Product;
  reveal?: boolean;
  revealDelayClass?: string;
};

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'%3E%3Crect width='900' height='700' fill='%23f2f2f2'/%3E%3Cpath d='M172 480 328 318l112 116 70-72 218 226H172Z' fill='%23d6d6d6'/%3E%3Ccircle cx='638' cy='210' r='58' fill='%23e7e7e7'/%3E%3C/svg%3E";

const conditionLabels: Record<ProductCondition, string> = {
  new: "Sıfır",
  used: "2. El",
  refurbished: "Yenilenmiş",
  other: "Diğer",
};

export function ProductCard({
  catalogState,
  product,
  reveal = false,
  revealDelayClass = "",
}: ProductCardProps) {
  const location = useLocation();
  const primaryImage = product.images[0]?.url || fallbackImage;
  const subject = encodeURIComponent(`HM Cheff ürün talebi: ${product.title}`);
  const productDetailState =
    location.pathname === "/urunler"
      ? { fromProducts: true, hmCheffProductsUi: catalogState }
      : undefined;
  const saveCatalogScroll = () => {
    if (window.location.pathname === "/urunler") {
      const scrollY = window.scrollY;
      const currentState = window.history.state;
      window.sessionStorage.setItem("hm-cheff-scroll:/urunler", String(scrollY));
      if (catalogState) {
        window.sessionStorage.setItem(
          "hm-cheff-products-ui",
          JSON.stringify(catalogState),
        );
      }
      window.history.replaceState(
        {
          ...currentState,
          usr: {
            ...(currentState?.usr || {}),
            hmCheffProductsScroll: scrollY,
            hmCheffProductsUi: catalogState,
            restoreProductsScroll: true,
          },
        },
        "",
      );
    }
  };

  return (
    <article
      className={`product-card ${revealDelayClass}`.trim()}
      data-reveal={reveal ? "up" : undefined}
    >
      <Link
        className="product-card-link"
        to={`/urun/${product.id}`}
        state={productDetailState}
        onClick={saveCatalogScroll}
      >
        <span className="sr-only">{product.title} detay sayfası</span>
      </Link>
      <Link
        className="product-media"
        to={`/urun/${product.id}`}
        state={productDetailState}
        onClick={saveCatalogScroll}
      >
        <img src={primaryImage} alt={product.images[0]?.alt || product.title} />
        <div className="badge-row">
          {product.featured && <span className="pill">Vitrin</span>}
          <span className="pill">
            <Tag className="icon" aria-hidden="true" />
            {conditionLabels[product.condition]}
          </span>
        </div>
      </Link>
      <div className="product-body">
        <div className="product-title-row">
          <h2>
            <Link
              to={`/urun/${product.id}`}
              state={productDetailState}
              onClick={saveCatalogScroll}
            >
              {product.title}
            </Link>
          </h2>
          <span className="price">{formatPrice(product.price, product.currency)}</span>
        </div>
        <div className="meta-line">
          <MapPin className="icon" aria-hidden="true" />
          <span>
            {product.location || "Türkiye"} · {product.category || "Ürün"}
          </span>
        </div>
        <p className="product-summary">{product.summary}</p>
        <div className="card-actions">
          <Link
            className="button detail-button"
            to={`/urun/${product.id}`}
            state={productDetailState}
            onClick={saveCatalogScroll}
          >
            <Eye className="icon" aria-hidden="true" />
            Detayları Gör
          </Link>
          <a
            className="button primary"
            href={`mailto:${product.contactEmail}?subject=${subject}`}
          >
            <Mail className="icon" aria-hidden="true" />
            Teklif Al
          </a>
          <a className="button phone-button" href={`tel:${product.contactPhone}`}>
            <Phone className="icon" aria-hidden="true" />
            Ara
          </a>
        </div>
      </div>
    </article>
  );
}
