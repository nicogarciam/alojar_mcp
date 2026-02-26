import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
export async function registerAllTools(server) {
    const __filename = fileURLToPath(import.meta.url);
    const dir = path.resolve(path.dirname(__filename));
    for (const file of fs.readdirSync(dir)) {
        if (file.endsWith('.tool.ts') || file.endsWith('.tool.js')) {
            try {
                const filePath = path.join(dir, file);
                const mod = await import(pathToFileURL(filePath).href);
                if (typeof mod.register === 'function') {
                    mod.register(server);
                }
                else if (typeof mod.registerGreetTool === 'function') {
                    // soporte para nombres explícitos
                    Object.values(mod).forEach(fn => { if (typeof fn === 'function')
                        fn(server); });
                }
            }
            catch (err) {
                console.warn('No se pudo importar la tool:', file, err);
            }
        }
    }
}
