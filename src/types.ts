/**
 * Types for the Event Service Poll Extension
 */

export type PollResponse = 'yes' | 'maybe' | 'no' | null;

export interface ServicePollEntry {
    eventId: number;
    serviceId: number;
    response: PollResponse;
    comment: string;
    timestamp: string;
}

export interface EventWithServices {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    services: ServiceInfo[];
}

export interface ServiceInfo {
    id: number;
    name: string;
    serviceId: number;
    isValid?: boolean;
}
