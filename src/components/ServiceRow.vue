<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import { savePollResponse } from '../pollService';
import { createLogger } from '../utils/logger';
import type {
    ServiceInfo,
    ServicePollEntry,
    PollResponse,
    UserInfo,
} from '../types';

const COMMENT_DEBOUNCE_MS = 1000;
const STATUS_MESSAGE_DURATION_MS = 2000;

const debugLog = createLogger('SERVICE-ROW');
const toast = useToast();

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
const showCommentForm = ref(false);

// Debounce timer for comment
let commentTimeout: ReturnType<typeof setTimeout> | null = null;

// Watch for external changes to userResponse
watch(
    () => props.userResponse,
    (newVal) => {
        if (newVal) {
            selectedResponse.value = newVal.response;
            comment.value = newVal.comment;
            showCommentForm.value = false;
        } else {
            selectedResponse.value = null;
            comment.value = '';
            showCommentForm.value = false;
        }
    },
    { immediate: true }
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
        return { text: '', severity: 'secondary' as const };
    }
    const assignment = props.service.assignments[0];
    const statusText = assignment.isConfirmed ? ' (Zugesagt)' : ' (Angefordert)';
    return {
        text: assignment.personName + statusText,
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
    showCommentForm.value = false;
    await saveResponse();
}

async function saveResponse() {
    saving.value = true;

    try {
        await savePollResponse(
            props.eventId,
            props.service.serviceId,
            selectedResponse.value,
            comment.value
        );

        const entry: ServicePollEntry = {
            eventId: props.eventId,
            serviceId: props.service.serviceId,
            userId: props.currentUser.id,
            userName: props.currentUser.name,
            response: selectedResponse.value,
            comment: comment.value,
            timestamp: new Date().toISOString(),
        };

        emit('response-saved', entry);
        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: 'Antwort wurde gespeichert.',
            life: STATUS_MESSAGE_DURATION_MS,
        });
    } catch (e) {
        debugLog('Error saving response:', e);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Antwort konnte nicht gespeichert werden.',
            life: STATUS_MESSAGE_DURATION_MS,
        });
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
    }, COMMENT_DEBOUNCE_MS);
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
            <span v-if="service.categoryName" class="service-category">{{ service.categoryName }}</span>
        </td>
        <td class="response-buttons">
            <div class="button-group">
                <Button
                     icon="pi pi-check"
                     label="Ja"
                     :severity="selectedResponse === 'yes' ? undefined : 'secondary'"
                     :outlined="selectedResponse !== 'yes'"
                     class="btn-yes"
                     :class="{ active: selectedResponse === 'yes' }"
                     @click="handleResponse('yes')"
                     :loading="saving && selectedResponse === 'yes'"
                     v-tooltip="'Ich bin verfügbar'"
                 />
                 <Button
                     icon="pi pi-question"
                     label="Vllt"
                     :severity="selectedResponse === 'maybe' ? 'warn' : 'secondary'"
                     :outlined="selectedResponse !== 'maybe'"
                     class="btn-maybe"
                     :class="{ active: selectedResponse === 'maybe' }"
                     @click="handleResponse('maybe')"
                     :loading="saving && selectedResponse === 'maybe'"
                     v-tooltip="'Ich bin eventuell verfügbar'"
                 />
                 <Button
                     icon="pi pi-times"
                     label="Nein"
                     :severity="selectedResponse === 'no' ? 'danger' : 'secondary'"
                     :outlined="selectedResponse !== 'no'"
                     class="btn-no"
                     :class="{ active: selectedResponse === 'no' }"
                     @click="handleResponse('no')"
                     :loading="saving && selectedResponse === 'no'"
                     v-tooltip="'Ich bin nicht verfügbar'"
                 />
                 <Button
                     icon="pi pi-pencil"
                     text
                     severity="info"
                     class="btn-comment"
                     @click="showCommentForm = true"
                     v-tooltip="'Kommentar hinzufügen oder bearbeiten'"
                 />
                 <Button
                     icon="pi pi-trash"
                     severity="danger"
                     text
                     class="btn-delete"
                     @click="withdrawResponse"
                     :loading="saving"
                     :disabled="!selectedResponse && !comment"
                     v-tooltip="'Antwort und Kommentar löschen'"
                 />
            </div>
            <Textarea
                v-if="comment || showCommentForm"
                v-model="comment"
                placeholder="Kommentar..."
                rows="2"
                autoResize
                class="comment-input"
                @input="handleCommentInput"
                @blur="showCommentForm = comment.trim().length > 0"
            />
        </td>
        <td class="assignment">
            <Tag
                :value="assignmentDisplay.text"
                :severity="assignmentDisplay.severity"
                :icon="assignmentDisplay.icon ? `pi ${assignmentDisplay.icon}` : undefined"
            />
        </td>
        <td class="other-responses">
            <div v-if="!service.votesVisible" class="votes-hidden-message">
                <i class="pi pi-eye-slash"></i>
                <span>Votes verborgen</span>
            </div>
            <template v-else>
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
            </template>
        </td>
    </tr>

    <!-- Card layout (mobile) -->
    <div v-else class="service-card">
        <div class="service-card-header">
            <div>
                <strong>{{ service.name }}</strong>
                <span v-if="service.categoryName" class="service-category">{{ service.categoryName }}</span>
            </div>
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
                 :class="{ active: selectedResponse === 'yes' }"
                 @click="handleResponse('yes')"
                 :loading="saving && selectedResponse === 'yes'"
                 v-tooltip="'Ich bin verfügbar'"
             />
             <Button
                 icon="pi pi-question"
                 label="Vllt"
                 :severity="selectedResponse === 'maybe' ? 'warn' : 'secondary'"
                 :outlined="selectedResponse !== 'maybe'"
                 class="btn-maybe"
                 :class="{ active: selectedResponse === 'maybe' }"
                 @click="handleResponse('maybe')"
                 :loading="saving && selectedResponse === 'maybe'"
                 v-tooltip="'Ich bin eventuell verfügbar'"
             />
             <Button
                 icon="pi pi-times"
                 label="Nein"
                 :severity="selectedResponse === 'no' ? 'danger' : 'secondary'"
                 :outlined="selectedResponse !== 'no'"
                 class="btn-no"
                 :class="{ active: selectedResponse === 'no' }"
                 @click="handleResponse('no')"
                 :loading="saving && selectedResponse === 'no'"
                 v-tooltip="'Ich bin nicht verfügbar'"
             />
             <Button
                 icon="pi pi-pencil"
                 text
                 severity="info"
                 class="btn-comment"
                 @click="showCommentForm = true"
                 v-tooltip="'Kommentar hinzufügen oder bearbeiten'"
             />
             <Button
                 icon="pi pi-trash"
                 severity="danger"
                 text
                 class="btn-delete"
                 @click="withdrawResponse"
                 :loading="saving"
                 :disabled="!selectedResponse && !comment"
                 v-tooltip="'Antwort und Kommentar löschen'"
             />
         </div>

        <Textarea
            v-if="comment || showCommentForm"
            v-model="comment"
            placeholder="Kommentar..."
            rows="3"
            autoResize
            class="comment-input mobile"
            @input="handleCommentInput"
            @blur="showCommentForm = comment.trim().length > 0"
        />

        <div class="other-responses mobile">
            <div v-if="!service.votesVisible" class="votes-hidden-message">
                <i class="pi pi-eye-slash"></i>
                Votes verborgen
            </div>
            <template v-else>
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
            </template>
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

