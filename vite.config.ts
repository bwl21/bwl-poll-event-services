import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        plugins: [
            vue(),
            visualizer({
                open: false,
                gzipSize: true,
                brotliSize: true,
                filename: 'dist/bundle-analysis.html',
            }),
        ],
        base: `/ccm/${process.env.VITE_KEY}/`,
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        primevue: ['primevue/config', 'primevue/button', 'primevue/datatable'],
                    },
                },
            },
        },
        server: {
            host: true,
            allowedHosts: true,
        },
    });
};
