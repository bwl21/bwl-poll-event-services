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
    services: ServiceInfo[];
}

export interface ServiceInfo {
    id: number;
    name: string;
    serviceId: number;
    sortKey?: number;
    isValid?: boolean;
    assignments?: ServiceAssignment[];
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
}
