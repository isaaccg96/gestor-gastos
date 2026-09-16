import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['img/apple-touch-icon.png'],
            manifest: {
                name: 'Gestor de Gastos',
                short_name: 'Gastos',
                description: 'Gestor de gastos personales con presupuestos por categoría',
                theme_color: '#1f2937',
                background_color: '#f3f4f6',
                display: 'standalone',
                start_url: '/dashboard',
                icons: [
                    {
                        src: '/img/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/img/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/img/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
});
