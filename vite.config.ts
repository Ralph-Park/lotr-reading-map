import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages는 https://<아이디>.github.io/lotr-reading-map/ 아래에서 서비스되므로 빌드 시에만 경로를 붙인다
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lotr-reading-map/' : '/',
  plugins: [react(), tailwindcss()],
}))
