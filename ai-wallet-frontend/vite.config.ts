import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Порт має збігатися з тим, який ти відкриваєш у браузері
  },
});
