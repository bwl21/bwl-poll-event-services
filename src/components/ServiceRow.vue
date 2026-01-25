<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import { savePollResponse } from '../pollService';
import type {
    ServiceInfo,
    ServicePollEntry,
    PollResponse,
    UserInfo,
} from '../types';

const props = defineProps<{
    eventId: number;
    service: ServiceInfo;
    userResponse?: ServicePollEntry;
    otherResponses: ServicePollEntry[];
    currentUser: UserInfo;
    layout: 'table' | 'card';
}>();

const emit = defineEmits<{
    (e: 'response-saved', entry: ServicePollEntry): void;
}>();

const selectedResponse = ref<PollResponse>(props.userResponse?.response || null);
const comment = ref(props.userResponse?.comment || '');
const saving = ref(false);
const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

// Debounce timer for comment
let commentTimeout: ReturnType<typeof setTimeout> | null = null;

// Watch for external changes to userResponse
watch(
    () => props.userResponse,
    (newVal) => {
        if (newVal) {
            selectedResponse.value = newVal.response;
            comment.value = newVal.comment;
        }
    }
);

const yesResponses = computed(() =>
    props.otherResponses.filter((r) => r.response === 'yes')
);
const maybeResponses = computed(() =>
    props.otherResponses.filter((r) => r.response === 'maybe')
);
const noResponses = computed(() =>
    props.otherResponses.filter((r) => r.response === 'no')
);

const assignmentDisplay = computed(() => {
    if (!props.service.assignments || props.service.assignments.length === 0) {
        return { text: 'Offen', severity: 'secondary' as const };
    }
    const assignment = props.service.assignments[0];
    return {
        text: assignment.personName,
        severity: assignment.isConfirmed
            ? ('success' as const)
            : ('warn' as const),
        icon: assignment.isConfirmed ? 'pi-check' : 'pi-question',
    };
});

async function handleResponse(response: PollResponse) {
    selectedResponse.value = response;
    await saveResponse();
}

async function withdrawResponse() {
    selectedResponse.value = null;
    comment.value = '';
    await saveResponse();
}

async function saveResponse() {
    saving.value = true;
    statusMessage.value = null;

    try {
        await savePollResponse(
            props.eventId,
            props.service.id,
            selectedResponse.value,
            comment.value
        );

        const entry: ServicePollEntry = {
            eventId: props.eventId,
            serviceId: props.service.id,
            userId: props.currentUser.id,
            userName: props.currentUser.name,
            response: selectedResponse.value,
            comment: comment.value,
            timestamp: new Date().toISOString(),
        };

        emit('response-saved', entry);
        statusMessage.value = { type: 'success', text: 'Gespeichert' };

        setTimeout(() => {
            statusMessage.value = null;
        }, 2000);
    } catch (e) {
        console.error('Error saving response:', e);
        statusMessage.value = { type: 'error', text: 'Fehler beim Speichern' };
    } finally {
        saving.value = false;
    }
}

function handleCommentInput() {
    if (commentTimeout) {
        clearTimeout(commentTimeout);
    }
    commentTimeout = setTimeout(async () => {
        await saveResponse();
    }, 1000);
}

function formatResponseList(responses: ServicePollEntry[]): string {
    return responses.map((r) => r.userName || `User ${r.userId}`).join(', ');
}

function getCommentsWithNames(responses: ServicePollEntry[]): { name: string; comment: string }[] {
    return responses
        .filter((r) => r.comment && r.comment.trim())
        .map((r) => ({
            name: r.userName || `User ${r.userId}`,
            comment: r.comment,
        }));
}

const allComments = computed(() => {
    return getCommentsWithNames(props.otherResponses);
});
</script>

