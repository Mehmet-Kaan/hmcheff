import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import {
  Building2,
  ChefHat,
  Factory,
  List,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Wrench,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { subscribeProducts } from "../services/productService";
import type { Product } from "../types";

type ProductsUiState = {
  category: string;
  query: string;
  sort: string;
};

function readStoredProductsUi(): ProductsUiState | null {
  const storedValue = window.sessionStorage.getItem("hm-cheff-products-ui");
  if (!storedValue) return null;

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<ProductsUiState>;
    return {
      category: parsedValue.category || "all",
      query: parsedValue.query || "",
      sort: parsedValue.sort || "featured",
    };
  } catch {
    return null;
  }
}

function normalizeCategoryKey(category: string) {
  return category.trim().toLocaleLowerCase("tr-TR");
}

function chooseCategoryLabel(currentLabel: string, nextLabel: string) {
  const currentStartsUpper = /^[A-ZÇĞİÖŞÜ]/.test(currentLabel);
  const nextStartsUpper = /^[A-ZÇĞİÖŞÜ]/.test(nextLabel);
  return !currentStartsUpper && nextStartsUpper ? nextLabel : currentLabel;
}

export function Storefront() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      { publicOnly: true },
      (nextProducts) => {
        setProducts(nextProducts);
        setIsLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const locationState = location.state as {
      hmCheffProductsScroll?: number;
      hmCheffProductsUi?: ProductsUiState;
      resetProductsScroll?: boolean;
      restoreProductsScroll?: boolean;
    } | null;
    const shouldResetProductsScroll =
      navigationType !== "POP" && Boolean(locationState?.resetProductsScroll);
    const shouldRestoreProductsScroll =
      !shouldResetProductsScroll &&
      (Boolean(locationState?.restoreProductsScroll) ||
        typeof locationState?.hmCheffProductsScroll === "number");

    if (!isLoading && shouldResetProductsScroll) {
      window.sessionStorage.removeItem("hm-cheff-scroll:/urunler");
      window.sessionStorage.removeItem("hm-cheff-products-ui");
      window.requestAnimationFrame(() => {
        setQuery("");
        setCategory("all");
        setSort("featured");
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
      return;
    }

    if (isLoading || !shouldRestoreProductsScroll) return;

    const storedUi = locationState?.hmCheffProductsUi ?? readStoredProductsUi();
    if (storedUi) {
      window.requestAnimationFrame(() => {
        setQuery(storedUi.query);
        setCategory(storedUi.category);
        setSort(storedUi.sort);
      });
    }

    const storedScroll =
      locationState?.hmCheffProductsScroll ??
      Number(window.sessionStorage.getItem("hm-cheff-scroll:/urunler"));
    if (!Number.isFinite(storedScroll) || storedScroll <= 0) return;

    let attempts = 0;
    const restoreScroll = () => {
      window.scrollTo({ top: storedScroll, left: 0, behavior: "auto" });
      attempts += 1;

      if (attempts < 20 && Math.abs(window.scrollY - storedScroll) > 2) {
        window.requestAnimationFrame(restoreScroll);
      }
    };

    window.requestAnimationFrame(restoreScroll);
  }, [isLoading, location.state, navigationType, products.length]);

  const categoryGroups = useMemo(() => {
    return products.reduce<Record<string, { count: number; label: string }>>(
      (acc, product) => {
        const trimmedCategory = product.category.trim();
        if (!trimmedCategory) return acc;

        const categoryKey = normalizeCategoryKey(trimmedCategory);
        const currentGroup = acc[categoryKey];
        acc[categoryKey] = {
          count: (currentGroup?.count || 0) + 1,
          label: currentGroup
            ? chooseCategoryLabel(currentGroup.label, trimmedCategory)
            : trimmedCategory,
        };
        return acc;
      },
      {},
    );
  }, [products]);

  const categories = useMemo(
    () => [
      "all",
      ...Object.entries(categoryGroups)
        .sort(([, first], [, second]) => first.label.localeCompare(second.label, "tr"))
        .map(([categoryKey]) => categoryKey),
    ],
    [categoryGroups],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    const normalizedCategory = normalizeCategoryKey(category);
    const filtered = products.filter((product) => {
      const matchesCategory =
        category === "all" ||
        normalizeCategoryKey(product.category) === normalizedCategory;
      const text = [
        product.title,
        product.category,
        product.location,
        product.summary,
        product.description,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return (
        matchesCategory && (!normalizedQuery || text.includes(normalizedQuery))
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "price-low") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-high") return (b.price ?? 0) - (a.price ?? 0);
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [category, products, query, sort]);
  const revealKey = `${isLoading}-${visibleProducts.map((product) => product.id).join("-")}`;

  useScrollReveal(revealKey);

  return (
    <main>
        <section className="search-hero">
          <div className="page search-hero-inner">
            <div className="hero-copy" data-reveal="left">
              <p className="eyebrow icon-text">
                <ChefHat className="icon" aria-hidden="true" />
                HM Cheff ürün kataloğu
              </p>
              <h1>
                Endüstriyel mutfak ekipmanlarını kategoriye göre inceleyin.
              </h1>
              <p>
                Ürün kartlarından detay sayfalarına geçin, teknik bilgi ve
                teklif için doğrudan telefon veya e-posta ile iletişime geçin.
              </p>
            </div>
            <div className="quick-contact" id="iletisim" data-reveal="right">
              <strong className="icon-text">
                <Phone className="icon" aria-hidden="true" />
                Hızlı iletişim
              </strong>
              <a href="tel:+905379874160">
                <Phone className="icon" aria-hidden="true" />
                +90 537 987 41 60
              </a>
              <a href="mailto:info@hmcheff.com.tr">
                <Mail className="icon" aria-hidden="true" />
                info@hmcheff.com.tr
              </a>
            </div>
          </div>
        </section>

        <section
          className="page classified-search"
          aria-label="Ürün arama"
          data-reveal="up"
        >
          <div className="search-box">
            <Search className="icon" aria-hidden="true" />
            <input
              id="product-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ürün, kategori veya şehir ara"
            />
          </div>
          <select
            className="select-with-icon"
            id="category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Kategori"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Tüm kategoriler" : categoryGroups[item]?.label}
              </option>
            ))}
          </select>
          <select
            className="select-with-icon"
            id="sort-filter"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sıralama"
          >
            <option value="featured">Vitrine göre</option>
            <option value="price-low">Fiyat artan</option>
            <option value="price-high">Fiyat azalan</option>
          </select>
        </section>

        <section className="page content-layout" id="urunler">
          <aside className="category-sidebar" data-reveal="left">
            <h2>
              <Tags className="icon" aria-hidden="true" />
              Kategoriler
            </h2>
            <button
              className={category === "all" ? "active" : ""}
              type="button"
              onClick={() => setCategory("all")}
            >
              <span>
                <List className="icon" aria-hidden="true" />
                Tüm ilanlar
              </span>
              <strong>{products.length}</strong>
            </button>
            {categories
              .filter((item) => item !== "all")
              .map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  type="button"
                  onClick={() => setCategory(item)}
                >
                  <span>
                    <PackageSearch className="icon" aria-hidden="true" />
                    {categoryGroups[item]?.label}
                  </span>
                  <strong>{categoryGroups[item]?.count}</strong>
                </button>
              ))}
          </aside>

          <div className="products-panel">
            <div className="products-header" data-reveal="up">
              <div>
                <p className="section-kicker icon-text">
                  <ShieldCheck className="icon" aria-hidden="true" />
                  Vitrin ilanları
                </p>
                <h2>
                  <PackageSearch className="icon" aria-hidden="true" />
                  Endüstriyel mutfak ürünleri
                </h2>
              </div>
              <span className="icon-text">
                <SlidersHorizontal className="icon" aria-hidden="true" />
                {visibleProducts.length} ürün gösteriliyor
              </span>
            </div>

            {error && <div className="notice error">{error}</div>}

            {isLoading ? (
              <div className="loading-state">
                <p>Ürünler yükleniyor...</p>
              </div>
            ) : visibleProducts.length ? (
              <section className="product-grid" aria-label="Ürünler">
                {visibleProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    catalogState={{ category, query, sort }}
                    product={product}
                    reveal
                    revealDelayClass={`reveal-delay-${(index % 4) + 1}`}
                  />
                ))}
              </section>
            ) : (
              <div className="empty-state">
                <div>
                  <Search className="icon" aria-hidden="true" />
                  <p>Bu filtrelerle eşleşen ürün bulunamadı.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="page about-section" id="hakkimizda">
          <div data-reveal="left">
            <p className="section-kicker icon-text">
              <Building2 className="icon" aria-hidden="true" />
              Katalog yaklaşımı
            </p>
            <h2>
              Her ürün sayfası teklif öncesi hızlı değerlendirme için
              hazırlanır.
            </h2>
          </div>
          <div className="about-grid">
            <article data-reveal="up" className="reveal-delay-1">
              <Factory className="icon" aria-hidden="true" />
              <h3>Kurumsal çözüm</h3>
              <p>
                Restoran, otel, kafe, pastane ve üretim mutfakları için ihtiyaca
                uygun ürün grupları sunuyoruz.
              </p>
            </article>
            <article data-reveal="up" className="reveal-delay-2">
              <Wrench className="icon" aria-hidden="true" />
              <h3>Teknik odak</h3>
              <p>
                Kapasite, kullanım yoğunluğu ve alan planına göre ürün seçimi
                konusunda danışmanlık sağlıyoruz.
              </p>
            </article>
            <article data-reveal="up" className="reveal-delay-3">
              <MapPin className="icon" aria-hidden="true" />
              <h3>Türkiye geneli</h3>
              <p>
                Ankara merkezli çalışıyor, ürün talebi ve teklif süreçlerini
                Türkiye genelinde yönetiyoruz.
              </p>
            </article>
          </div>
        </section>
    </main>
  );
}
