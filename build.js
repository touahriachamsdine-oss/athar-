import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
    const root = __dirname;
    const outputDir = path.join(root, 'public'); // This is what Vercel expects

    console.log('Build: Starting Automatic Vercel Fix...');

    // 1. Clean outputDir if it exists (but keep assets_source!)
    if (fs.existsSync(outputDir)) {
        // We delete everything inside except what we need
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // 2. Clone project into public/ folder
    const itemsToCopy = ['pages', 'src', 'vercel.json', 'manifest.json', 'README.md'];
    itemsToCopy.forEach(item => {
        const srcPath = path.join(root, item);
        const destPath = path.join(outputDir, item);
        if (fs.existsSync(srcPath)) {
            fs.cpSync(srcPath, destPath, { recursive: true });
            console.log(`Build: Copied ${item} to output`);
        }
    });

    // 3. Map assets_source to public/public to preserve app links
    const assetsSrc = path.join(root, 'assets_source');
    const assetsDest = path.join(outputDir, 'public');
    if (fs.existsSync(assetsSrc)) {
        fs.cpSync(assetsSrc, assetsDest, { recursive: true });
        console.log('Build: Assets mapped accurately to output/public');
    }

    // 4. Inject variables into config.js INSIDE the output folder
    const configPath = path.join(outputDir, 'src/js/config.js');
    if (fs.existsSync(configPath)) {
        let config = fs.readFileSync(configPath, 'utf8');
        const neonAuthUrl = process.env.NEON_AUTH_URL || 'https://ep-silent-bread-aqt1uezw.neonauth.c-8.us-east-1.aws.neon.tech/neondb/auth';
        const neonApiUrl = process.env.NEON_API_URL || 'https://ep-silent-bread-aqt1uezw.apirest.c-8.us-east-1.aws.neon.tech/neondb/rest/v1';
        config = config.replace(/YOUR_NEON_AUTH_URL/g, neonAuthUrl);
        config = config.replace(/YOUR_NEON_API_URL/g, neonApiUrl);
        fs.writeFileSync(configPath, config);
        console.log('Build: Neon variables injected into output config.');
    }

    console.log('Build: SUCCESS. Project is ready in /public folder.');
}

build().catch(err => {
    console.error('Build Error:', err);
    process.exit(1);
});
