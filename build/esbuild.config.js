import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { version } from './version.js';  

let header = readFileSync('./build/userScriptHeader.raw', 'utf8');
header = header.replace('{{VERSION}}', version);

esbuild.build({
    entryPoints: ['./src/main.js'],
    bundle: true,
    outfile: './dist/script.user.js',
    banner: {
        js: header,
    },
    format: 'iife',
    target: ['chrome58', 'firefox57'],
}).catch(() => process.exit(1));
