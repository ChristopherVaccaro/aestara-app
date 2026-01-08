import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';

// Plugin to handle /api/* routes in development (mimics Vercel serverless)
function apiRoutesPlugin(): Plugin {
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const apiPath = req.url.split('?')[0]; // e.g., /api/apply-image-filter
        const handlerName = apiPath.replace('/api/', ''); // e.g., apply-image-filter
        
        try {
          // Dynamically import the handler
          const handlerModule = await import(`./api/${handlerName}.ts`);
          const handler = handlerModule.default;
          
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Handler not found' }));
            return;
          }

          // Parse JSON body for POST requests
          let body: any = undefined;
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            try {
              body = raw ? JSON.parse(raw) : {};
            } catch {
              body = {};
            }
          }

          // Create a simple request/response object similar to Vercel's
          const fakeReq = {
            method: req.method,
            headers: req.headers,
            body,
            url: req.url,
          };

          const fakeRes = {
            statusCode: 200,
            headers: {} as Record<string, string>,
            setHeader(name: string, value: string) {
              this.headers[name] = value;
              res.setHeader(name, value);
            },
            getHeader(name: string) {
              return this.headers[name];
            },
            end(data?: string) {
              res.statusCode = this.statusCode;
              res.end(data);
            },
          };

          await handler(fakeReq, fakeRes);
        } catch (err: any) {
          console.error('API route error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Make environment variables available to process.env for API routes
    process.env = { ...process.env, ...env };
    
    return {
      plugins: [apiRoutesPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: false,
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: undefined,
          }
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ALLOWED_ORIGIN': JSON.stringify(env.ALLOWED_ORIGIN || '*'),
      }
    };
});
