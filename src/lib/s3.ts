import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env, isConfigured } from "./env";

/**
 * AWS S3 document storage. Objects are private; access is only ever granted via
 * short-lived presigned URLs so report links can't be shared/leaked permanently.
 */

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: env.s3.region,
      credentials: { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey },
    });
  }
  return _client;
}

/** Deterministic, namespaced key so a patient's docs are grouped & access-checkable. */
export function buildRecordKey(patientId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `patients/${patientId}/records/${randomUUID()}-${safe}`;
}

/** Presigned PUT for direct browser → S3 upload (keeps large files off our server). */
export async function presignUpload(key: string, contentType: string, maxBytes = 25 * 1024 * 1024) {
  if (!isConfigured.s3) throw new Error("S3 is not configured.");
  const command = new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256", // encryption at rest
    ContentLength: undefined,
  });
  const url = await getSignedUrl(client(), command, { expiresIn: 300 });
  return { url, key, maxBytes };
}

/** Presigned GET for downloading/viewing a record (valid 5 minutes). */
export async function presignDownload(key: string): Promise<string> {
  if (!isConfigured.s3) throw new Error("S3 is not configured.");
  const command = new GetObjectCommand({ Bucket: env.s3.bucket, Key: key });
  return getSignedUrl(client(), command, { expiresIn: 300 });
}

export async function deleteObject(key: string): Promise<void> {
  if (!isConfigured.s3) return;
  await client().send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
}
