import { readFileSync, writeFileSync } from 'fs';
import { version } from './version.js';

try {
    const pkgPath = './package.json';
    const pkgContent = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);

    const oldVersion = pkg.version;
    pkg.version = version;

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    console.log(`✔ Versió sincronitzada: ${oldVersion} → ${version} (package.json)`);
} catch (error) {
    console.error('❌ Error sincronitzant la versió:', error);
    process.exit(1);
}