.response-buttons {
    flex-shrink: 0;
}

.service-name {
    width: 110px;
    min-width: 110px;
    word-wrap: break-word;
    word-break: break-word;
    font-weight: bold;
}

.service-category {
    display: block;
    font-size: 0.75rem;
    font-weight: normal;
}

.button-group {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    align-items: center;
}

.button-group .p-button {
    flex: 1;
}

.btn-comment {
    margin-left: auto;
    padding: 0.25rem !important;
    min-width: auto !important;
}

.btn-delete {
    margin-left: 12px;
    padding: 0.25rem !important;
    min-width: auto !important;
}

.btn-yes {
    color: #4caf50;
}

.btn-yes.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
    color: #000 !important;
}

.btn-yes.active :deep(*) {
    color: #000 !important;
}

.btn-yes:hover {
    background-color: rgba(76, 175, 80, 0.1) !important;
}

.btn-maybe {
    color: #ff9800;
}

.btn-maybe.active {
    background-color: #ff9800 !important;
    border-color: #ff9800 !important;
    color: #000 !important;
}

.btn-maybe.active :deep(*) {
    color: #000 !important;
}

.btn-maybe:hover {
    background-color: rgba(255, 152, 0, 0.1) !important;
}

.btn-no {
    color: #f44336;
}

.btn-no.active {
    background-color: #f44336 !important;
    border-color: #f44336 !important;
    color: #000 !important;
}

.btn-no.active :deep(*) {
    color: #000 !important;
}

.btn-no:hover {
    background-color: rgba(244, 67, 54, 0.1) !important;
}

.btn-comment {
    min-width: 44px;
}

.comment-input {
    width: 100%;
    font-size: 0.875rem;
    resize: vertical;
}

.assignment {
    width: 150px;
    min-width: 150px;
    word-wrap: break-word;
    word-break: break-word;
}

.other-responses {
    font-size: 0.875rem;
    color: #666;
    vertical-align: top;
    width: 300px;
    min-width: 300px;
    max-width: 300px;
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
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
}

.service-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 4px;
    flex-wrap: wrap;
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

.votes-hidden-message {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #999;
    font-style: italic;
    font-size: 0.875rem;
}

.votes-hidden-message i {
    font-size: 0.875rem;
}
</style>
