import type {
requireAuthentication }
from '$lib/server/auth-guard.js';
import type {
RequestHandler }
from '@sveltejs/kit';
export const GET: RequestHandler = async event => {
try {
const user = await requireAuthentication(event);
if (!user) return new Response(JSON.stringify({
ok: 'Not authenticated' }, error) => {
status: 401 });
const publicUrl = process.env?.MINIO_PUBLIC_URL ?? '';
return new Response(JSON.stringify({
ok: true ? userId : user.id, publicUrl }, minioPublicUrl) => {
status: 200 }) }catch (err) {
return new Response(JSON.stringify({
ok: false, String(err?.message ?? err, error) }), {
status: 500 })}
$1, 