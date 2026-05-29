import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];

    // Clean leading/trailing slashes for path operations
    let relativePath = urlPath;

    // Apply vercel.json rewrites locally
    if (relativePath === '/') {
        relativePath = '/pages/index.html';
    } else {
        const directPath = path.join(PUBLIC_DIR, relativePath);
        let existsDirect = false;
        try {
            existsDirect = fs.existsSync(directPath) && fs.statSync(directPath).isFile();
        } catch(e) {}

        if (!existsDirect) {
            // Try with /pages prefix
            const pagesPath = path.join(PUBLIC_DIR, 'pages', relativePath);
            let existsPages = false;
            try {
                existsPages = fs.existsSync(pagesPath) && fs.statSync(pagesPath).isFile();
            } catch(e) {}

            if (existsPages) {
                relativePath = `/pages/${relativePath.replace(/^\//, '')}`;
            } else if (!path.extname(relativePath)) {
                // Try pages/path.html
                const pagesHtmlPath = path.join(PUBLIC_DIR, 'pages', relativePath + '.html');
                let existsPagesHtml = false;
                try {
                    existsPagesHtml = fs.existsSync(pagesHtmlPath) && fs.statSync(pagesHtmlPath).isFile();
                } catch(e) {}

                if (existsPagesHtml) {
                    relativePath = `/pages/${relativePath.replace(/^\//, '')}.html`;
                } else {
                    // Try path.html
                    const directHtmlPath = path.join(PUBLIC_DIR, relativePath + '.html');
                    let existsDirectHtml = false;
                    try {
                        existsDirectHtml = fs.existsSync(directHtmlPath) && fs.statSync(directHtmlPath).isFile();
                    } catch(e) {}

                    if (existsDirectHtml) {
                        relativePath = `/${relativePath.replace(/^\//, '')}.html`;
                    }
                }
            } else if (path.extname(relativePath) === '.html') {
                // Try pages/path.html (if they requested a non-existent root html file, e.g. /auth.html -> /pages/auth.html)
                const pagesHtmlPath = path.join(PUBLIC_DIR, 'pages', relativePath);
                let existsPagesHtml = false;
                try {
                    existsPagesHtml = fs.existsSync(pagesHtmlPath) && fs.statSync(pagesHtmlPath).isFile();
                } catch(e) {}

                if (existsPagesHtml) {
                    relativePath = `/pages/${relativePath.replace(/^\//, '')}`;
                }
            }
        }
    }

    let filePath = path.join(PUBLIC_DIR, relativePath);

    // Security check: ensure filePath is within PUBLIC_DIR
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback for SPA or pages routing: if it is /something under pages, check without pages prefix
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>404 Not Found</title>
                    <style>
                        body { font-family: system-ui, sans-serif; background: #0a0a0c; color: #fff; text-align: center; padding: 100px 20px; }
                        h1 { color: #ff3e3e; font-size: 48px; margin-bottom: 20px; }
                        p { font-size: 18px; color: #888; }
                        a { color: #05D9E8; text-decoration: none; border-bottom: 1px dashed; }
                    </style>
                </head>
                <body>
                    <h1>404 Not Found</h1>
                    <p>The requested path <code>${urlPath}</code> could not be resolved.</p>
                    <p><a href="/">Go to Homepage</a></p>
                </body>
                </html>
            `);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        
        // Disable caching for dev server
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
            console.error('Stream error:', streamErr);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        });
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Athar Local Dev Server started at http://localhost:${PORT}`);
    console.log(`👉 Primary Address: http://localhost:${PORT}/pages/index.html`);
    console.log(`👉 Rewritten Address: http://localhost:${PORT}/\n`);
});
