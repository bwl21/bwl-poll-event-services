/**
 * Types for the Event Service Poll Extension
 */

export type PollResponse = 'yes' | 'maybe' | 'no' | null;

export interface ServicePollEntry {
    id?: number; // KV-Store ID
    eventId: number;
    serviceId: number;
    userId: number;
    userName?: string; // For display purposes
    response: PollResponse;
    comment: string;
    timestamp: string;
    editedBy?: string; // Person who edited (admin), if not the user themselves
    editedAt?: string; // When it was last edited
}

export interface EventResource {
    name: string;
}

export interface EventWithServices {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    resources?: EventResource[];
    resourcesUnavailable?: boolean;
    services: ServiceInfo[];
}

export interface ServiceInfo {
    id: number;
    name: string;
    serviceId: number;
    categoryName?: string;
    sortKey?: number;
    isValid?: boolean;
    assignments?: ServiceAssignment[];
    votesVisible?: boolean;
    groupIds?: number[]; // Service group IDs for finding eligible people
}

export interface ServiceAssignment {
    personId: number;
    personName: string;
    isConfirmed: boolean; // true = confirmed, false = requested
}

export interface UserInfo {
    id: number;
    name: string;
}

export interface PreparedResponseRow {
    eventName: string;
    weekday: string;
    date: string;
    time: string;
    serviceName: string;
    serviceCategoryName?: string;
    assignment: string;
    rooms: string; // Comma-separated list of room names
    userName: string;
    response: string | null;
    comment: string;
    timestamp: string;
    editedBy?: string; // Person who edited (admin), if not the user themselves
    editedAt?: string; // When it was last edited
    // Original data for deletion/reference
    eventId: number;
    serviceId: number;
    userId: number;
}

export interface FetchEventsResult {
    events: EventWithServices[];
}

export interface PollConfig {
    startDate: string;
    days: number;
}

/**
 * Admin Service Configuration
 */
export interface AdminServiceConfig {
    id?: number; // KV-Store ID
    serviceId: number;
    serviceName?: string;
    votesVisible: boolean;
    enabled: boolean; // Whether the service should be displayed in polls
}
