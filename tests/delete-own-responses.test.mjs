import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Run the actual functions with in-memory dependencies, without loading the
// ChurchTools client, credentials, or production data.
function loadFunction(path, name, dependencies) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const script = path.endsWith('.vue')
        ? source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
        : source;
    const file = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true);
    const declaration = file.statements.find(
        (node) => ts.isFunctionDeclaration(node) && node.name?.text === name
    );
    assert.ok(declaration, `Missing function ${name}`);
    const code = ts.transpileModule(
        declaration.getText(file).replace(/^export\s+/, '')
            .replaceAll('import.meta.env.VITE_KEY', 'undefined'),
        { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
    ).outputText;
    return new Function(...Object.keys(dependencies), `${code}\nreturn ${name};`)(
        ...Object.values(dependencies)
    );
}

const responses = [
    { id: 1, eventId: 100, userId: 10, serviceId: 1 },
    { id: 2, eventId: 100, userId: 20, serviceId: 1 },
    { id: 3, eventId: 200, userId: 10, serviceId: 1 },
    { id: 4, eventId: 100, userId: 10, serviceId: 2 },
    { id: 5, eventId: 100, serviceId: 3 },
];

function setup(getCurrentUser = async () => ({ id: 10 })) {
    const deleted = [];
    const remove = loadFunction('../src/pollService.ts', 'deleteOwnResponsesForEvent', {
        getCurrentUser,
        getPollCategory: async () => ({ id: 8 }),
        getOrCreateModule: async () => ({ id: 9 }),
        getCustomDataValues: async () => responses,
        deleteCustomDataValue: async (_category, id) => deleted.push(id),
        debugLog: () => {},
        console: { error: () => {} },
    });
    return { remove, deleted };
}

test('deletes only own responses for the selected event, across services', async () => {
    const { remove, deleted } = setup();
    assert.equal(await remove(100), 2);
    assert.deepEqual(deleted, [1, 4]);
});

test('does not delete anything for an event without own responses', async () => {
    const { remove, deleted } = setup();
    assert.equal(await remove(300), 0);
    assert.deepEqual(deleted, []);
});

test('does not delete anything if the current user cannot be identified', async () => {
    for (const getUser of [async () => ({}), async () => { throw new Error('Not authenticated'); }]) {
        const { remove, deleted } = setup(getUser);
        await assert.rejects(remove(100));
        assert.deepEqual(deleted, []);
    }
});

test('keeps other users and other events in the displayed responses', () => {
    const allResponses = { value: [...responses] };
    const handle = loadFunction('../src/App.vue', 'handleResponsesDeleted', {
        allResponses,
        debugLog: () => {},
        toast: { add: () => {} },
    });
    handle(100, 10, 2);
    assert.deepEqual(allResponses.value.map(({ id }) => id), [2, 3, 5]);
});
