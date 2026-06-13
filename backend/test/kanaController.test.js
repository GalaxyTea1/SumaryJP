const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const modelPath = path.resolve(__dirname, '../models/kanaProgress.js');
const controllerPath = path.resolve(__dirname, '../controllers/kanaController.js');

test('kanaController.getProgress returns authenticated user kana progress', async () => {
    const KanaProgress = {
        VALID_KANA_TYPES: ['hiragana', 'katakana'],
        VALID_STATUSES: ['learning', 'mastered'],
        getByUserId: async (userId) => [{ userId, kanaType: 'hiragana', character: 'あ', status: 'mastered' }],
    };
    mockModule(modelPath, KanaProgress);
    clearModule(controllerPath);
    const controller = require(controllerPath);

    const res = createRes();
    await controller.getProgress({ user: { id: 7 } }, res);

    assertStatus(res, 200);
    assert.deepEqual(res.body, [{ userId: 7, kanaType: 'hiragana', character: 'あ', status: 'mastered' }]);
});

test('kanaController.updateProgress rejects invalid payloads', async () => {
    const KanaProgress = {
        VALID_KANA_TYPES: ['hiragana', 'katakana'],
        VALID_STATUSES: ['learning', 'mastered'],
        upsert: async () => {
            throw new Error('should not save invalid data');
        },
    };
    mockModule(modelPath, KanaProgress);
    clearModule(controllerPath);
    const controller = require(controllerPath);

    const res = createRes();
    await controller.updateProgress({
        user: { id: 1 },
        body: { kana_type: 'romaji', character: 'a', status: 'mastered' },
    }, res);

    assertStatus(res, 400);
});

test('kanaController.updateProgress saves valid progress', async () => {
    const KanaProgress = {
        VALID_KANA_TYPES: ['hiragana', 'katakana'],
        VALID_STATUSES: ['learning', 'mastered'],
        upsert: async (userId, kanaType, character, status) => ({ userId, kanaType, character, status }),
    };
    mockModule(modelPath, KanaProgress);
    clearModule(controllerPath);
    const controller = require(controllerPath);

    const res = createRes();
    await controller.updateProgress({
        user: { id: 9 },
        body: { kana_type: 'katakana', character: 'ア', status: 'learning' },
    }, res);

    assertStatus(res, 200);
    assert.deepEqual(res.body, { userId: 9, kanaType: 'katakana', character: 'ア', status: 'learning' });
});
