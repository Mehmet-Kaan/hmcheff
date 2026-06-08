import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice } from "../lib/formatters";
import { isFirebaseConfigured } from "../lib/firebase";
import {
  signInAdmin,
  signOutAdmin,
  subscribeAdminSession,
  type AdminSession,
} from "../services/authService";
import {
  deleteImagesFromCloudflare,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_PRODUCT_IMAGES,
  uploadImageToCloudflare,
} from "../services/cloudflareService";
import {
  createProduct,
  deleteProduct,
  subscribeProducts,
  updateProduct,
} from "../services/productService";
import type {
  Product,
  ProductCondition,
  ProductInput,
  ProductStatus,
} from "../types";

type ProductDraft = {
  title: string;
  category: string;
  price: string;
  currency: string;
  condition: ProductCondition;
  location: string;
  summary: string;
  description: string;
  imageUrls: string;
  status: ProductStatus;
  featured: boolean;
  contactEmail: string;
  contactPhone: string;
};

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23eef3f2'/%3E%3Cpath d='M54 212 112 139l46 52 28-32 62 77H54Z' fill='%23cad8d4'/%3E%3C/svg%3E";
const defaultProductLocation = "Altındağ / Ankara";

const emptyDraft: ProductDraft = {
  title: "",
  category: "",
  price: "",
  currency: "TRY",
  condition: "used",
  location: defaultProductLocation,
  summary: "",
  description: "",
  imageUrls: "",
  status: "published",
  featured: false,
  contactEmail: "info@hmcheff.com",
  contactPhone: "+905379874160",
};

const statusLabels: Record<ProductStatus | "all", string> = {
  all: "Tümü",
  published: "Yayında",
  hidden: "Gizli",
  draft: "Taslak",
};

const conditionLabels: Record<ProductCondition, string> = {
  new: "Sıfır",
  used: "2. El",
  refurbished: "Yenilenmiş",
  other: "Diğer",
};

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function normalizeCategoryKey(category: string) {
  return category.trim().toLocaleLowerCase("tr-TR");
}

function chooseCategoryLabel(currentLabel: string, nextLabel: string) {
  const currentStartsUpper = /^[A-ZÇĞİÖŞÜ]/.test(currentLabel);
  const nextStartsUpper = /^[A-ZÇĞİÖŞÜ]/.test(nextLabel);
  return !currentStartsUpper && nextStartsUpper ? nextLabel : currentLabel;
}

function resolveCategoryLabel(category: string, availableCategories: string[]) {
  const trimmedCategory = category.trim();
  if (!trimmedCategory) return "";

  const categoryKey = normalizeCategoryKey(trimmedCategory);
  return (
    availableCategories.find(
      (availableCategory) =>
        normalizeCategoryKey(availableCategory) === categoryKey,
    ) || trimmedCategory
  );
}

function toDraft(product: Product): ProductDraft {
  return {
    title: product.title,
    category: product.category,
    price: product.price === null ? "" : String(product.price),
    currency: product.currency,
    condition: product.condition,
    location: product.location,
    summary: product.summary,
    description: product.description,
    imageUrls: product.images.map((image) => image.url).join("\n"),
    status: product.status,
    featured: product.featured,
    contactEmail: product.contactEmail,
    contactPhone: product.contactPhone,
  };
}

function draftToInput(draft: ProductDraft): ProductInput {
  const numericPrice = draft.price.replace(/\D/g, "");
  const imageUrls = draft.imageUrls
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

  return {
    title: draft.title,
    category: draft.category,
    price: numericPrice ? Number(numericPrice) : null,
    currency: draft.currency || "TRY",
    condition: draft.condition,
    location: draft.location,
    summary: draft.summary,
    description: draft.description,
    images: imageUrls.map((url) => ({ url, alt: draft.title })),
    status: draft.status,
    featured: draft.featured,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
  };
}

