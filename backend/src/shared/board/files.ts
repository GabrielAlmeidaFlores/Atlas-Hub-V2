import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { AWS_REGION, DOCUMENTS_BUCKET } from '../core/env.js';
import { ValidationError } from '../http/validators.js';
import type { BoardFile } from './types.js';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const s3 = new S3Client({ region: AWS_REGION });

function safeName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'arquivo';
}

export async function presignBoardFileUpload(
  boardId: string,
  userId: string,
  input: { readonly fileName: string; readonly contentType: string; readonly size: number },
): Promise<{ readonly uploadUrl: string; readonly file: BoardFile }> {
  if (input.size > MAX_FILE_BYTES) {
    throw new ValidationError([{ field: 'fileName', message: 'Arquivo maior que 25 MB' }]);
  }
  const key = `boards/${boardId}/${uuidv4()}-${safeName(input.fileName)}`;
  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
    ContentType: input.contentType,
    Metadata: { uploadedBy: userId },
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return {
    uploadUrl,
    file: { key, name: input.fileName, size: input.size, contentType: input.contentType },
  };
}

export async function presignBoardFileDownload(key: string): Promise<string> {
  if (!key.startsWith('boards/')) {
    throw new ValidationError([{ field: 'key', message: 'Arquivo inválido' }]);
  }
  const command = new GetObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}
