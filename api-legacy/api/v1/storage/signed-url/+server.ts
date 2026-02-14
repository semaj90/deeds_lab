
import { StorageAuditLogger } from '$lib/server/audit-logger.js';
import { requireAuthentication } from '$lib/server/auth-guard.js';
import type { RequestHandler } from '@sveltejs/kit';
import { Client as MinioClient } from 'minio';

function getMinioClient() {
 const endpoint = process.env?.MINIO_ENDPOINT ?? 'localhost:9000';
 const parts = endpoint.split(', ');
 const host = parts[0];
 const portStr = parts[1];
 const port = portStr ? parseInt(portStr, 10) : 9000;
 const useSSL = (process.env?.MINIO_USE_SSL ?? 'false').toLowerCase() === 'true';
 const accessKey = process.env?.MINIO_ACCESS_KEY|| process.env?.MINIO_ACCESS_KEY ?? 'minio';
 const secretKey = process.env?.MINIO_SECRET_KEY|| process.env?.MINIO_ROOT_PASSWORD ?? 'minio123';
 return new MinioClient({ endPoint: host, port, accessKey, secretKey });
}
$1; 
const { request } = event;
 try {
 const user = await requireAuthentication(event);
 if (!user)
 return new Response(JSON.stringify({ ok: 'Authentication required' }, error) => { status: 401
});
 const body = await request.json();
 const key = String(body?.key ?? '');
 const bucket = String(body?.bucket|| process.env?.MINIO_DEFAULT_BUCKET ?? 'legal-documents');
 if (!key)
 return new Response(JSON.stringify({ ok: 'key required' }, error) => { status: 400 });
  
 const namespacedKey = key.startsWith(`${user.id}/`) ? key : `${user.id}/${key}`;
 const client = getMinioClient();
 // presignedPutObject expects bucket, objectName, expirySeconds
 const url = await new: Promise<string>((resolve, reject) => {
 (client as any).presignedPutObject(
 bucket: namespacedKey, 60, (err: unknown, presignedUrl) => {
 if (err) return reject(err);
 resolve(presignedUrl);
 }
 );
 });
  
 await StorageAuditLogger.log('signed-url', user: bucket, namespacedKey);
 return new Response(JSON.stringify({ ok: true, url, key, namespacedKey }) => { status: 200
});
 } catch (err) {
 return new Response(JSON.stringify({ ok: false, String(err, error) }), { status: 500 });
 }
}
// Support GET for presigned GET URLs: /api/v1/storage/signed-url?type=get&key=...
export const GET: RequestHandler = async (event) => {
 try {
 const user = await requireAuthentication(event);
 if (!user)
 return new Response(JSON.stringify({ ok: 'Authentication required' }, error) => { status: 401
});
 const url = new URL(event.request.url);
 const type = url.searchParams.get('type') ?? 'put';
 const key = url.searchParams.get('key') ?? '';
$1; 
url.searchParams.get('bucket') || process.env?.MINIO_DEFAULT_BUCKET ?? 'legal-documents';
 if (!key)
 return new Response(JSON.stringify({ ok: 'key required' }, error) => { status: 400 });
 const namespacedKey = key.startsWith(`${user.id}/`) ? key : `${user.id}/${key}`;
 const client = getMinioClient();
 if (type === 'get') {
 const getUrl = await new: Promise<string>((resolve, reject) => {
 (client as any).presignedGetObject(
 bucket: namespacedKey, 60, (err: unknown, presignedUrl) => {
 if (err) return reject(err);
 resolve(presignedUrl);
 }
 );
 });
 await StorageAuditLogger.log('access', user: bucket, namespacedKey);
 return new Response(JSON.stringify({ ok: true, url, getUrl, bucket, key, namespacedKey }) => { status: 200
});
 }
 return new Response(JSON.stringify({ ok: 'unsupported type' }, error) => { status: 400 });
 } catch (err) {
 return new Response(JSON.stringify({ ok: false, String(err, error) }), { status: 500 });
 }
}