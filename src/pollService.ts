/**
 * Service for managing event service poll data
 */
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Event, Person, Service } from './utils/ct-types';
import type {
    EventWithServices,
    ServicePollEntry,
    PollResponse,
    UserInfo,
    ServiceAssignment,
    PollConfig,
} from './types';
import {
    getOrCreateModule,
    getCustomDataCategory,
    createCustomDataCategory,
    getCustomDataValues,
    createCustomDataValue,
    updateCustomDataValue,
} from './utils/kv-store';

const POLL_CATEGORY_SHORTY = 'poll-responses';

let cachedUser: UserInfo | null = null;

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<UserInfo> {
    if (cachedUser) return cachedUser;

    const user = await churchtoolsClient.get<Person>('/whoami');
    cachedUser = {
        id: user.id!,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    };
    return cachedUser;
}

/**
 * Parse URL parameters for poll configuration
 */
export function getPollConfig(): PollConfig {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start');
    const daysParam = params.get('days');

    const today = new Date().toISOString().split('T')[0];

    return {
        startDate: startParam || today,
        days: daysParam ? parseInt(daysParam, 10) : 90,
    };
}

/**
 * Fetch events within a given time range that have services to be filled
 */
export async function fetchEventsWithServices(
    startDate: string,
    days: number
): Promise<EventWithServices[]> {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const fromDate = start.toISOString().split('T')[0];
    const toDate = end.toISOString().split('T')[0];

    try {
        // Fetch events with services included
        const events = await churchtoolsClient.get<Event[]>(
            `/events?from=${fromDate}&to=${toDate}&include=eventServices`
        );

        // Get current user to get their ID
        const user = await getCurrentUser();

        // Get user's group memberships
        const userGroups = await churchtoolsClient.get<any[]>(
            `/persons/${user.id}/groups`
        );
        const userGroupIds = userGroups.map((g: any) => {
            const groupId = g.group?.domainIdentifier;
            return groupId ? parseInt(groupId, 10) : null;
        }).filter((id): id is number => id !== null);
        if (import.meta.env.DEV) {
            console.log('User:', user.id, user.name, 'Groups:', userGroupIds);
        }

        // Get all services to check which groups they belong to
        const masterData = await churchtoolsClient.get<any>('/event/masterdata');
        const allServices: Service[] = masterData.services || [];

        // Filter events that have services matching user's groups
        const eventsWithServices: EventWithServices[] = events
            .filter((event) => event.eventServices && event.eventServices.length > 0)
            .map((event) => {
                const services = (event.eventServices || [])
                    .filter((eventService) => {
                        // Find the service definition
                        const service = allServices.find(
                            (s) => s.id === eventService.serviceId
                        ) as any;
                        if (!service) return false;

                        // Check if this service can be filled by user's groups
                        if (service.groupIds && service.groupIds.length > 0) {
                            return service.groupIds.some((gid: number) =>
                                userGroupIds.includes(gid)
                            );
                        }

                        // If onlyAssignFromGroups is true but no groupIds, user can't fill this
                        if (service.onlyAssignFromGroups) {
                            return false;
                        }

                        // No group restriction - don't show
                        return false;
                    })
                    .map((eventService) => {
                        // Get service name from masterdata
                        const serviceDef = allServices.find(
                            (s) => s.id === eventService.serviceId
                        );
                        const serviceName = serviceDef?.name || eventService.name || '';

                        // Extract assignments from eventService
                        const assignments: ServiceAssignment[] = [];
                        if (eventService.person) {
                            const person = eventService.person as any;
                            const personName =
                                person.domainAttributes?.firstName && person.domainAttributes?.lastName
                                    ? `${person.domainAttributes.firstName} ${person.domainAttributes.lastName}`
                                    : person.title || eventService.name || '';
                            assignments.push({
                                personId: person.domainId || 0,
                                personName,
                                isConfirmed: eventService.isValid === true,
                            });
                        }

                        return {
                            id: eventService.id!,
                            name: serviceName,
                            serviceId: eventService.serviceId!,
                            isValid: eventService.isValid,
                            assignments,
                        };
                    });

                return {
                    id: event.id!,
                    name: event.name || '',
                    startDate: event.startDate || '',
                    endDate: event.endDate,
                    services,
                };
            })
            .filter((event) => event.services.length > 0);

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
 * Load all poll responses from kv-store (all users)
 */
export async function loadAllPollResponses(): Promise<ServicePollEntry[]> {
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

        const values = await getCustomDataValues<ServicePollEntry>(
            category.id,
            module.id
        );
        return values;
    } catch (error) {
        console.error('Error loading poll responses:', error);
        return [];
    }
}

/**
 * Load poll responses for current user only
 */
export async function loadUserPollResponses(): Promise<ServicePollEntry[]> {
    const user = await getCurrentUser();
    const allResponses = await loadAllPollResponses();
    return allResponses.filter((r) => r.userId === user.id);
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

        const user = await getCurrentUser();
        const values = await getCustomDataValues<ServicePollEntry>(
            category.id,
            module.id
        );

        // Find existing response for this event/service/user combination
        const existing = values.find(
            (v) =>
                v.eventId === eventId &&
                v.serviceId === serviceId &&
                v.userId === user.id
        );

        const pollEntry: ServicePollEntry = {
            eventId,
            serviceId,
            userId: user.id,
            userName: user.name,
            response,
            comment,
            timestamp: new Date().toISOString(),
        };

        if (existing) {
            // Update existing response
            await updateCustomDataValue(
                category.id,
                existing.id!,
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

/**
 * Get responses grouped by service for display
 */
export function getResponsesForService(
    allResponses: ServicePollEntry[],
    eventId: number,
    serviceId: number
): {
    yes: ServicePollEntry[];
    maybe: ServicePollEntry[];
    no: ServicePollEntry[];
} {
    const serviceResponses = allResponses.filter(
        (r) => r.eventId === eventId && r.serviceId === serviceId
    );

    return {
        yes: serviceResponses.filter((r) => r.response === 'yes'),
        maybe: serviceResponses.filter((r) => r.response === 'maybe'),
        no: serviceResponses.filter((r) => r.response === 'no'),
    };
}
