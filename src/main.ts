import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
// Load only woff2 web font, exclude SVG to save ~300KB
import './styles/primeicons-woff2-only.css';

import { churchtoolsClient } from '@churchtools/churchtools-client';
import App from './App.vue';
import { makeCurrentUserAdmin, addAdminPermission, removeAdminPermission } from './pollService';

// only import reset.css in development mode
if (import.meta.env.MODE === 'development') {
    import('./utils/reset.css');
}

declare const window: Window &
    typeof globalThis & {
        settings: {
            base_url?: string;
        };
        CT_BASE_URL?: string;
        CT_EXTENSION_KEY?: string;
        CT_WINDOW_NAME?: string;
        // Admin helper functions for console access
        makeCurrentUserAdmin?: () => Promise<void>;
        addAdminPermission?: (userId: number) => Promise<void>;
        removeAdminPermission?: (userId: number) => Promise<void>;
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const extensionKey = import.meta.env.VITE_KEY || 'bwl-poll-event-services';
const shortKey = extensionKey.split('-')[0]; // Get first part, e.g., 'bwl'
const tabId = Math.random().toString(36).substring(2, 9); // Generate unique tab ID

window.CT_BASE_URL = baseUrl;
window.CT_EXTENSION_KEY = extensionKey;
window.CT_WINDOW_NAME = `${shortKey}_${tabId}`;

// Expose admin functions for console access (e.g., window.makeCurrentUserAdmin())
window.makeCurrentUserAdmin = makeCurrentUserAdmin;
window.addAdminPermission = addAdminPermission;
window.removeAdminPermission = removeAdminPermission;

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

export const KEY = extensionKey;

const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark-mode',
        },
    },
});
app.use(ToastService);
app.directive('tooltip', Tooltip);

app.mount('#app');
