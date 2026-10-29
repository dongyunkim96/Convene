import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
      paths: {
        origin: command === 'build' ? process.env.APP_ORIGIN || 'http://127.0.0.1:3000' : undefined,
      },
    }),
  ],
  server: { port: 5173, strictPort: true },
}));
