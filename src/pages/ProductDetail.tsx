import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Images,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { formatPrice } from "../lib/formatters";
import { getProduct, subscribeProducts } from "../services/productService";
import type { Product, ProductCondition } from "../types";

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1100' height='820' viewBox='0 0 1100 820'%3E%3Crect width='1100' height='820' fill='%23f2f2f2'/%3E%3Cpath d='M170 610 400 355l160 178 91-104 282 324H170Z' fill='%23d6d6d6'/%3E%3Ccircle cx='760' cy='245' r='72' fill='%23e7e7e7'/%3E%3C/svg%3E";

const conditionLabels: Record<ProductCondition, string> = {
  new: "Sıfır",
  used: "2. El",
  refurbished: "Yenilenmiş",
  other: "Diğer",
};

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

export function ProductDetail() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productId) {
        setProduct(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextProduct = await getProduct(productId, { publicOnly: true });
        if (!isMounted) return;
        setProduct(nextProduct);
        setSelectedImage(nextProduct?.images[0]?.url || fallbackImage);
        setError("");
      } catch (nextError) {
        if (!isMounted) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Ürün detayı yüklenemedi.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      { publicOnly: true },
      setRelatedProducts,
      (nextError) => setError(nextError.message),
    );

    return unsubscribe;
  }, []);

  const productImages = product?.images.length
    ? product.images
    : [{ url: fallbackImage }];
  const subject = encodeURIComponent(
    product ? `HM Cheff ürün talebi: ${product.title}` : "HM Cheff ürün talebi",
  );
  const catalogBackState = getCatalogBackState();
  const cameFromProducts = Boolean(
    (location.state as { fromProducts?: boolean } | null)?.fromProducts,
  );

  function handleCatalogBack(event: MouseEvent<HTMLAnchorElement>) {
    if (!cameFromProducts) return;

    event.preventDefault();
    navigate(-1);
  }

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return relatedProducts
      .filter(
        (item) => item.id !== product.id && item.category === product.category,
      )
      .slice(0, 2);
  }, [product, relatedProducts]);

  return (
    <main className="page detail-page">
        <Link
          className="back-link"
          to="/urunler"
          state={catalogBackState}
          onClick={handleCatalogBack}
        >
          <ArrowLeft className="icon" aria-hidden="true" />
          Kataloğa dön
        </Link>

        {error && <div className="notice error">{error}</div>}

        {isLoading ? (
          <div className="loading-state detail-loading-state" role="status" aria-live="polite">
            <div className="detail-loader" aria-hidden="true">
              <span className="detail-loader-ring" />
              <span className="detail-loader-logo">
                <img src="/hm-cheff-favicon.jpg" alt="" />
              </span>
            </div>
            <div className="detail-loading-copy">
              <strong>Ürün detayı hazırlanıyor</strong>
              <p>Görseller ve teknik bilgiler yükleniyor...</p>
            </div>
            <div className="detail-loading-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : product ? (
          <>
            <section className="detail-layout">
              <div className="detail-gallery">
                <div className="detail-main-image">
                  <img
                    src={selectedImage || fallbackImage}
                    alt={product.title}
                  />
                </div>
                <div className="detail-thumbs">
                  {productImages.map((image) => (
                    <button
                      key={image.url}
                      className={selectedImage === image.url ? "active" : ""}
                      type="button"
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img src={image.url} alt={image.alt || product.title} />
                    </button>
                  ))}
                </div>
              </div>

              <aside className="detail-info">
                <p className="section-kicker icon-text">
                  <PackageSearch className="icon" aria-hidden="true" />
                  {product.category}
                </p>
                <h1>{product.title}</h1>
                <div className="detail-price">
                  {formatPrice(product.price, product.currency)}
                </div>
                <div className="detail-meta">
                  <span>
                    <MapPin className="icon" aria-hidden="true" />
                    {product.location || "Türkiye"}
                  </span>
                  <span>
                    <Tag className="icon" aria-hidden="true" />
                    {conditionLabels[product.condition]}
                  </span>
                  {product.featured && (
                    <span>
                      <ShieldCheck className="icon" aria-hidden="true" />
                      Vitrin ürünü
                    </span>
                  )}
                </div>

                <p className="detail-summary">{product.summary}</p>

                <div className="detail-actions">
                  <a
                    className="button primary"
                    href={`mailto:${product.contactEmail}?subject=${subject}`}
                  >
                    <Mail className="icon" aria-hidden="true" />
                    Teklif Al
                  </a>
                  <a className="button" href={`tel:${product.contactPhone}`}>
                    <Phone className="icon" aria-hidden="true" />
                    Hemen Ara
                  </a>
                </div>

                <div className="seller-box">
                  <strong className="icon-text">
                    <ChefHat className="icon" aria-hidden="true" />
                    HM Cheff Endustriyel Mutfak
                  </strong>
                  <span className="icon-text">
                    <Phone className="icon" aria-hidden="true" />
                    {product.contactPhone}
                  </span>
                  <span className="icon-text">
                    <Mail className="icon" aria-hidden="true" />
                    {product.contactEmail}
                  </span>
                </div>
              </aside>
            </section>

            <section className="detail-description">
              <div>
                <p className="section-kicker icon-text">
                  <Images className="icon" aria-hidden="true" />
                  Ürün açıklaması
                </p>
                <h2>
                  <PackageSearch className="icon" aria-hidden="true" />
                  Detaylar
                </h2>
              </div>
              <p>{product.description || product.summary}</p>
              <ul>
                <li>
                  <CheckCircle2 className="icon" aria-hidden="true" />
                  Profesyonel işletmeler için uygundur.
                </li>
                <li>
                  <CheckCircle2 className="icon" aria-hidden="true" />
                  Teklif ve teknik bilgi için doğrudan iletişim kurulabilir.
                </li>
              </ul>
            </section>

            {similarProducts.length > 0 && (
              <section className="related-section">
                <div className="products-header">
                  <div>
                    <p className="section-kicker">Benzer ürünler</p>
                    <h2>
                      <PackageSearch className="icon" aria-hidden="true" />
                      Aynı kategorideki ürünler
                    </h2>
                  </div>
                </div>
                <div className="product-grid">
                  {similarProducts.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div>
              <h1>Ürün bulunamadı</h1>
              <p>Bu ürün yayında olmayabilir veya kaldırılmış olabilir.</p>
              <Link
                className="button primary"
                to="/urunler"
                state={catalogBackState}
                onClick={handleCatalogBack}
              >
                Kataloğa dön
              </Link>
            </div>
          </div>
        )}
    </main>
  );
}
