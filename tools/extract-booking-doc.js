/**
 * tools/extract-booking-doc.js
 * Usage:
 *   node tools/extract-booking-doc.js http://localhost/alojar/public/api/documentation e:/workspace/alojar_mcp/server/docs/booking.md
 *
 * If only the URL is provided, output defaults to:
 *   e:/workspace/alojar_mcp/server/docs/booking.md
 */

const fs = require('fs').promises;
const path = require('path');

async function getFetch() {
    // Node 18+ tiene fetch global; si no, intenta node-fetch
    if (typeof fetch !== 'undefined') return fetch;
    try {
        const nodeFetch = require('node-fetch');
        return nodeFetch;
    } catch (e) {
        throw new Error('Node >=18 o instalar node-fetch (npm i node-fetch) es requerido para ejecutar este script.');
    }
}

async function tryFetchJson(baseUrl) {
    const fetch = await getFetch();
    const tryUrls = [
        baseUrl
    ];

    let lastErr;
    for (const url of tryUrls) {
        try {
            const res = await fetch(url, { headers: { Accept: 'application/json' }, redirect: 'follow' });
            const ct = res.headers && res.headers.get ? res.headers.get('content-type') || '' : '';
            const txt = await res.text();
            // Si ya vino JSON
            if (ct.includes('application/json')) {
                try { return JSON.parse(txt); } catch (e) { /* continue */ }
            }
            // Si el body parece JSON
            const trimmed = txt.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try { return JSON.parse(trimmed); } catch (e) { /* continue */ }
            }
            // Si es HTML, intenta detectar rutas embeded (swagger-ui)
            const matches = txt.match(/(\/[^"'>\s]+?(swagger|openapi|v2\/api-docs)[^"'>\s]*)/ig);
            if (matches && matches.length) {
                for (const m of matches) {
                    const candidate = m.startsWith('http') ? m : new URL(m, url).toString();
                    try {
                        const r2 = await fetch(candidate, { headers: { Accept: 'application/json' } });
                        const ct2 = r2.headers && r2.headers.get ? r2.headers.get('content-type') || '' : '';
                        const t2 = await r2.text();
                        if (ct2.includes('application/json') || t2.trim().startsWith('{')) {
                            return JSON.parse(t2);
                        }
                    } catch (e) { /* ignore */ }
                }
            }
            lastErr = new Error(`No JSON en ${url}`);
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error('No se pudo obtener JSON OpenAPI desde las rutas probadas.');
}

function renderSchema(schema) {
    if (!schema) return '';
    try { return '```json\n' + JSON.stringify(schema, null, 2) + '\n```\n'; } catch { return ''; }
}

function paramToMd(p) {
    const typ = (p.schema && p.schema.type) || p.type || (p.content && Object.keys(p.content || {})[0]) || 'object';
    let line = `- **${p.name}** (${p.in})${p.required ? ' **required**' : ''} — ${typ}`;
    if (p.description) line += `\n  - ${p.description}`;
    if (p.schema && p.schema.enum) line += `\n  - enum: ${p.schema.enum.join(', ')}`;
    return line;
}

function ensureText(v) {
    return v === undefined || v === null ? '' : String(v);
}

function renderOperation(op, method, path) {
    let md = `### ${method.toUpperCase()} \`${path}\`\n\n`;
    if (op.summary) md += `**Resumen:** ${op.summary}\n\n`;
    if (op.description) md += `**Descripción:**\n\n${op.description}\n\n`;
    if (op.tags) md += `**Tags:** ${op.tags.join(', ')}\n\n`;
    // Parameters
    const params = op.parameters || [];
    if (params.length) {
        md += `**Parámetros:**\n\n`;
        md += params.map(paramToMd).join('\n') + '\n\n';
    }
    // requestBody
    if (op.requestBody) {
        md += `**Request Body:**\n\n`;
        const content = op.requestBody.content || {};
        for (const [ct, spec] of Object.entries(content)) {
            md += `- Content-Type: \`${ct}\`\n\n`;
            if (spec.example) md += 'Ejemplo:\n' + '```json\n' + JSON.stringify(spec.example, null, 2) + '\n```\n\n';
            if (spec.schema) md += renderSchema(spec.schema) + '\n';
        }
    }
    // Responses
    if (op.responses) {
        md += `**Responses:**\n\n`;
        for (const [code, resp] of Object.entries(op.responses)) {
            md += `- **${code}**: ${ensureText(resp.description)}\n\n`;
            const content = resp.content || {};
            for (const [ct, spec] of Object.entries(content)) {
                md += `  - Content-Type: \`${ct}\`\n\n`;
                if (spec.example) md += '```json\n' + JSON.stringify(spec.example, null, 2) + '\n```\n\n';
                if (spec.schema) md += renderSchema(spec.schema) + '\n';
            }
        }
    }
    if (op.security) {
        md += `**Seguridad:**\n\n\`\`\`json\n${JSON.stringify(op.security, null, 2)}\n\`\`\`\n\n`;
    }
    if (op.operationId) md += `**operationId:** ${op.operationId}\n\n`;
    md += '---\n\n';
    return md;
}

async function main() {
    const args = process.argv.slice(2);
    const url = args[0] || 'http://localhost/alojar/public/docs?api-docs.json';
    const outPath = args[1] || path.resolve('e:/workspace/alojar_mcp/server/docs/accommodation-prices.md');

    console.log('Obteniendo OpenAPI desde:', url);
    const openapi = await tryFetchJson(url);
    if (!openapi || !openapi.paths) {
        throw new Error('OpenAPI inválido o no contiene "paths".');
    }

    const paths = openapi.paths || {};
    const bookingEntries = Object.entries(paths).filter(([p]) => /accommodation-prices/i.test(p) || Object.values(paths[p]).some(op => {
        // también buscar operaciones con tags o summary que contengan accommodation-prices
        return Object.values(op || {}).some(v => {
            if (!v) return false;
            if (v.tags && v.tags.join(' ').toLowerCase().includes('accommodation-prices')) return true;
            if (v.summary && String(v.summary).toLowerCase().includes('accommodation-prices')) return true;
            if (v.description && String(v.description).toLowerCase().includes('accommodation-prices')) return true;
            return false;
        });
    }));

    let md = `# Documentación de endpoint(s) relacionados con "accommodation-prices"\n\n`;
    md += `Fuente: ${url}\n\n`;
    md += `Generado: ${new Date().toISOString()}\n\n`;

    if (bookingEntries.length === 0) {
        md += 'No se encontraron rutas que contengan "accommodation-prices". Revisa la URL o ajusta los términos de búsqueda.\n';
    } else {
        for (const [p, methods] of bookingEntries) {
            md += `## Ruta: \`${p}\`\n\n`;
            for (const method of Object.keys(methods)) {
                const op = methods[method];
                md += renderOperation(op, method, p);
            }
        }
    }

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, md, 'utf8');
    console.log('Documento escrito en:', outPath);
}

main().catch(err => {
    console.error('Error:', err.message || err);
    process.exit(1);
});
