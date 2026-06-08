import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";

initializeApp();

const cloudflareAccountId = defineString("CLOUDFLARE_ACCOUNT_ID");
const cloudflareR2BucketName = defineString("CLOUDFLARE_R2_BUCKET_NAME");
const cloudflareR2AccessKeyId = defineSecret("CLOUDFLARE_R2_ACCESS_KEY_ID");
const cloudflareR2SecretAccessKey = defineSecret("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
const cloudflareDeliveryBaseUrl = defineString("CLOUDFLARE_DELIVERY_BASE_URL", {
  default: "",
});
const allowedOrigins = defineString("ALLOWED_ORIGINS", {
  default: "http://127.0.0.1:5173,http://localhost:5173",
});

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileNameLength = 160;
const maxProductIdLength = 120;
const maxDeleteObjectCount = 13;
const uploadUrlExpiresInSeconds = 600;

function getAllowedOrigin(origin?: string) {
  const origins = allowedOrigins
    .value()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!origin) return origins[0] || "";
  if (origins.includes(origin)) return origin;
  return "";
}

function setCorsHeaders(
  request: { get: (header: string) => string | undefined },
  response: { set: (header: string, value: string) => void },
) {
  const origin = getAllowedOrigin(request.get("Origin"));
  if (origin) response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

async function requireAdmin(authorizationHeader?: string) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    throw new Error("Missing Firebase ID token.");
  }

  const decoded = await getAuth().verifyIdToken(token);
  if (decoded.admin !== true) {
    throw new Error("Admin claim is required.");
  }

  return decoded;
}

function getUploadMetadata(body: unknown) {
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() : "";
  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";

  if (!fileName || fileName.length > maxFileNameLength) {
    throw new Error("Invalid file name.");
  }

  if (!allowedImageTypes.has(contentType)) {
    throw new Error("Invalid image type.");
  }

  if (productId.length > maxProductIdLength) {
    throw new Error("Invalid product id.");
  }

  return { fileName, contentType, productId };
}

function getDeleteObjectKeys(body: unknown) {
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const objectKeys = Array.isArray(payload.objectKeys)
    ? payload.objectKeys
        .filter((key): key is string => typeof key === "string")
        .map((key) => key.trim())
        .filter(Boolean)
    : [];
  const uniqueKeys = [...new Set(objectKeys)];

  if (uniqueKeys.length > maxDeleteObjectCount) {
    throw new Error("Too many images requested for deletion.");
  }

  for (const key of uniqueKeys) {
    if (!key.startsWith("products/") || key.includes("..")) {
      throw new Error("Invalid image key.");
    }
  }

  return uniqueKeys;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || fallback;
}

function getFileExtension(fileName: string, contentType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) return extension;
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  return "webp";
}

function createObjectKey(fileName: string, contentType: string, productId: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const productFolder = slugify(productId, "genel");
  const baseName = slugify(fileName.replace(/\.[^.]+$/, ""), "urun-gorseli");
  const extension = getFileExtension(fileName, contentType);

  return `products/${year}/${month}/${productFolder}/${baseName}-${randomUUID()}.${extension}`;
}

function createR2Client(accountId: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export const createCloudflareImageUpload = onRequest(
  {
    region: "europe-west8",
    secrets: [cloudflareR2AccessKeyId, cloudflareR2SecretAccessKey],
  },
  async (request, response) => {
    setCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).send("Method not allowed.");
      return;
    }

    try {
      const adminUser = await requireAdmin(request.get("Authorization"));
      const accountId = cloudflareAccountId.value();
      const bucketName = cloudflareR2BucketName.value();
      const accessKeyId = cloudflareR2AccessKeyId.value();
      const secretAccessKey = cloudflareR2SecretAccessKey.value();
      const requestBody =
        request.body && typeof request.body === "object"
          ? request.body as Record<string, unknown>
          : {};

      if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
        response.status(500).send("Cloudflare configuration is missing.");
        return;
      }

      const r2Client = createR2Client(accountId, accessKeyId, secretAccessKey);
      if (requestBody.action === "delete") {
        const objectKeys = getDeleteObjectKeys(requestBody);
        if (objectKeys.length) {
          await r2Client.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: objectKeys.map((Key) => ({ Key })),
                Quiet: true,
              },
            }),
          );
        }

        response.status(200).json({
          deleted: objectKeys.length,
        });
        return;
      }

      const uploadMetadata = getUploadMetadata(requestBody);
      const objectKey = createObjectKey(
        uploadMetadata.fileName,
        uploadMetadata.contentType,
        uploadMetadata.productId,
      );
      const uploadURL = await getSignedUrl(
        r2Client,
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          ContentType: uploadMetadata.contentType,
          Metadata: {
            fileName: uploadMetadata.fileName,
            productId: uploadMetadata.productId || "genel",
            uploadedBy: adminUser.uid,
          },
        }),
        { expiresIn: uploadUrlExpiresInSeconds },
      );

      const deliveryBaseUrl = cloudflareDeliveryBaseUrl.value().replace(/\/$/, "");
      response.status(200).json({
        id: objectKey,
        method: "PUT",
        contentType: uploadMetadata.contentType,
        uploadURL,
        imageUrl: deliveryBaseUrl ? `${deliveryBaseUrl}/${objectKey}` : "",
      });
    } catch (error) {
      response
        .status(401)
        .send(error instanceof Error ? error.message : "Unauthorized.");
    }
  },
);
