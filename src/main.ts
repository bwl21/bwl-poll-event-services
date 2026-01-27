import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
// Note: primeicons loaded from CDN in index.html

// Import only used PrimeVue components
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import ToggleSwitch from 'primevue/toggleswitch';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';

import { churchtoolsClient } from '@churchtools/churchtools-client';
import App from './App.vue';

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
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const extensionKey = import.meta.env.VITE_KEY || 'bwl-poll-event-services';
const shortKey = extensionKey.split('-')[0]; // Get first part, e.g., 'bwl'
const tabId = Math.random().toString(36).substring(2, 9); // Generate unique tab ID

window.CT_BASE_URL = baseUrl;
window.CT_EXTENSION_KEY = extensionKey;
window.CT_WINDOW_NAME = `${shortKey}_${tabId}`;

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

// Register only used components
app.component('Button', Button);
app.component('DatePicker', DatePicker);
app.component('InputNumber', InputNumber);
app.component('ProgressSpinner', ProgressSpinner);
app.component('Message', Message);
app.component('Toast', Toast);
app.component('TabView', TabView);
app.component('TabPanel', TabPanel);
app.component('Card', Card);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('Dialog', Dialog);
app.component('ToggleSwitch', ToggleSwitch);
app.component('Textarea', Textarea);
app.component('Tag', Tag);

app.mount('#app');
