const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

console.log('🧪 Starting JSDOM Integration Deep Dive Test...');

// 1. Read files
const engineCode = fs.readFileSync(path.resolve(__dirname, '../DiceEngine.js'), 'utf8');
let html = fs.readFileSync(path.resolve(__dirname, '../DiceRoller.html'), 'utf8');

// Inline DiceEngine.js inside html script tags
html = html.replace('<script src="DiceEngine.js"></script>', `<script>${engineCode}</script>`);

// 2. Initialize JSDOM
const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});
const { window } = dom;
const { document } = window;

// Mock audio and haptics
window.Audio = class {
    constructor() {
        this.volume = 1.0;
    }
    play() { return Promise.resolve(); }
    pause() {}
};
window.navigator.vibrate = () => true;

// Helper to run steps inside onload context
window.addEventListener('load', () => {
    try {
        console.log('✅ JSDOM loaded successfully.');

        // Retrieve engine via window.eval because 'const' does not mount to global window
        const engine = window.eval('engine');
        const changeQueue = window.eval('changeQueue');
        const adjustFlatMod = window.eval('adjustFlatMod');
        const backspaceQueue = window.eval('backspaceQueue');
        const loadQueue = window.eval('loadQueue');

        // Test 1: Verification of Engine instantiation
        console.log('Asserting engine is instantiated and linked...');
        assert.ok(engine, 'engine should be defined');
        assert.strictEqual(engine.queue.length, 0, 'engine queue should start empty');
        console.log('-> Passed.');

        // Test 2: Add node (D20)
        console.log('Testing changeQueue(20, 1)...');
        changeQueue(20, 1);
        assert.strictEqual(engine.queue.length, 1, 'engine queue should contain 1 node');
        const node = engine.queue[0];
        assert.strictEqual(node.nodeType, 'node', 'nodeType should be "node"');
        assert.strictEqual(node.sides, 20, 'sides should be 20');
        assert.strictEqual(node.count, 1, 'count should be 1');
        console.log('-> Passed.');

        // Test 3: Add flat mod
        console.log('Testing adjustFlatMod(5)...');
        adjustFlatMod(5);
        // queue is [1d20, modifier +5] (evaluation inserts implicit '+' operator internally)
        assert.strictEqual(engine.queue.length, 2, 'engine queue should contain 2 nodes');
        assert.strictEqual(engine.queue[0].nodeType, 'node', 'first node is node');
        assert.strictEqual(engine.queue[1].nodeType, 'modifier', 'second node is modifier');
        assert.strictEqual(engine.queue[1].value, 5, 'modifier value is 5');
        console.log('-> Passed.');

        // Test 4: Backspace node
        console.log('Testing backspaceQueue()...');
        backspaceQueue(); // removes +5
        assert.strictEqual(engine.queue.length, 1, 'should remove modifier');
        assert.strictEqual(engine.queue[0].nodeType, 'node', 'remaining node is dice node');
        console.log('-> Passed.');

        // Test 5: Dynamic variable resolution
        console.log('Testing active character variables resolution...');
        // Set characters properties in the local lexical scope
        window.eval("characters[0].variables = { STR: '3', DEX: '1' }");
        window.eval("activeCharacterId = 'primary'");

        // Set predictable RNG (always max)
        engine.setRng((sides) => sides);

        // Build 1d20 + STR (3)
        engine.queue.push({ nodeType: 'operator', operator: '+' });
        engine.queue.push({
            nodeType: 'modifier',
            id: 'mod_str',
            type: 'variable',
            value: 'STR',
            operator: '+',
            multiplierType: 'none',
            multiplierValue: 1,
            divisorType: 'none',
            divisorValue: 1,
            roundMode: 'none'
        });

        const result = engine.calculateRoll();
        // 20 (D20 max) + 3 (STR) = 23
        assert.strictEqual(result.total, 23, 'total calculation should resolve STR variable to 3');
        assert.strictEqual(result.breakdown[1].formula, 'STR', 'breakdown formula name should resolve to STR');
        assert.strictEqual(result.breakdown[1].subtotal, '+3', 'breakdown subtotal should display +3');
        console.log('-> Passed.');

        // Test 6: Legacy Saved loadouts conversion (chipType -> nodeType)
        console.log('Testing loadQueue legacy loader translations...');
        const legacyQueue = {
            id: 999,
            name: "Legacy Loadout",
            color: "#00ffcc",
            unifiedQueue: [
                {
                    chipType: "dice",
                    sides: 6,
                    count: 4
                },
                {
                    chipType: "operator",
                    operator: "+"
                },
                {
                    chipType: "modifier",
                    type: "literal",
                    value: 3,
                    operator: "+"
                }
            ]
        };
        engine.savedQueues = [legacyQueue];
        loadQueue(999);

        assert.strictEqual(engine.queue.length, 3, 'engine queue loaded 3 elements');
        assert.strictEqual(engine.queue[0].nodeType, 'node', 'mapped chipType: "dice" to nodeType: "node"');
        assert.strictEqual(engine.queue[0].chipType, undefined, 'removed old chipType attribute');
        assert.strictEqual(engine.queue[1].nodeType, 'operator', 'mapped operator');
        assert.strictEqual(engine.queue[2].nodeType, 'modifier', 'mapped modifier');
        assert.strictEqual(engine.queue[2].value, 3, 'modifier value remains 3');
        console.log('-> Passed.');

        console.log('\n🎉 ALL INTEGRATION DEEP DIVE TESTS PASSED SUCCESSFULLY! ✅');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ INTEGRATION DEEP DIVE TEST FAILED:');
        console.error(err.message);
        console.error(err.stack);
        process.exit(1);
    }
});
