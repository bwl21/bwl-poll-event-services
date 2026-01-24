/**
 * Service for managing event service poll data
 */
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Event, Person, Service } from './utils/ct-types';
import type { EventWithServices, ServicePollEntry, PollResponse } from './types';
import {
    getOrCreateModule,
    getCustomDataCategory,
    createCustomDataCategory,
    getCustomDataValues,
    createCustomDataValue,
    updateCustomDataValue,
} from './utils/kv-store';

const POLL_CATEGORY_SHORTY = 'poll-responses';

/**
 * Fetch events within a given time range that have services to be filled
 * @param daysAhead Number of days to look ahead (default: 90)
 * @returns Array of events with their services
 */
export async function fetchEventsWithServices(daysAhead: number = 90): Promise<EventWithServices[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const fromDate = now.toISOString().split('T')[0];
    const toDate = futureDate.toISOString().split('T')[0];

    try {
        // Fetch events with services included
        const events = await churchtoolsClient.get<Event[]>(
            `/events?from=${fromDate}&to=${toDate}&include=eventServices`
        );

        // Get current user to get their ID
        const user = await churchtoolsClient.get<Person>('/whoami');
        
        // Get user's group memberships
        const userGroupMemberships = await churchtoolsClient.get<any[]>(
            `/persons/${user.id}/groupmemberships`
        );
        const userGroupIds = userGroupMemberships.map((gm: any) => gm.groupId);

        // Get all services to check which groups they belong to
        const masterData = await churchtoolsClient.get<any>('/events/masterdata');
        const allServices: Service[] = masterData.services || [];

        // Filter events that have services matching user's groups
        const eventsWithServices: EventWithServices[] = events
            .filter(event => event.eventServices && event.eventServices.length > 0)
            .map(event => {
                const services = (event.eventServices || [])
                    .filter(eventService => {
                        // Find the service definition
                        const service = allServices.find(s => s.id === eventService.serviceId);
                        if (!service) return false;

                        // Check if this service can be filled by user's groups
                        if (service.groupIds && service.groupIds.length > 0) {
                            return service.groupIds.some(gid => userGroupIds.includes(gid));
                        }

                        // If no group restriction, include it
                        return true;
                    })
                    .map(eventService => ({
                        id: eventService.id!,
                        name: eventService.name || '',
                        serviceId: eventService.serviceId!,
                        isValid: eventService.isValid,
                    }));

                return {
                    id: event.id!,
                    name: event.name || '',
                    startDate: event.startDate || '',
                    endDate: event.endDate,
                    services,
                };
            })
            .filter(event => event.services.length > 0);

        return eventsWithServices;
    } catch (error) {
        console.error('Error fetching events with services:', error);
        return [];
    }
}

/**
 * Get or create the poll responses category in kv-store
 */
async function getPollCategory() {
    const module = await getOrCreateModule(
        import.meta.env.VITE_KEY || 'bwl-poll-event-services',
        'Event Service Poll',
        'Poll extension for ChurchTools event services'
    );

    let category = await getCustomDataCategory(POLL_CATEGORY_SHORTY);
    if (!category) {
        await createCustomDataCategory(
            {
                customModuleId: module.id,
                name: 'Poll Responses',
                shorty: POLL_CATEGORY_SHORTY,
                description: 'User responses for event service availability',
            },
            module.id
        );
        category = await getCustomDataCategory(POLL_CATEGORY_SHORTY);
    }

    return category;
}

/**
 * Load poll responses from kv-store
 */
export async function loadPollResponses(): Promise<ServicePollEntry[]> {
    try {
        const category = await getPollCategory();
        if (!category) {
            return [];
        }

        const module = await getOrCreateModule(
            import.meta.env.VITE_KEY || 'bwl-poll-event-services',
            'Event Service Poll',
            'Poll extension for ChurchTools event services'
        );

        const values = await getCustomDataValues<ServicePollEntry>(category.id, module.id);
        return values;
    } catch (error) {
        console.error('Error loading poll responses:', error);
        return [];
    }
}

/**
 * Save or update a poll response
 */
export async function savePollResponse(
    eventId: number,
    serviceId: number,
    response: PollResponse,
    comment: string
): Promise<void> {
    try {
        const category = await getPollCategory();
        if (!category) {
            throw new Error('Could not create poll category');
        }

        const module = await getOrCreateModule(
            import.meta.env.VITE_KEY || 'bwl-poll-event-services',
            'Event Service Poll',
            'Poll extension for ChurchTools event services'
        );

        const values = await getCustomDataValues<ServicePollEntry>(category.id, module.id);

        // Find existing response for this event/service combination
        const existing = values.find(
            v => v.eventId === eventId && v.serviceId === serviceId
        );

        const pollEntry: ServicePollEntry = {
            eventId,
            serviceId,
            response,
            comment,
            timestamp: new Date().toISOString(),
        };

        if (existing) {
            // Update existing response
            await updateCustomDataValue(
                category.id,
                existing.id,
                { value: JSON.stringify(pollEntry) },
                module.id
            );
        } else {
            // Create new response
            await createCustomDataValue(
                {
                    dataCategoryId: category.id,
                    value: JSON.stringify(pollEntry),
                },
                module.id
            );
        }
    } catch (error) {
        console.error('Error saving poll response:', error);
        throw error;
    }
}
