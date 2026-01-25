import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        plugins: [vue()],
        base: `/ccm/${process.env.VITE_KEY}/`,
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
        },
        server: {
            host: true,
            allowedHosts: true,
        },
    });
};
