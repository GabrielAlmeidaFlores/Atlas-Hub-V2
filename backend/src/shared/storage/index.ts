import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_REGION, DOCUMENTS_BUCKET } from '../core/env.js';

const s3 = new S3Client({ region: AWS_REGION });

export async function generatePresignedUrl(
  key: string,
  mimeType: string,
): Promise<{ url: string; location: string }> {
  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  const location = `https://${DOCUMENTS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return { url, location };
}

export async function generatePresignedGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

export function extractKeyFromLocation(location: string): string | null {
  const prefix = `https://${DOCUMENTS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`;
  if (!location.startsWith(prefix)) return null;
  const key = location.slice(prefix.length);
  return key.length > 0 ? decodeURIComponent(key) : null;
}
