import { churchtoolsClient } from '@churchtools/churchtools-client';
import { fetchEventsWithServices, loadPollResponses } from './pollService';
import { renderPollUI } from './ui';

// only import reset.css in development mode to keep the production bundle small and to simulate CT environment
if (import.meta.env.MODE === 'development') {
    import('./utils/reset.css');
}

declare const window: Window &
    typeof globalThis & {
        settings: {
            base_url?: string;
        };
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

const KEY = import.meta.env.VITE_KEY;
export { KEY };

// Get the app container
const appContainer = document.querySelector<HTMLDivElement>('#app')!;

// Show loading state
appContainer.innerHTML = `
  <div style="display: flex; place-content: center; place-items: center; height: 100vh;">
    <div style="text-align: center;">
      <h2 style="color: #666;">Laden...</h2>
      <p style="color: #999;">Dienste werden geladen...</p>
    </div>
  </div>
`;

try {
    // Load events and existing poll responses
    const [events, existingResponses] = await Promise.all([
        fetchEventsWithServices(90), // Default 90 days ahead
        loadPollResponses(),
    ]);

    // Render the poll UI
    renderPollUI(events, existingResponses, appContainer);
} catch (error) {
    console.error('Error initializing poll application:', error);
    appContainer.innerHTML = `
      <div style="display: flex; place-content: center; place-items: center; height: 100vh;">
        <div style="text-align: center; color: #d32f2f;">
          <h2>Fehler beim Laden</h2>
          <p>Die Dienste konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
        </div>
      </div>
    `;
}
