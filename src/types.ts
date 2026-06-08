export type ProductStatus = "published" | "hidden" | "draft";

export type ProductCondition = "new" | "used" | "refurbished" | "other";

export type ProductImage = {
  url: string;
  alt?: string;
  cloudflareId?: string;
};

export type Product = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  currency: string;
  condition: ProductCondition;
  location: string;
  summary: string;
  description: string;
  images: ProductImage[];
  status: ProductStatus;
  featured: boolean;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export type AdminUser = {
  uid: string;
  email: string | null;
  isDemo: boolean;
};