<template>
    <!-- Table row layout (desktop) -->
    <tr v-if="layout === 'table'" class="service-row">
        <td class="service-name">
            <strong>{{ service.name }}</strong>
        </td>
        <td class="response-buttons">
            <div class="button-group">
                <Button
                    icon="pi pi-check"
                    :label="layout === 'table' ? '' : 'Ja'"
                    :severity="selectedResponse === 'yes' ? undefined : 'secondary'"
                    :outlined="selectedResponse !== 'yes'"
                    class="btn-yes"
                    :class="{ active: selectedResponse === 'yes' }"
                    @click="handleResponse('yes')"
                    :loading="saving && selectedResponse === 'yes'"
                    v-tooltip.top="'Ja'"
                />
                <Button
                    icon="pi pi-question"
                    :severity="selectedResponse === 'maybe' ? 'warn' : 'secondary'"
                    :outlined="selectedResponse !== 'maybe'"
                    class="btn-maybe"
                    :class="{ active: selectedResponse === 'maybe' }"
                    @click="handleResponse('maybe')"
                    :loading="saving && selectedResponse === 'maybe'"
                    v-tooltip.top="'Vielleicht'"
                />
                <Button
                    icon="pi pi-times"
                    :severity="selectedResponse === 'no' ? 'danger' : 'secondary'"
                    :outlined="selectedResponse !== 'no'"
                    class="btn-no"
                    :class="{ active: selectedResponse === 'no' }"
                    @click="handleResponse('no')"
                    :loading="saving && selectedResponse === 'no'"
                    v-tooltip.top="'Nein'"
                />
                <Button
                    v-if="selectedResponse"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    outlined
                    @click="withdrawResponse"
                    :loading="saving"
                    v-tooltip.top="'Antwort zurückziehen'"
                />
            </div>
            <Textarea
                v-model="comment"
                placeholder="Kommentar"
                rows="1"
                autoResize
                class="comment-input"
                @input="handleCommentInput"
            />
            <small v-if="statusMessage" :class="['status-msg', statusMessage.type]">
                {{ statusMessage.text }}
            </small>
        </td>
        <td class="assignment">
            <Tag
                :value="assignmentDisplay.text"
                :severity="assignmentDisplay.severity"
                :icon="assignmentDisplay.icon ? `pi ${assignmentDisplay.icon}` : undefined"
            />
        </td>
        <td class="other-responses">
            <div v-if="yesResponses.length" class="response-group yes">
                <i class="pi pi-check"></i>
                <span>{{ formatResponseList(yesResponses) }}</span>
            </div>
            <div v-if="maybeResponses.length" class="response-group maybe">
                <i class="pi pi-question"></i>
                <span>{{ formatResponseList(maybeResponses) }}</span>
            </div>
            <div v-if="noResponses.length" class="response-group no">
                <i class="pi pi-times"></i>
                <span>{{ formatResponseList(noResponses) }}</span>
            </div>
            <div v-for="c in allComments" :key="c.name" class="other-comment">
                <i class="pi pi-comment"></i>
                <span>{{ c.name }}: "{{ c.comment }}"</span>
            </div>
            <div
                v-if="!yesResponses.length && !maybeResponses.length && !noResponses.length"
                class="no-responses"
            >
                -
            </div>
        </td>
    </tr>

    <!-- Card layout (mobile) -->
    <div v-else class="service-card">
        <div class="service-card-header">
            <strong>{{ service.name }}</strong>
            <Tag
                :value="assignmentDisplay.text"
                :severity="assignmentDisplay.severity"
                :icon="assignmentDisplay.icon ? `pi ${assignmentDisplay.icon}` : undefined"
                size="small"
            />
        </div>

        <div class="button-group mobile">
            <Button
                icon="pi pi-check"
                label="Ja"
                :severity="selectedResponse === 'yes' ? undefined : 'secondary'"
                :outlined="selectedResponse !== 'yes'"
                class="btn-yes"
                @click="handleResponse('yes')"
                :loading="saving && selectedResponse === 'yes'"
            />
            <Button
                icon="pi pi-question"
                label="Vllt"
                :severity="selectedResponse === 'maybe' ? 'warn' : 'secondary'"
                :outlined="selectedResponse !== 'maybe'"
                class="btn-maybe"
                @click="handleResponse('maybe')"
                :loading="saving && selectedResponse === 'maybe'"
            />
            <Button
                icon="pi pi-times"
                label="Nein"
                :severity="selectedResponse === 'no' ? 'danger' : 'secondary'"
                :outlined="selectedResponse !== 'no'"
                class="btn-no"
                @click="handleResponse('no')"
                :loading="saving && selectedResponse === 'no'"
            />
            <Button
                v-if="selectedResponse"
                icon="pi pi-trash"
                label="Zurückziehen"
                severity="danger"
                @click="withdrawResponse"
                :loading="saving"
                class="btn-withdraw"
            />
        </div>

        <Textarea
            v-model="comment"
            placeholder="Kommentar (optional)"
            rows="2"
            autoResize
            class="comment-input mobile"
            @input="handleCommentInput"
        />

        <small v-if="statusMessage" :class="['status-msg', statusMessage.type]">
            {{ statusMessage.text }}
        </small>

        <div class="other-responses mobile">
            <div v-if="yesResponses.length" class="response-group yes">
                <i class="pi pi-check"></i>
                {{ formatResponseList(yesResponses) }}
            </div>
            <div v-if="maybeResponses.length" class="response-group maybe">
                <i class="pi pi-question"></i>
                {{ formatResponseList(maybeResponses) }}
            </div>
            <div v-if="noResponses.length" class="response-group no">
                <i class="pi pi-times"></i>
                {{ formatResponseList(noResponses) }}
            </div>
            <div v-for="c in allComments" :key="c.name" class="other-comment">
                <i class="pi pi-comment"></i>
                {{ c.name }}: "{{ c.comment }}"
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Table row styles */
.service-row td {
    padding: 12px 8px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
}

.service-name {
    min-width: 150px;
}

.button-group {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
}

.btn-yes.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
}

.btn-maybe.active {
    background-color: #ff9800 !important;
    border-color: #ff9800 !important;
}

.btn-no.active {
    background-color: #f44336 !important;
    border-color: #f44336 !important;
}

.comment-input {
    width: 100%;
    max-width: 200px;
    font-size: 0.875rem;
}

.status-msg {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
}

.status-msg.success {
    color: #4caf50;
}

.status-msg.error {
    color: #f44336;
}

.assignment {
    white-space: nowrap;
}

.other-responses {
    font-size: 0.875rem;
    color: #666;
}

.response-group {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
}

.response-group.yes i {
    color: #4caf50;
}

.response-group.maybe i {
    color: #ff9800;
}

.response-group.no i {
    color: #f44336;
}

.other-comment {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
    margin-top: 4px;
}

.other-comment i {
    color: #999;
    margin-right: 4px;
}

.no-responses {
    color: #ccc;
}

/* Card styles (mobile) */
.service-card {
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
}

.service-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.button-group.mobile {
    margin-bottom: 12px;
}

.button-group.mobile .p-button {
    flex: 1;
    min-height: 44px;
}

.comment-input.mobile {
    width: 100%;
    max-width: none;
    margin-bottom: 8px;
}

.other-responses.mobile {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
}
</style>
