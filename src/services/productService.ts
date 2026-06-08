import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { demoProducts } from "../data/demoProducts";
import { db, isFirebaseConfigured } from "../lib/firebase";
import type { Product, ProductImage, ProductInput } from "../types";

const COLLECTION = "products";
const LOCAL_PRODUCTS_KEY = "hm-cheff-products-v1";
const localListeners = new Set<() => void>();

type SubscribeOptions = {
  publicOnly?: boolean;
};

function readLocalProducts(): Product[] {
  const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(demoProducts));
    return demoProducts;
  }

  try {
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : demoProducts;
  } catch {
    return demoProducts;
  }
}

function writeLocalProducts(products: Product[]) {
  window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  localListeners.forEach((listener) => listener());
}

function normalizeImages(images: ProductImage[] | undefined): ProductImage[] {
  return (images ?? [])
    .filter((image) => typeof image?.url === "string" && image.url.trim())
    .map((image) => {
      const normalizedImage: ProductImage = {
        url: image.url.trim(),
      };
      const alt = image.alt?.trim();
      const cloudflareId = image.cloudflareId?.trim();

      if (alt) normalizedImage.alt = alt;
      if (cloudflareId) normalizedImage.cloudflareId = cloudflareId;

      return normalizedImage;
    });
}

function cleanProductInput(input: ProductInput): ProductInput {
  return {
    ...input,
    title: input.title.trim(),
    category: input.category.trim(),
    currency: input.currency.trim() || "TRY",
    location: input.location.trim(),
    summary: input.summary.trim(),
    description: input.description.trim(),
    contactEmail: input.contactEmail.trim(),
    contactPhone: input.contactPhone.trim(),
    images: normalizeImages(input.images),
    price: Number.isFinite(input.price) ? input.price : null,
  };
}

function dateToIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate().toISOString();
  }

  if (typeof value === "string" && value) return value;

  return new Date().toISOString();
}

function docToProduct(id: string, data: DocumentData): Product {
  return {
    id,
    title: String(data.title ?? ""),
    category: String(data.category ?? ""),
    price:
      typeof data.price === "number" && Number.isFinite(data.price)
        ? data.price
        : null,
    currency: String(data.currency ?? "TRY"),
    condition: data.condition ?? "used",
    location: String(data.location ?? ""),
    summary: String(data.summary ?? ""),
    description: String(data.description ?? ""),
    images: normalizeImages(data.images),
    status: data.status ?? "draft",
    featured: Boolean(data.featured),
    contactEmail: String(data.contactEmail ?? ""),
    contactPhone: String(data.contactPhone ?? ""),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
  };
}

function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function applyLocalFilter(products: Product[], options: SubscribeOptions) {
  const scoped = options.publicOnly
    ? products.filter((product) => product.status === "published")
    : products;
  return sortProducts(scoped);
}

export function subscribeProducts(
  options: SubscribeOptions,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void,
) {
  if (isFirebaseConfigured && db) {
    const productsRef = collection(db, COLLECTION);
    const productsQuery = options.publicOnly
      ? query(productsRef, where("status", "==", "published"))
      : query(productsRef);

    return onSnapshot(
      productsQuery,
      (snapshot) => {
        callback(
          sortProducts(
            snapshot.docs.map((snapshotDoc) =>
              docToProduct(snapshotDoc.id, snapshotDoc.data()),
            ),
          ),
        );
      },
      (error) => onError?.(error),
    );
  }

  const emit = () => callback(applyLocalFilter(readLocalProducts(), options));
  emit();
  localListeners.add(emit);
  return () => {
    localListeners.delete(emit);
  };
}

export async function getProduct(productId: string, options: SubscribeOptions = {}) {
  if (isFirebaseConfigured && db) {
    const snapshot = await getDoc(doc(db, COLLECTION, productId));
    if (!snapshot.exists()) return null;

    const product = docToProduct(snapshot.id, snapshot.data());
    if (options.publicOnly && product.status !== "published") return null;
    return product;
  }

  const product = readLocalProducts().find((item) => item.id === productId) ?? null;
  if (!product) return null;
  if (options.publicOnly && product.status !== "published") return null;
  return product;
}

export async function createProduct(input: ProductInput) {
  const cleanInput = cleanProductInput(input);

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...cleanInput,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  const now = new Date().toISOString();
  const product: Product = {
    ...cleanInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  writeLocalProducts([product, ...readLocalProducts()]);
  return product.id;
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
) {
  const cleanInput = input.images
    ? {
        ...input,
        images: normalizeImages(input.images),
      }
    : input;

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, productId), {
      ...cleanInput,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const now = new Date().toISOString();
  writeLocalProducts(
    readLocalProducts().map((product) =>
      product.id === productId
        ? {
            ...product,
            ...cleanInput,
            images: cleanInput.images ? normalizeImages(cleanInput.images) : product.images,
            updatedAt: now,
          }
        : product,
    ),
  );
}

export async function deleteProduct(productId: string) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTION, productId));
    return;
  }

  writeLocalProducts(
    readLocalProducts().filter((product) => product.id !== productId),
  );
}
