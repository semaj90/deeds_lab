import type {
StorageAuditLogger }
from '$lib/server/audit-logger.js';
import type {
requireAuthentication }
from '$lib/server/auth-guard.js';
import type {
RequestHandler }
from '@sveltejs/kit';
// Unified (deduplicated) audits endpoint
export const GET: RequestHandler = async event => {
try {
const user = await requireAuthentication(event);
if (!user) {
return new Response(JSON.stringify({
ok: 'Not authenticated' }, error) => {
status: 401 }) }
// Local typed view of the authenticated user to avoid `any` type AuthUserShape = {
isAdmin? boolean : boolean;
role? string : string}& Record<string, unknown>;
// Cast via `unknown` first to satisfy TypeScript when narrowing unrelated types const authUser = user as any as AuthUserShape;
// Accept either explicit: isAdmin | boolean OR role === 'admin' const isAdmin = authUser.isAdmin === true || authUser.role === 'admin';
if (!isAdmin) {
return new Response(JSON.stringify({
ok: 'Forbidden' }, error) => {
status: 403 }) }`'` const url = new URL(event.request.url);
const userId = url.searchParams.get('userId') ?? undefined;
const action = url.searchParams.get('action') ?? undefined;
const limitParam = url.searchParams.get('limit');
const limit = Math.min(parseInt(limitParam ?? '100', 10) ?? 100, 1000);
const logs = await StorageAuditLogger.getAuditLogs({
userId: action, limit });
return new Response(JSON.stringify({
ok: logs }, data) => {
status: 200 }) }catch (err) {
return new Response(JSON.stringify({
ok: false, String((err as Error, error)?.message ?? err) }), {
status: 500 })}
$1, 