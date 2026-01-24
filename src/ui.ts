/**
 * UI rendering functions for the poll interface
 */
import type { EventWithServices, ServicePollEntry, PollResponse } from './types';
import { savePollResponse } from './pollService';

/**
 * Render the complete poll UI
 */
export function renderPollUI(
    events: EventWithServices[],
    existingResponses: ServicePollEntry[],
    container: HTMLElement
): void {
    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <h1 style="color: #333; margin-bottom: 10px;">Dienste-Umfrage</h1>
            <p style="color: #666; margin-bottom: 30px;">
                Bitte geben Sie an, für welche Dienste Sie verfügbar sind.
            </p>
            <div id="events-list"></div>
        </div>
    `;

    const eventsList = container.querySelector('#events-list')!;
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                Keine Dienste gefunden, die von Ihren Gruppen besetzt werden können.
            </div>
        `;
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.style.cssText = `
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        const startDate = new Date(event.startDate);
        const dateStr = startDate.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const timeStr = startDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });

        eventCard.innerHTML = `
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 1.5em;">
                ${escapeHtml(event.name)}
            </h2>
            <p style="color: #666; margin: 0 0 20px 0;">
                ${dateStr} um ${timeStr} Uhr
            </p>
            <div id="services-${event.id}"></div>
        `;

        eventsList.appendChild(eventCard);

        const servicesContainer = eventCard.querySelector(`#services-${event.id}`)!;
        
        event.services.forEach(service => {
            const existingResponse = existingResponses.find(
                r => r.eventId === event.id && r.serviceId === service.id
            );

            const serviceRow = createServiceRow(
                event.id,
                service.id,
                service.name,
                existingResponse?.response || null,
                existingResponse?.comment || ''
            );
            
            servicesContainer.appendChild(serviceRow);
        });
    });
}

/**
 * Create a single service row with response buttons
 */
function createServiceRow(
    eventId: number,
    serviceId: number,
    serviceName: string,
    currentResponse: PollResponse,
    currentComment: string
): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = `
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 15px;
        background: #fafafa;
    `;

    row.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong style="color: #333;">${escapeHtml(serviceName)}</strong>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <button class="response-btn" data-response="yes" style="
                padding: 8px 16px;
                border: 2px solid #4CAF50;
                border-radius: 4px;
                background: ${currentResponse === 'yes' ? '#4CAF50' : 'white'};
                color: ${currentResponse === 'yes' ? 'white' : '#4CAF50'};
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            ">✓ Ja</button>
            <button class="response-btn" data-response="maybe" style="
                padding: 8px 16px;
                border: 2px solid #FF9800;
                border-radius: 4px;
                background: ${currentResponse === 'maybe' ? '#FF9800' : 'white'};
                color: ${currentResponse === 'maybe' ? 'white' : '#FF9800'};
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            ">? Vielleicht</button>
            <button class="response-btn" data-response="no" style="
                padding: 8px 16px;
                border: 2px solid #f44336;
                border-radius: 4px;
                background: ${currentResponse === 'no' ? '#f44336' : 'white'};
                color: ${currentResponse === 'no' ? 'white' : '#f44336'};
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            ">✗ Nein</button>
        </div>
        <div>
            <textarea
                class="comment-field"
                placeholder="Kommentar (optional)"
                style="
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    resize: vertical;
                    min-height: 60px;
                    font-family: system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                "
            >${escapeHtml(currentComment)}</textarea>
        </div>
        <div class="status-message" style="
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            display: none;
        "></div>
    `;

    // Add event listeners to buttons
    const buttons = row.querySelectorAll<HTMLButtonElement>('.response-btn');
    const commentField = row.querySelector<HTMLTextAreaElement>('.comment-field')!;
    const statusMessage = row.querySelector<HTMLElement>('.status-message')!;

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const response = button.getAttribute('data-response') as PollResponse;
            
            // Update button styles
            buttons.forEach(btn => {
                const btnResponse = btn.getAttribute('data-response');
                if (btnResponse === response) {
                    // Selected button
                    if (btnResponse === 'yes') {
                        btn.style.background = '#4CAF50';
                        btn.style.color = 'white';
                    } else if (btnResponse === 'maybe') {
                        btn.style.background = '#FF9800';
                        btn.style.color = 'white';
                    } else if (btnResponse === 'no') {
                        btn.style.background = '#f44336';
                        btn.style.color = 'white';
                    }
                } else {
                    // Unselected buttons
                    btn.style.background = 'white';
                    const borderColor = btn.style.borderColor;
                    btn.style.color = borderColor.split(' ')[0];
                }
            });

            // Save the response
            try {
                const comment = commentField.value;
                await savePollResponse(eventId, serviceId, response, comment);
                
                // Show success message
                statusMessage.textContent = 'Gespeichert ✓';
                statusMessage.style.display = 'block';
                statusMessage.style.background = '#d4edda';
                statusMessage.style.color = '#155724';
                
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 2000);
            } catch (error) {
                // Show error message
                statusMessage.textContent = 'Fehler beim Speichern';
                statusMessage.style.display = 'block';
                statusMessage.style.background = '#f8d7da';
                statusMessage.style.color = '#721c24';
                console.error('Error saving response:', error);
            }
        });

        // Add hover effect
        button.addEventListener('mouseenter', () => {
            if (button.style.background === 'white') {
                button.style.opacity = '0.7';
            }
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });
    });

    // Save comment when it changes (with debounce)
    let commentTimeout: ReturnType<typeof setTimeout>;
    commentField.addEventListener('input', () => {
        clearTimeout(commentTimeout);
        commentTimeout = setTimeout(async () => {
            try {
                // Get current response
                const selectedButton = Array.from(buttons).find(btn => 
                    btn.style.background !== 'white'
                );
                const response = selectedButton ? 
                    selectedButton.getAttribute('data-response') as PollResponse : 
                    null;
                
                await savePollResponse(eventId, serviceId, response, commentField.value);
                
                // Show brief success indicator
                statusMessage.textContent = 'Kommentar gespeichert ✓';
                statusMessage.style.display = 'block';
                statusMessage.style.background = '#d4edda';
                statusMessage.style.color = '#155724';
                
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 1500);
            } catch (error) {
                console.error('Error saving comment:', error);
            }
        }, 1000); // Wait 1 second after typing stops
    });

    return row;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
