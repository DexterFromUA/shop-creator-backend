import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  // forcePathStyle делает ссылки вида http://localhost:9000/shop/...
  // Для настоящего AWS S3 в будущем его нужно будет убрать или поставить false
  forcePathStyle: true, 
});

/**
 * Генерирует ссылку с учетом ID магазина
 * @param {string} storeId 
 * @param {string} fileName
 * @param {string} fileType
 */
export async function generatePresignedUrl(storeId, fileName, fileType) {
  const uniqueKey = `stores/${storeId}/products/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,  
    fileKey: uniqueKey,
  };
}
