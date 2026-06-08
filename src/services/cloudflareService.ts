import { getCurrentAdminToken } from "./authService";
import type { ProductImage } from "../types";

export const MAX_PRODUCT_IMAGES = 13;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;
const IMAGE_QUALITY = 0.82;
const OUTPUT_TYPE = "image/webp";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadResponse = {
  id: string;
  method?: "POST" | "PUT";
  contentType?: string;
  uploadURL: string;
  imageUrl?: string;
};

type DeleteResponse = {
  deleted: number;
};

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getOutputFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName || "product-image"}.webp`;
}

function getUploadEndpoint() {
  const endpoint = import.meta.env.VITE_CLOUDFLARE_UPLOAD_FUNCTION_URL;
  if (!endpoint) {
    throw new Error("Set VITE_CLOUDFLARE_UPLOAD_FUNCTION_URL before uploading.");
  }

  return endpoint;
}

function getR2ObjectKey(image: ProductImage) {
  if (image.cloudflareId?.startsWith("products/")) return image.cloudflareId;

  const deliveryBase = import.meta.env.VITE_CLOUDFLARE_DELIVERY_BASE_URL;
  if (!deliveryBase || !image.url.startsWith(deliveryBase.replace(/\/$/, ""))) {
    return "";
  }

  try {
    const deliveryBaseUrl = new URL(deliveryBase);
    const imageUrl = new URL(image.url);
    if (deliveryBaseUrl.origin !== imageUrl.origin) return "";
    return decodeURIComponent(imageUrl.pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel okunamadı. Lütfen farklı bir dosya deneyin."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Görsel sıkıştırılamadı. Lütfen farklı bir dosya deneyin."));
      },
      OUTPUT_TYPE,
      IMAGE_QUALITY,
    );
  });
}

export async function prepareImageForUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Sadece JPEG, PNG veya WebP görsel yükleyebilirsiniz.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Görsel işleme başlatılamadı.");
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas);
  const shouldUseProcessedImage =
    scale < 1 || file.type !== OUTPUT_TYPE || blob.size < file.size;
  const processedFile = shouldUseProcessedImage
    ? new File([blob], getOutputFileName(file.name), {
        type: OUTPUT_TYPE,
        lastModified: Date.now(),
      })
    : file;

  if (processedFile.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(
      `Görsel ${formatMegabytes(processedFile.size)}. Yükleme sınırı ${formatMegabytes(
        MAX_IMAGE_UPLOAD_BYTES,
      )}.`,
    );
  }

  return processedFile;
}

export async function uploadImageToCloudflare(file: File, productId?: string) {
  const preparedFile = await prepareImageForUpload(file);
  const endpoint = getUploadEndpoint();

  const token = await getCurrentAdminToken();
  if (!token) {
    throw new Error("Firebase admin authentication is required for uploads.");
  }

  const createUploadResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: preparedFile.name,
      contentType: preparedFile.type,
      productId,
    }),
  });

  if (!createUploadResponse.ok) {
    throw new Error(await createUploadResponse.text());
  }

  const upload = (await createUploadResponse.json()) as UploadResponse;
  const imageUploadResponse =
    upload.method === "PUT"
      ? await fetch(upload.uploadURL, {
          method: "PUT",
          headers: {
            "Content-Type": upload.contentType || preparedFile.type,
          },
          body: preparedFile,
        })
      : await fetch(upload.uploadURL, {
          method: "POST",
          body: (() => {
            const uploadForm = new FormData();
            uploadForm.append("file", preparedFile);
            return uploadForm;
          })(),
        });

  if (!imageUploadResponse.ok) {
    throw new Error(await imageUploadResponse.text());
  }

  const deliveryBase = import.meta.env.VITE_CLOUDFLARE_DELIVERY_BASE_URL;
  const imageUrl =
    upload.imageUrl ||
    (deliveryBase ? `${deliveryBase.replace(/\/$/, "")}/${upload.id}` : "");

  if (!imageUrl) {
    throw new Error("Cloudflare upload succeeded, but no delivery URL is set.");
  }

  return {
    url: imageUrl,
    cloudflareId: upload.id,
  };
}

export async function deleteImagesFromCloudflare(images: ProductImage[]) {
  const objectKeys = [
    ...new Set(images.map(getR2ObjectKey).filter((key) => key.startsWith("products/"))),
  ];

  if (!objectKeys.length) return { deleted: 0 };

  const endpoint = getUploadEndpoint();
  const token = await getCurrentAdminToken();
  if (!token) {
    throw new Error("Firebase admin authentication is required for image deletion.");
  }

  const deleteResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "delete",
      objectKeys,
    }),
  });

  if (!deleteResponse.ok) {
    throw new Error(await deleteResponse.text());
  }

  return (await deleteResponse.json()) as DeleteResponse;
}
