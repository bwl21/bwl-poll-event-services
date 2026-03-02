/**
 * Service for managing event service poll data
 */
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Event, Person, Service } from './utils/ct-types';
import type {
    EventWithServices,
    FetchEventsResult,
    ServicePollEntry,
    PollResponse,
    UserInfo,
    ServiceAssignment,
    PollConfig,
    AdminServiceConfig,
} from './types';
import {
    getOrCreateModule,
    getCustomDataCategory,
    createCustomDataCategory,
    getCustomDataValues,
    createCustomDataValue,
    updateCustomDataValue,
    deleteCustomDataValue,
} from './utils/kv-store';
import { createLogger } from './utils/logger';
import { formatWeekday, formatDateOnly, formatTime } from './utils/date';

const POLL_CATEGORY_SHORTY = 'poll-responses';
const ADMIN_CONFIG_CATEGORY_SHORTY = 'admin-config';
const DEFAULT_DAYS = 90;

const debugLog = createLogger('POLL');

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
 * Get group IDs for current user (for filtering services they can plan)
 */
export async function getCurrentUserGroupIds(): Promise<number[]> {
    const user = await getCurrentUser();
    const userGroups = await churchtoolsClient.get<any[]>(
        `/persons/${user.id}/groups`
    );
    
    const userGroupIds = userGroups.map((g: any) => {
        const groupId = g.group?.domainIdentifier
            ?? g.group?.id
            ?? g.groupId
            ?? g.id;
        return groupId ? parseInt(String(groupId), 10) : null;
    }).filter((id): id is number => id !== null && !isNaN(id));
    
    debugLog('User group IDs:', userGroupIds);
    return userGroupIds;
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
        days: daysParam ? parseInt(daysParam, 10) : DEFAULT_DAYS,
    };
}

/**
 * Fetch events within a given time range that have services to be filled
 */
