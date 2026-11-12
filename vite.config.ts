import { defineConfig } from 'vite';

// GitHub Pages 는 /<저장소 이름>/ 하위 경로로 서비스되므로 상대 경로로 빌드한다
export default defineConfig({
  base: './',
});
