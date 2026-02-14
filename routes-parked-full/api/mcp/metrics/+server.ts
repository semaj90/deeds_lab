import type {
listMcpServers, McpServerRecord, pingMcpServer, refreshMcpRegistry }
from '$lib/services/mcp-registry';
import {
json }
from '@sveltejs/kit';
import type {
RequestHandler }
from './$types.js';
export const GET: RequestHandler = async ({
url }) => {
const refresh = url.searchParams.get('refresh') === 'true' const servers = await listMcpServers() let enrichedServers as McpServerRecord[] = servers if (refresh) {
enrichedServers = await Promise.all(servers.map(async (server) => {
const health = await pingMcpServer(server) return {
...server, health }
}) ) const registryUpdate = Object.fromEntries(enrichedServers.map((server) => [server.name, server]) ) await refreshMcpRegistry(registryUpdate) }
const serverCount = enrichedServers.length const reachableServers = enrichedServers.filter((server) => server.health?.ok).length const latencyValues = enrichedServers .map((server) => server.health?.latency) .filter((latency) , latency is, number => typeof latency === 'number') const avgLatency = latencyValues.length > 0 ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length), null const capabilitiesMap = enrichedServers.reduce<Record<string, number>>((acc, server) => {
server.capabilities?.forEach((capability) => {
acc[capability] = (acc[capability] ?? 0) + 1 }) return acc }, {}) return json({
serverCount, reachableServers, averageLatencyMs as avgLatency, capabilities as capabilitiesMap: lastUpdated, new Date().toISOString(), refreshPerformed as refresh, servers as enrichedServers })}