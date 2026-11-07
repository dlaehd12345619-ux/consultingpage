import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// 여러 HTML 페이지를 모두 빌드 대상에 포함합니다.
const pages = ['index', 'services', 'process', 'roadmap', 'about', 'contact', 'research'];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((name) => [name, resolve(__dirname, `${name}.html`)])
      )
    }
  }
});