function AdminLoadingState({
  compact = false,
  description,
  title,
}: {
  compact?: boolean;
  description: string;
  title: string;
}) {
  return (
    <div
      className={`loading-state detail-loading-state admin-loading-state ${
        compact ? "compact" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="detail-loader" aria-hidden="true">
        <span className="detail-loader-ring" />
        <span className="detail-loader-logo">
          <img src="/hm-cheff-favicon.jpg" alt="" />
        </span>
      </div>
      <div className="detail-loading-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {!compact && (
        <div className="detail-loading-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

export function AdminPanel() {
  const [session, setSession] = useState<AdminSession>({
    status: "loading",
    user: null,
  });

  useEffect(() => subscribeAdminSession(setSession), []);

  if (session.status === "loading") {
    return (
      <AdminLoadingState
        title="Yönetim paneli hazırlanıyor"
        description="Oturum ve yetki bilgileri kontrol ediliyor..."
      />
    );
  }

  if (session.status === "signed-out") {
    return <AdminLogin message={session.message} />;
  }

  return <AdminWorkspace session={session} />;
}

function AdminLogin({ message }: { message?: string }) {
  const [email, setEmail] = useState("admin@hmcheff.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await signInAdmin(email, password);
      window.location.reload();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Giriş başarısız.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-art">
        <Link className="brand" to="/">
          <span className="brand-logo" aria-hidden="true">
            <img src="/hm-cheff-favicon.jpg" alt="" />
          </span>
          <span>
            HM Cheff
            <small>Yönetim</small>
          </span>
        </Link>
        <h1>
          Ürünleri, görünürlüğü, iletişim bilgilerini ve görselleri yönetin.
        </h1>
      </section>
      <section className="auth-card">
        <div>
          <h2>Yönetici girişi</h2>
          <p>{isFirebaseConfigured ? "Firebase Auth" : "Demo modu"}</p>
        </div>
        {error && <div className="notice error">{error}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="admin-email">E-posta</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Şifre</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required={isFirebaseConfigured}
            />
          </div>
          <button
            className="button primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
          <Link className="button ghost" to="/urunler">
            Kataloğa dön
          </Link>
        </form>
      </section>
    </main>
  );
}

function AdminWorkspace({
  session,
}: {
  session: Extract<AdminSession, { status: "signed-in" }>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<ProductStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [message, setMessage] = useState(session.message || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      { publicOnly: false },
      (nextProducts) => {
        setProducts(nextProducts);
        setIsProductsLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setIsProductsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isEditorOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditorOpen]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      published: products.filter((product) => product.status === "published")
        .length,
      hidden: products.filter((product) => product.status === "hidden").length,
      drafts: products.filter((product) => product.status === "draft").length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const statusMatch = filter === "all" || product.status === filter;
      const text = [
        product.title,
        product.category,
        product.location,
        product.summary,
      ]
        .join(" ")
        .toLowerCase();
      return (
        statusMatch && (!normalizedQuery || text.includes(normalizedQuery))
      );
    });
  }, [filter, products, query]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, string>();

    products.forEach((product) => {
      const trimmedCategory = product.category.trim();
      if (!trimmedCategory) return;

      const categoryKey = normalizeCategoryKey(trimmedCategory);
      const currentLabel = categoryMap.get(categoryKey);
      categoryMap.set(
        categoryKey,
        currentLabel
          ? chooseCategoryLabel(currentLabel, trimmedCategory)
          : trimmedCategory,
      );
    });

    return [...categoryMap.values()].sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const previewUrls = useMemo(
    () =>
      draft.imageUrls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean)
        .slice(0, 4),
    [draft.imageUrls],
  );

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  function openNewProductEditor() {
    resetForm();
    setIsEditorOpen(true);
  }

  function editProduct(product: Product) {
    setDraft(toDraft(product));
    setEditingId(product.id);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const input = draftToInput({
        ...draft,
        category: resolveCategoryLabel(draft.category, availableCategories),
      });
      if (!input.title.trim()) throw new Error("Ürün başlığı zorunludur.");
      if (editingId) {
        await updateProduct(editingId, input);
        setMessage("Ürün güncellendi.");
      } else {
        await createProduct(input);
        setMessage("Ürün oluşturuldu.");
      }
      resetForm();
      closeEditor();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Kaydetme başarısız.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(product: Product, status: ProductStatus) {
    await updateProduct(product.id, { status });
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `"${product.title}" kalıcı olarak silinsin mi? Bu ürüne bağlı R2 görselleri de kaldırılır.`,
    );
    if (!confirmed) return;
    setError("");
    setMessage("");

    try {
      await deleteImagesFromCloudflare(product.images);
      await deleteProduct(product.id);
      setMessage("Ürün ve bağlı görseller silindi.");
      if (editingId === product.id) {
        resetForm();
        closeEditor();
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Ürün silinemedi.",
      );
    }
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    const existingImageCount = draft.imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean).length;
    const remainingSlots = MAX_PRODUCT_IMAGES - existingImageCount;

    if (remainingSlots <= 0) {
      setError(`Bir ürüne en fazla ${MAX_PRODUCT_IMAGES} görsel eklenebilir.`);
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setError(
        `Bu ürün için ${remainingSlots} görsel daha ekleyebilirsiniz. En fazla ${MAX_PRODUCT_IMAGES} görsel desteklenir.`,
      );
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const uploaded = [];
      for (const file of selectedFiles) {
        uploaded.push(
          await uploadImageToCloudflare(file, editingId ?? undefined),
        );
      }
      const nextUrls = [
        draft.imageUrls.trim(),
        ...uploaded.map((image) => image.url),
      ]
        .filter(Boolean)
        .join("\n");
      setDraft((current) => ({ ...current, imageUrls: nextUrls }));
      setMessage("Görsel yüklendi.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Yükleme başarısız.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/">
          <span className="brand-logo" aria-hidden="true">
            <img src="/hm-cheff-favicon.jpg" alt="" />
          </span>
          <span>
            HM Cheff
            <small>{session.user.email}</small>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Admin filters">
          {(["all", "published", "hidden", "draft"] as const).map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item === "all" && (
                <LayoutDashboard className="icon" aria-hidden="true" />
              )}
              {item === "published" && (
                <Eye className="icon" aria-hidden="true" />
              )}
              {item === "hidden" && (
                <EyeOff className="icon" aria-hidden="true" />
              )}
              {item === "draft" && (
                <ListFilter className="icon" aria-hidden="true" />
              )}
              {statusLabels[item]}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link className="button" to="/urunler">
            Katalog
          </Link>
          <button
            className="button"
            type="button"
            onClick={async () => {
              await signOutAdmin();
              window.location.reload();
            }}
          >
            <LogOut className="icon" aria-hidden="true" />
            Çıkış yap
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <section className="admin-heading">
          <div>
            <h1>Ürün yönetimi</h1>
            <p>Web sitesinde görünen ürün kataloğunu buradan yönetin.</p>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={openNewProductEditor}
          >
            <Plus className="icon" aria-hidden="true" />
            Yeni ürün
          </button>
        </section>

        <section className="stats-grid" aria-label="Ürün durum özeti">
          <div className="stat-card">
            <strong>{stats.total}</strong>
            <span>
              <LayoutDashboard className="icon" aria-hidden="true" />
              Toplam
            </span>
          </div>
          <div className="stat-card">
            <strong>{stats.published}</strong>
            <span>
              <Eye className="icon" aria-hidden="true" />
              Yayında
            </span>
          </div>
          <div className="stat-card">
            <strong>{stats.hidden}</strong>
            <span>
              <EyeOff className="icon" aria-hidden="true" />
              Gizli
            </span>
          </div>
          <div className="stat-card">
            <strong>{stats.drafts}</strong>
            <span>
              <ListFilter className="icon" aria-hidden="true" />
              Taslak
            </span>
          </div>
        </section>

        {(message || error) && (
          <div className={`notice ${error ? "error" : ""}`}>
            {error || message}
          </div>
        )}

        <section className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>
                  <LayoutDashboard className="icon" aria-hidden="true" />
                  Ürünler
                </h2>
                <p>{filteredProducts.length} ürün gösteriliyor</p>
              </div>
            </div>

            <div className="admin-toolbar">
              <div className="field">
                <label htmlFor="admin-search">Arama</label>
                <input
                  id="admin-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Başlık, kategori, şehir"
                />
              </div>
              <div className="field">
                <label htmlFor="admin-filter">Durum</label>
                <select
                  id="admin-filter"
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as ProductStatus | "all")
                  }
                >
                  {(["all", "published", "hidden", "draft"] as const).map(
                    (item) => (
                      <option key={item} value={item}>
                        {statusLabels[item]}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="product-list">
              {isProductsLoading ? (
                <AdminLoadingState
                  title="Ürünler yükleniyor"
                  description="Katalog kayıtları Firestore üzerinden alınıyor..."
                />
              ) : filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <article className="admin-product-row" key={product.id}>
                    <div className="admin-thumb">
                      <img
                        src={product.images[0]?.url || fallbackImage}
                        alt={product.images[0]?.alt || product.title}
                      />
                    </div>
                    <div className="row-title">
                      <h3>{product.title}</h3>
                      <p>
                        {formatPrice(product.price, product.currency)} ·{" "}
                        {product.category || "Ürün"} ·{" "}
                        {product.location || "Türkiye"}
                      </p>
                      <div className="row-pills">
                        <span
                          className={`pill light ${
                            product.status === "published" ? "green" : ""
                          } ${product.status === "hidden" ? "amber" : ""}`}
                        >
                          {statusLabels[product.status]}
                        </span>
                        <span className="pill light">
                          {conditionLabels[product.condition]}
                        </span>
                        {product.featured && (
                          <span className="pill blue">vitrinde</span>
                        )}
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        type="button"
                        title="Düzenle"
                        onClick={() => editProduct(product)}
                      >
                        <Pencil className="icon" aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Yayınla"
                        onClick={() => handleStatusChange(product, "published")}
                      >
                        <Eye className="icon" aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Gizle"
                        onClick={() => handleStatusChange(product, "hidden")}
                      >
                        <EyeOff className="icon" aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Sil"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="icon" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <p>Bu görünümde ürün yok.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isEditorOpen && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={closeEditor}
        >
          <section
            className="admin-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-editor-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="product-editor-title">
                  {editingId ? (
                    <Pencil className="icon" aria-hidden="true" />
                  ) : (
                    <Plus className="icon" aria-hidden="true" />
                  )}
                  {editingId ? "Ürünü düzenle" : "Yeni ürün"}
                </h2>
                <p>
                  {editingId
                    ? "İlan detaylarını güncelle"
                    : "Yeni ilan oluştur"}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Kapat"
                onClick={closeEditor}
              >
                <X className="icon" aria-hidden="true" />
              </button>
            </div>

            <form
              className="form-grid admin-editor-form"
              onSubmit={handleSubmit}
            >
              <div className="field">
                <label htmlFor="title">Başlık</label>
                <input
                  id="title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="two-col">
                <div className="field">
                  <label htmlFor="category">Kategori</label>
                  <input
                    id="category"
                    list="category-options"
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    onBlur={() =>
                      setDraft((current) => ({
                        ...current,
                        category: resolveCategoryLabel(
                          current.category,
                          availableCategories,
                        ),
                      }))
                    }
                    placeholder="Mevcut kategori seçin veya yeni kategori yazın"
                  />
                  <datalist id="category-options">
                    {availableCategories.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption} />
                    ))}
                  </datalist>
                </div>
                <div className="field">
                  <label htmlFor="location">Konum</label>
                  <input
                    id="location"
                    value={draft.location}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="two-col">
                <div className="field">
                  <label htmlFor="price">Fiyat</label>
                  <input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        price: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="currency">Para birimi</label>
                  <input
                    id="currency"
                    value={draft.currency}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="two-col">
                <div className="field">
                  <label htmlFor="condition">Kondisyon</label>
                  <select
                    id="condition"
                    value={draft.condition}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        condition: event.target.value as ProductCondition,
                      }))
                    }
                  >
                    <option value="new">Sıfır</option>
                    <option value="used">2. El</option>
                    <option value="refurbished">Yenilenmiş</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="status">Durum</label>
                  <select
                    id="status"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value as ProductStatus,
                      }))
                    }
                  >
                    <option value="published">Yayında</option>
                    <option value="hidden">Gizli</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>
              </div>

              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                />
                <Star className="icon" aria-hidden="true" />
                Vitrinde göster
              </label>

              <div className="field">
                <label htmlFor="summary">Kısa açıklama</label>
                <textarea
                  id="summary"
                  value={draft.summary}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="description">Açıklama</label>
                <textarea
                  id="description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="two-col">
                <div className="field">
                  <label htmlFor="contact-email">İletişim e-postası</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={draft.contactEmail}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contactEmail: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="contact-phone">İletişim telefonu</label>
                  <input
                    id="contact-phone"
                    value={draft.contactPhone}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contactPhone: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="image-urls">Görsel URL'leri</label>
                <textarea
                  id="image-urls"
                  value={draft.imageUrls}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      imageUrls: event.target.value,
                    }))
                  }
                  placeholder="https://imagedelivery.net/.../public"
                />
              </div>

              <div className="field">
                <label htmlFor="cloudflare-files">Görsel yükle</label>
                <input
                  id="cloudflare-files"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => handleImageFiles(event.target.files)}
                  disabled={isUploading}
                />
                <small>
                  En fazla {MAX_PRODUCT_IMAGES} görsel. JPEG, PNG veya WebP
                  dosyaları yüklenir; görseller{" "}
                  {formatMegabytes(MAX_IMAGE_UPLOAD_BYTES)} altında olacak
                  şekilde sıkıştırılır.
                </small>
              </div>

              {previewUrls.length > 0 && (
                <div className="image-preview-strip">
                  {previewUrls.map((url) => (
                    <img key={url} src={url} alt="" />
                  ))}
                </div>
              )}

              <div className="form-actions admin-modal-actions">
                <button
                  className="button primary"
                  type="submit"
                  disabled={isSaving}
                >
                  <Save className="icon" aria-hidden="true" />
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button className="button" type="button" onClick={resetForm}>
                  <Plus className="icon" aria-hidden="true" />
                  Temizle
                </button>
                {isUploading && (
                  <AdminLoadingState
                    compact
                    title="Görsel yükleniyor"
                    description="Görsel yükleme işlemi sürüyor..."
                  />
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
