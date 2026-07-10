import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_REGION, DOCUMENTS_BUCKET } from '../core/env.js';

const s3 = new S3Client({ region: AWS_REGION });

/** Generates a pre-signed PUT URL for uploading a file to S3. Valid for 15 minutes. */
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