export async function fetchEventsWithServices(
    startDate: string,
    days: number,
    isAdmin: boolean = false
): Promise<FetchEventsResult> {
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

        // Extract unique calendar IDs from events
        const calendarIds = new Set<number>();
        for (const event of events) {
            const calendarId = (event as any).calendar?.domainIdentifier;
            if (calendarId) {
                calendarIds.add(parseInt(calendarId, 10));
            }
        }
        debugLog('Calendar IDs found:', Array.from(calendarIds));

        // Fetch appointments with resource bookings per calendar (individual requests to avoid 403 on inaccessible calendars)
        const appointmentResources = new Map<number, any[]>();
        const failedCalendarIds = new Set<number>();
        if (calendarIds.size > 0) {
            const calendarFetches = Array.from(calendarIds).map(async (calId) => {
                try {
                    const url = `/calendars/appointments?calendar_ids[]=${calId}&from=${fromDate}&to=${toDate}&include[]=bookings`;
                    const appointments = await churchtoolsClient.get<any[]>(url);
                    for (const apt of appointments) {
                        const appointmentId = apt.base?.id || apt.id;
                        const bookings = apt.base?.bookings || apt.bookings;
                        if (appointmentId && bookings && bookings.length > 0) {
                            appointmentResources.set(appointmentId, bookings);
                        }
                    }
                } catch (e: any) {
                    if (e?.response?.status === 403 || e?.message?.includes('403')) {
                        failedCalendarIds.add(calId);
                    }
                    debugLog('Skipping calendar', calId, '(no access or error):', e?.message);
                }
            });
            await Promise.all(calendarFetches);
            debugLog('Appointments loaded for', appointmentResources.size, 'events, failed calendars:', Array.from(failedCalendarIds));
        }

        // Get current user to get their ID
        const user = await getCurrentUser();

        // Get user's group memberships
        const userGroups = await churchtoolsClient.get<any[]>(
            `/persons/${user.id}/groups`
        );
        debugLog('User groups raw response:', JSON.stringify(userGroups.slice(0, 3)));
        const userGroupIds = userGroups.map((g: any) => {
            const groupId = g.group?.domainIdentifier
                ?? g.group?.id
                ?? g.groupId
                ?? g.id;
            return groupId ? parseInt(String(groupId), 10) : null;
        }).filter((id): id is number => id !== null && !isNaN(id));
        debugLog('User:', user.id, user.name, 'Groups:', userGroupIds);

        // Get all services to check which groups they belong to
        const masterData = await churchtoolsClient.get<any>('/event/masterdata');
        const allServices: Service[] = masterData.services || [];
        const serviceGroups: any[] = masterData.serviceGroups || [];
        const serviceGroupMap = new Map<number, string>();
        for (const sg of serviceGroups) {
            serviceGroupMap.set(sg.id, sg.name || '');
        }

        // Get service configurations (votes visibility and enabled status)
        const serviceConfigs = await getServiceConfigs();
        const votesVisibilityMap = new Map<number, boolean>();
        const enabledServicesMap = new Map<number, boolean>();
        for (const config of serviceConfigs) {
            votesVisibilityMap.set(config.serviceId, config.votesVisible);
            enabledServicesMap.set(config.serviceId, config.enabled);
        }
        debugLog('Service configs loaded:', {
            count: serviceConfigs.length,
            enabled: Array.from(enabledServicesMap.entries()),
            votesVisible: Array.from(votesVisibilityMap.entries()),
        });
        
        // Log all services being processed
        debugLog('All services from masterdata:', allServices.map(s => ({ id: s.id, name: s.name })));

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

                        // Check if service is enabled (not disabled in admin config)
                        const isEnabled = enabledServicesMap.get(eventService.serviceId!) ?? true; // Default to enabled
                        if (!isEnabled) {
                            debugLog('Service', eventService.serviceId, 'is disabled, filtering out');
                            return false;
                        }

                        // Admins see all services
                        if (isAdmin) {
                            return true;
                        }

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
                                isConfirmed: eventService.isAccepted === true,
                            });
                        }

                        const categoryName = serviceGroupMap.get((serviceDef as any)?.serviceGroupId) || undefined;

                        return {
                            id: eventService.id!,
                            name: serviceName,
                            serviceId: eventService.serviceId!,
                            categoryName,
                            sortKey: serviceDef?.sortKey,
                            isValid: eventService.isValid,
                            assignments,
                            votesVisible: votesVisibilityMap.get(eventService.serviceId!) ?? true,
                            groupIds: serviceDef?.groupIds || [],
                        };
                    });

                // Extract resources from appointments
                let resources: any[] = [];
                const appointmentId = (event as any).appointmentId || (event as any).appointment?.id;
                debugLog('Event', event.id, 'appointmentId:', appointmentId);
                if (appointmentId) {
                    const bookings = appointmentResources.get(appointmentId);
                    debugLog('Bookings for appointment', appointmentId, ':', bookings);
                    if (bookings && bookings.length > 0) {
                        resources = bookings.map((b: any) => ({
                            name: b.base?.resource?.name || b.resource?.name || b.name || '',
                        })).filter((r) => r.name);
                    }
                }

                const eventCalendarId = (event as any).calendar?.domainIdentifier
                    ? parseInt((event as any).calendar.domainIdentifier, 10)
                    : null;
                const resourcesUnavailable = eventCalendarId !== null && failedCalendarIds.has(eventCalendarId);

                return {
                    id: event.id!,
                    name: event.name || '',
                    startDate: event.startDate || '',
                    endDate: event.endDate,
                    resources: resources.length > 0 ? resources : undefined,
                    resourcesUnavailable: resourcesUnavailable || undefined,
                    services,
                };
            })
            .filter((event) => event.services.length > 0);

        return { events: eventsWithServices };
    } catch (error) {
        console.error('Error fetching events with services:', error);
        return { events: [] };
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

/**
 * ────────────────────────────────────────────────
 *  ADMIN FUNCTIONS
 * ────────────────────────────────────────────────
 */

let cachedIsAdmin: boolean | null = null;

/**
 * Check if current user has "Poll Admin" permission
 * A user is an admin if they have read access to the "admin-config" KV-Store category
 * This allows admins to be managed through ChurchTools permission system
 */
export async function isUserAdmin(): Promise<boolean> {
    if (cachedIsAdmin !== null) return cachedIsAdmin;

    try {
        // This will create the admin-config category if it doesn't exist
        const adminCategory = await getAdminConfigCategory();
        
        // If category exists and we can read it, user is admin
        const isAdmin = adminCategory !== undefined && adminCategory !== null;
        debugLog('Admin check for user: has access to admin-config category =', isAdmin);
        
        cachedIsAdmin = isAdmin;
        return isAdmin;
    } catch (error: any) {
        // If we get a 403 Forbidden, user has no access = not admin
        if (error?.response?.status === 403 || error?.message?.includes('403')) {
            debugLog('User has no permission to access admin-config category');
            cachedIsAdmin = false;
            return false;
        }
        // For other errors, log but assume not admin
        debugLog('Error checking admin status:', error);
        cachedIsAdmin = false;
        return false;
    }
}

/**
 * Get or create the admin config category in kv-store
 */
async function getAdminConfigCategory() {
    const module = await getOrCreateModule(
        import.meta.env.VITE_KEY || 'bwl-poll-event-services',
        'Event Service Poll',
        'Poll extension for ChurchTools event services'
    );

    let category = await getCustomDataCategory(ADMIN_CONFIG_CATEGORY_SHORTY);
    if (!category) {
        await createCustomDataCategory(
            {
                customModuleId: module.id,
                name: 'Admin Config',
                shorty: ADMIN_CONFIG_CATEGORY_SHORTY,
                description: 'Admin configuration and service visibility settings',
            },
            module.id
        );
        category = await getCustomDataCategory(ADMIN_CONFIG_CATEGORY_SHORTY);
    }

    return category;
}

/**
 * Get all service configurations (visibility settings)
 */
export async function getServiceConfigs(): Promise<AdminServiceConfig[]> {
    try {
        const category = await getAdminConfigCategory();
        if (!category) {
            return [];
        }

        const module = await getOrCreateModule(
            import.meta.env.VITE_KEY || 'bwl-poll-event-services',
            'Event Service Poll',
            'Poll extension for ChurchTools event services'
        );

        const values = await getCustomDataValues<AdminServiceConfig & { type?: string }>(
            category.id,
            module.id
        );

        // Filter only service config entries and set defaults for missing fields
        const configs = values
            .filter((v) => v.type === 'service-config' && v.serviceId !== undefined)
            .map((v) => ({
                ...v,
                enabled: v.enabled ?? true, // Default to enabled for backward compatibility
            })) as AdminServiceConfig[];
        
        debugLog('Loaded service configs:', configs.length, 'configs');
        return configs;
    } catch (error) {
        console.error('Error loading service configs:', error);
        return [];
    }
}

/**
 * Update service configuration (visibility settings)
 */
export async function updateServiceConfig(
    serviceId: number,
    votesVisible: boolean,
    serviceName?: string,
    enabled: boolean = true
): Promise<void> {
    try {
        const category = await getAdminConfigCategory();
        if (!category) {
            throw new Error('Could not create admin config category');
        }

        const module = await getOrCreateModule(
            import.meta.env.VITE_KEY || 'bwl-poll-event-services',
            'Event Service Poll',
            'Poll extension for ChurchTools event services'
        );

        const values = await getCustomDataValues<AdminServiceConfig & { type?: string }>(
            category.id,
            module.id
        );

        // Find existing config for this service
        const existing = values.find((v) => v.serviceId === serviceId);

        const configEntry = {
            type: 'service-config',
            serviceId,
            serviceName,
            votesVisible,
            enabled,
        };

        if (existing && existing.id) {
            await updateCustomDataValue(
                category.id,
                existing.id,
                { value: JSON.stringify(configEntry) },
                module.id
            );
            debugLog('Updated service config for service', serviceId);
        } else {
            await createCustomDataValue(
                {
                    dataCategoryId: category.id,
                    value: JSON.stringify(configEntry),
                },
                module.id
            );
            debugLog('Created service config for service', serviceId);
        }
    } catch (error) {
        console.error('Error updating service config:', error);
        throw error;
    }
}

/**
 * Delete a poll response (admin function)
 */
export async function deleteResponse(
    eventId: number,
    serviceId: number,
    userId: number
): Promise<void> {
    try {
        const category = await getPollCategory();
        if (!category) {
            throw new Error('Poll category not found');
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

        // Find the response to delete
        const response = values.find(
            (v) =>
                v.eventId === eventId &&
                v.serviceId === serviceId &&
                v.userId === userId
        );

        if (!response || !response.id) {
            throw new Error('Response not found');
        }

        await deleteCustomDataValue(category.id, response.id, module.id);
        debugLog('Deleted response for event', eventId, 'service', serviceId, 'user', userId);
    } catch (error) {
        console.error('Error deleting response:', error);
        throw error;
    }
}

/**
 * Get all services from masterdata (for admin config)
 */
export async function getAllServicesFromResponses(): Promise<{ serviceId: number; serviceName: string; categoryName?: string }[]> {
    // Get all services from masterdata
    const masterData = await churchtoolsClient.get<any>('/event/masterdata');
    const allServices: Service[] = masterData.services || [];
    const serviceGroups = masterData.serviceGroups || [];
    
    return allServices.map(service => {
        const serviceGroup = serviceGroups.find((sg: any) => sg.id === (service as any).serviceGroupId);
        return {
            serviceId: service.id!,
            serviceName: service.name || `Service ${service.id}`,
            categoryName: serviceGroup?.name || undefined,
        };
    }).sort((a, b) => {
        // Sort by category first, then by service name
        const catCompare = (a.categoryName || '').localeCompare(b.categoryName || '');
        return catCompare !== 0 ? catCompare : a.serviceName.localeCompare(b.serviceName);
    });
}

/**
 * Reset admin cache (for development/testing)
 */
export function resetAdminCache(): void {
    cachedIsAdmin = null;
    debugLog('Admin cache reset');
}

/**
 * Format response value for display
 */
export function formatResponse(response: string | null): string {
    switch (response) {
        case 'yes':
            return 'Ja';
        case 'maybe':
            return 'Vielleicht';
        case 'no':
            return 'Nein';
        default:
            return '-';
    }
}

export { formatWeekday, formatDateOnly, formatTime, formatTimestamp } from './utils/date';

/**
 * Prepare response rows for display (shared logic for Excel export and Admin table)
 */
export function prepareResponseRows(
    events: EventWithServices[],
    responses: ServicePollEntry[],
    includeEmpty: boolean = false
): import('./types').PreparedResponseRow[] {
    const rows: import('./types').PreparedResponseRow[] = [];
    
    debugLog('Called with:', {
        eventsCount: events.length,
        responsesCount: responses.length,
        includeEmpty,
        firstEvent: events[0] ? { id: events[0].id, name: events[0].name, servicesCount: events[0].services.length } : null
    });
    
    // Create a map for quick lookup
    const responseMap = new Map<string, ServicePollEntry[]>();
    for (const response of responses) {
        const key = `${response.eventId}-${response.serviceId}`;
        if (!responseMap.has(key)) {
            responseMap.set(key, []);
        }
        responseMap.get(key)!.push(response);
    }

    // Build display rows
    for (const event of events) {
        debugLog('Processing event:', event.id, event.name, 'services:', event.services.length);
        for (const service of event.services) {
            const serviceResponses = responseMap.get(`${event.id}-${service.serviceId}`) || [];
            
            debugLog('Event', event.id, 'Service', service.serviceId, service.name, '- responses:', serviceResponses.length);
            
            // Format assignment info
             let assignmentText = '';
             if ((service as any).assignments && (service as any).assignments.length > 0) {
                 const assignment = (service as any).assignments[0];
                 assignmentText = assignment.isConfirmed 
                     ? assignment.personName 
                     : `${assignment.personName} (angefordert)`;
             }

             // Extract room names from event resources
             const roomsText = event.resources && event.resources.length > 0
                 ? event.resources.map((r: any) => r.name).join(', ')
                 : '-';

             if (serviceResponses.length === 0) {
                 if (includeEmpty) {
                     // Add row even if no responses (for Excel export)
                     rows.push({
                         eventName: event.name,
                         weekday: formatWeekday(event.startDate),
                         date: formatDateOnly(event.startDate),
                         time: formatTime(event.startDate),
                         serviceName: service.name,
                         serviceCategoryName: (service as any).categoryName,
                         assignment: assignmentText,
                         rooms: roomsText,
                         userName: '-',
                         response: null,
                         comment: '',
                         timestamp: '',
                         editedBy: undefined,
                         editedAt: undefined,
                         eventId: event.id,
                         serviceId: service.serviceId,
                         userId: 0,
                     });
                 }
             } else {
                 for (const response of serviceResponses) {
                     rows.push({
                         eventName: event.name,
                         weekday: formatWeekday(event.startDate),
                         date: formatDateOnly(event.startDate),
                         time: formatTime(event.startDate),
                         serviceName: service.name,
                         serviceCategoryName: (service as any).categoryName,
                         assignment: assignmentText,
                         rooms: roomsText,
                         userName: response.userName || `User ${response.userId}`,
                         response: response.response,
                         comment: response.comment || '',
                         timestamp: response.timestamp,
                         editedBy: response.editedBy,
                         editedAt: response.editedAt,
                         eventId: response.eventId,
                         serviceId: response.serviceId,
                         userId: response.userId,
                     });
                }
            }
        }
    }
    
    debugLog('Prepared', rows.length, 'rows');
    if (rows.length < 10) {
        debugLog('Sample rows:', rows);
    }

    return rows;
}

/**
 * Get all people who can fill a specific service (by group membership)
 */
export async function getServiceCandidates(
    groupIds: number[]
): Promise<Map<number, string>> {
    const people = new Map<number, string>();
    
    debugLog('Called with groupIds:', groupIds);
    
    if (!groupIds || groupIds.length === 0) {
        debugLog('No group IDs provided');
        return people;
    }
    
    try {
        // Fetch all group members for the service groups
        for (const groupId of groupIds) {
            debugLog('Fetching members for group', groupId);
            const groupMembers = await churchtoolsClient.get<any[]>(
                `/groups/${groupId}/members`
            );
            debugLog('Response for group', groupId, ':', groupMembers);
            
            if (groupMembers && Array.isArray(groupMembers)) {
                debugLog('Found', groupMembers.length, 'members in group', groupId);
                for (const member of groupMembers) {
                    debugLog('Processing member:', member);
                    const personId = member.personId;
                    const personName = member.person?.domainAttributes?.firstName && member.person?.domainAttributes?.lastName
                        ? `${member.person.domainAttributes.firstName} ${member.person.domainAttributes.lastName}`
                        : member.name || member.title || '';
                    
                    debugLog('PersonId:', personId, 'PersonName:', personName);
                    
                    if (personId && personName && !people.has(personId)) {
                        people.set(personId, personName);
                        debugLog('Added person', personId, personName);
                    }
                }
            } else {
                debugLog('No members found or invalid response for group', groupId);
            }
        }
    } catch (error) {
        console.error('[getServiceCandidates] Error fetching group members:', error);
    }
    
    debugLog('Returning', people.size, 'people');
    return people;
}

/**
 * Save a poll response as admin (can set arbitrary user)
 */
export async function saveAdminPollResponse(
    eventId: number,
    serviceId: number,
    userId: number,
    response: PollResponse,
    comment: string,
    userName?: string,
    adminName?: string
): Promise<ServicePollEntry> {
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

        const values = await getCustomDataValues<ServicePollEntry>(
            category.id,
            module.id
        );

        // Find existing response for this event/service/user combination
        const existing = values.find(
            (v) =>
                v.eventId === eventId &&
                v.serviceId === serviceId &&
                v.userId === userId
        );

        const pollEntry: ServicePollEntry = {
            eventId,
            serviceId,
            userId,
            userName,
            response,
            comment,
            timestamp: existing?.timestamp || new Date().toISOString(),
            editedBy: adminName,
            editedAt: new Date().toISOString(),
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

        return pollEntry;
    } catch (error) {
        console.error('Error saving admin poll response:', error);
        throw error;
    }
}
