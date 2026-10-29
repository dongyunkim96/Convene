import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ command, mode }) => {
  const vercel = mode === 'vercel' || process.env.VERCEL === '1';
  return {
    plugins: [
      tailwindcss(),
      sveltekit({
        adapter: vercel ? vercelAdapter({ runtime: 'nodejs24.x' }) : nodeAdapter(),
        paths: {
          // Vercel supplies the request origin for both preview and production URLs.
          origin:
            command === 'build' && !vercel
              ? process.env.APP_ORIGIN || 'http://127.0.0.1:3000'
              : undefined,
        },
      }),
    ],
    server: { port: 5173, strictPort: true },
  };
});
