const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

console.log('🧪 Starting JSDOM Integration Deep Dive Test...');

// 1. Read files
const engineCode = fs.readFileSync(path.resolve(__dirname, '../DiceEngine.js'), 'utf8');
const archCode = fs.readFileSync(path.resolve(__dirname, '../DataArchitecture.js'), 'utf8');
const templatesCode = fs.readFileSync(path.resolve(__dirname, '../Assets/TemplatesData.js'), 'utf8');
let html = fs.readFileSync(path.resolve(__dirname, '../DiceRoller.html'), 'utf8');

// Inline scripts inside html script tags
html = html.replace('<script src="Assets/TemplatesData.js"></script>', `<script>${templatesCode}</script>`);
html = html.replace('<script src="DataArchitecture.js"></script>', `<script>${archCode}</script>`);
html = html.replace('<script src="DiceEngine.js"></script>', `<script>${engineCode}</script>`);

// 2. Initialize JSDOM
const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously"
});
const { window } = dom;
const { document } = window;

// Load Rimas.json for JSDOM third-party import test
const rimasJson = fs.readFileSync(path.resolve(__dirname, '../temp assets/Rimas.json'), 'utf8');
window.rimasJsonStr = rimasJson;

// Load Horlabo.json for JSDOM third-party import test
const horlaboJson = fs.readFileSync(path.resolve(__dirname, '../temp assets/Horlabo.json'), 'utf8');
window.horlaboJsonStr = horlaboJson;

// Mock audio and haptics
window.Audio = class {
    constructor() {
        this.volume = 1.0;
    }
    play() { return Promise.resolve(); }
    pause() {}
};
window.navigator.vibrate = () => true;
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

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

        // Test 7: Zero-state and deletion verification
        console.log('Testing character and campaign deletion into zero-state...');
        window.eval(`
            (async () => {
                showModal = () => Promise.resolve(true);
                
                // Set characters to have one character
                characters = [{ id: 'char_temp', name: 'Temp', dndType: 'standard', campaignId: 'default_campaign' }];
                activeCharacterId = 'char_temp';
                
                // Delete
                removeCharacter();
                // Since showModal returns a promise, wait a frame
                await new Promise(r => setTimeout(r, 10));
                
                if (characters.length !== 0) throw new Error("characters array should be empty");
                if (activeCharacterId !== null) throw new Error("activeCharacterId should be null");
                
                // Let's test campaign deletion
                campaigns = [{ id: 'camp_temp', name: 'Temp Campaign' }];
                activeCampaignId = 'camp_temp';
                
                deleteCampaignFromBinder('camp_temp');
                await new Promise(r => setTimeout(r, 10));
                
                if (campaigns.length !== 0) throw new Error("campaigns array should be empty");
                if (activeCampaignId !== null) throw new Error("activeCampaignId should be null");

                // Test 8: Template spawning, cloning, and template creation
                console.log('Testing template spawning, cloning, and template creation...');
                
                campaigns = [{ id: 'camp_test', name: 'Test Campaign' }];
                activeCampaignId = 'camp_test';
                characters = [];
                activeCharacterId = null;
                groups = [];
                engine.savedQueues = [];
                
                loadTemplates();
                if (templates.length < 2) throw new Error("Templates should load default templates");
                
                showModal = (opts) => {
                    if (opts.title === 'Spawn Instance') {
                        return Promise.resolve('Spawned Character');
                    }
                    if (opts.title === 'Clone Sheet') {
                        return Promise.resolve('Cloned Character');
                    }
                    if (opts.title === 'Save as Template') {
                        return Promise.resolve('Custom Saved Template');
                    }
                    if (opts.title === 'Reset Stats?') {
                        return Promise.resolve(true);
                    }
                    return Promise.resolve(true);
                };
                
                await spawnTemplateInstance('template_sd_character');
                if (characters.length !== 1) throw new Error("Should have 1 character after spawn");
                if (characters[0].name !== 'Spawned Character') throw new Error("Character name should match input");
                if (characters[0].variables.STR !== '10') throw new Error("Variables should be initialized");
                
                const sdTemplate = templates.find(t => t.id === 'template_sd_character');
                const expectedGroupsCount = sdTemplate.groups.length;
                const expectedWidgetsCount = sdTemplate.widgets.length;

                const spawnedGroups = groups.filter(g => g.characterId === activeCharacterId);
                if (spawnedGroups.length !== expectedGroupsCount) throw new Error("Should have " + expectedGroupsCount + " groups created, got " + spawnedGroups.length);
                
                const spawnedWidgets = engine.savedQueues.filter(w => w.characterId === activeCharacterId);
                if (spawnedWidgets.length !== expectedWidgetsCount) throw new Error("Should have " + expectedWidgetsCount + " widgets spawned, got " + spawnedWidgets.length);
                
                const originalCharId = activeCharacterId;
                await cloneCharacter(originalCharId);
                if (characters.length !== 2) throw new Error("Should have 2 characters after cloning");
                if (activeCharacterId === originalCharId) throw new Error("Active character should switch to clone");
                if (characters.find(c => c.id === activeCharacterId).name !== 'Cloned Character') throw new Error("Cloned character name incorrect");
                
                const clonedGroups = groups.filter(g => g.characterId === activeCharacterId);
                if (clonedGroups.length !== expectedGroupsCount) throw new Error("Cloned groups count incorrect");
                if (clonedGroups[0].id === spawnedGroups[0].id) throw new Error("Cloned groups should have new IDs");
                
                const clonedWidgets = engine.savedQueues.filter(w => w.characterId === activeCharacterId);
                if (clonedWidgets.length !== expectedWidgetsCount) throw new Error("Cloned widgets count incorrect");
                
                // Verify direct renaming via renameActiveCharacter
                renameActiveCharacter('Direct Input Renamed Name');
                if (characters.find(c => c.id === activeCharacterId).name !== 'Direct Input Renamed Name') {
                    throw new Error("Character rename via direct input failed");
                }

                // Verify that removing the last group triggers automatic creation of a Default group
                const activeCharGroups = groups.filter(g => g.characterId === activeCharacterId);
                
                // Let's delete all active character groups
                groups = groups.filter(g => g.characterId !== activeCharacterId);
                
                // Trigger renderGroupTabs to process recovery
                renderGroupTabs();
                
                const recoveredGroups = groups.filter(g => g.characterId === activeCharacterId);
                if (recoveredGroups.length !== 1) {
                    throw new Error("Deleting the last group should automatically recreate 1 Default group");
                }
                if (recoveredGroups[0].name !== 'Default') {
                    throw new Error("Recreated group name should be 'Default'");
                }
                // Test 9: STR Modifier and STR Check update dynamically
                console.log('Testing STR Modifier and STR Check dynamic updates...');
                // Let's spawn another clean character sheet
                await spawnTemplateInstance('template_sd_character');
                // The spawned character is now active. Let's find its widgets.
                const charW = engine.savedQueues.filter(w => w.characterId === activeCharacterId);
                const strScoreW = charW.find(w => w.name === 'STR Score');
                const strModW = charW.find(w => w.name === 'STR Modifier');
                const strCheckW = charW.find(w => w.name === 'Strength Check');

                if (!strScoreW || !strModW || !strCheckW) {
                    throw new Error("Could not find STR Score, STR Modifier, or Strength Check widgets");
                }

                // Initial value assertions
                if (strScoreW.value !== 10) throw new Error('Initial STR Score should be 10, got ' + strScoreW.value);
                if (strModW.value !== 0) throw new Error('Initial STR Modifier should be 0, got ' + strModW.value);

                // Check that getActiveCharacterVariable returns correct values
                if (window.getActiveCharacterVariable('STR') !== 10) throw new Error('vars.STR should be 10, got ' + window.getActiveCharacterVariable('STR'));
                if (window.getActiveCharacterVariable('STR_mod') !== 0) throw new Error('vars.STR_mod should be 0, got ' + window.getActiveCharacterVariable('STR_mod'));

                // Change STR Score to 15
                changeNumberValueDirect(strScoreW.id, 15);

                // Let's verify widget values and variable lookup
                if (window.getActiveCharacterVariable('STR') !== 15) throw new Error('vars.STR should be 15 after update, got ' + window.getActiveCharacterVariable('STR'));
                if (window.getActiveCharacterVariable('STR_mod') !== 2) throw new Error('vars.STR_mod should be 2 after STR Score is 15, got ' + window.getActiveCharacterVariable('STR_mod'));

                // Verify that w_mod_str widget value got updated to 2
                if (strModW.value !== 2) throw new Error('STR Modifier widget value should update to 2, got ' + strModW.value);

                // Let's check the DOM elements inside JSDOM!
                // The widgets list is rendered into '.saved-queues-list'
                // Let's look for the formula/resolved display of the STR Check widget
                const strCheckEl = document.querySelector('.saved-item[data-id="' + strCheckW.id + '"]');
                if (!strCheckEl) {
                    throw new Error("Could not find STR Check DOM element");
                }
                const formulaText = strCheckEl.querySelector('.widget-formula').textContent;
                console.log('STR Check Formula display text in DOM:', formulaText);
                if (!formulaText.includes('(+2)') && !formulaText.includes('+2')) {
                    throw new Error("Strength Check formula text in DOM did not update: " + formulaText);
                }

                // Test 10: Refactored armor/shield to numbers & passive modifiers
                console.log('Testing refactored armor/shield numbers & passive modifiers...');
                const activeCharW = engine.savedQueues.filter(w => w.characterId === activeCharacterId);
                const armorW = activeCharW.find(w => w.name === 'Unarmored');
                const shieldW = activeCharW.find(w => w.name === 'Shield');
                const acW = activeCharW.find(w => w.name === 'Armor Class');

                if (!armorW || !shieldW || !acW) {
                    throw new Error("Could not find Unarmored, Shield, or Armor Class widgets");
                }

                if (armorW.widgetType !== 'number') throw new Error('Unarmored widgetType should be number, got ' + armorW.widgetType);
                if (shieldW.widgetType !== 'number') throw new Error('Shield widgetType should be number, got ' + shieldW.widgetType);

                // Initial AC verification
                // DEX is 10 by default in standard templates (DEX_mod is 0)
                const dexMod = window.getActiveCharacterVariable('DEX_mod') || 0;
                if (window.getActiveCharacterVariable('AC_Armor') !== 10 + dexMod) throw new Error('Initial AC_Armor should be 10 + DEX_mod, got ' + window.getActiveCharacterVariable('AC_Armor'));
                if (window.getActiveCharacterVariable('AC_Shield') !== 0) throw new Error('Initial AC_Shield should be 0 because Shield is unequipped, got ' + window.getActiveCharacterVariable('AC_Shield'));
                if (window.getActiveCharacterVariable('AC') !== 10 + dexMod) throw new Error('Initial AC should be AC_Armor + AC_Shield, got ' + window.getActiveCharacterVariable('AC'));

                // Equip Shield
                toggleCardAddonState(shieldW.id, true);
                if (window.getActiveCharacterVariable('AC_Shield') !== 2) throw new Error('AC_Shield should be 2 after Shield is equipped, got ' + window.getActiveCharacterVariable('AC_Shield'));
                if (window.getActiveCharacterVariable('AC') !== 10 + dexMod + 2) throw new Error('AC should update to 12 + DEX_mod, got ' + window.getActiveCharacterVariable('AC'));

                // Create a Longsword widget with passive modifiers
                const swordId = 'w_sword_' + Date.now();
                const swordW = {
                    id: swordId,
                    characterId: activeCharacterId,
                    name: 'Longsword',
                    widgetType: 'roller',
                    addonToggle: {
                        checked: false,
                        labelOn: 'Equipped',
                        labelOff: 'Unequipped'
                    },
                    passiveModifiers: [
                        { variable: 'STR', value: 2 },
                        { variable: 'Attack_Melee', value: 1 }
                    ]
                };
                engine.savedQueues.push(swordW);

                // Recalculate/Sync variables
                const activeChar = characters.find(c => c.id === activeCharacterId);
                syncCharacterVariables(activeChar);

                // STR is 15 (from test 9), Attack_Melee is 0
                if (window.getActiveCharacterVariable('STR') !== 15) throw new Error('STR should remain 15 when Longsword is unequipped, got ' + window.getActiveCharacterVariable('STR'));
                if (window.getActiveCharacterVariable('Attack_Melee') !== 0) throw new Error('Attack_Melee should remain 0 when Longsword is unequipped, got ' + window.getActiveCharacterVariable('Attack_Melee'));

                // Equip Longsword
                toggleCardAddonState(swordId, true);
                if (window.getActiveCharacterVariable('STR') !== 17) throw new Error('STR should be 17 (15 + 2) when Longsword is equipped, got ' + window.getActiveCharacterVariable('STR'));
                if (window.getActiveCharacterVariable('STR_mod') !== 3) throw new Error('STR_mod should be 3 when STR is 17, got ' + window.getActiveCharacterVariable('STR_mod'));
                if (window.getActiveCharacterVariable('Attack_Melee') !== 1) throw new Error('Attack_Melee should be 1 (0 + 1) when Longsword is equipped, got ' + window.getActiveCharacterVariable('Attack_Melee'));

                // Unequip Longsword
                toggleCardAddonState(swordId, false);
                if (window.getActiveCharacterVariable('STR') !== 15) throw new Error('STR should be 15 after unequipping Longsword, got ' + window.getActiveCharacterVariable('STR'));
                if (window.getActiveCharacterVariable('STR_mod') !== 2) throw new Error('STR_mod should go back to 2, got ' + window.getActiveCharacterVariable('STR_mod'));
                if (window.getActiveCharacterVariable('Attack_Melee') !== 0) throw new Error('Attack_Melee should return to 0, got ' + window.getActiveCharacterVariable('Attack_Melee'));

                // Test 11: Export/Import Merge & Conflict-Resolution
                console.log('Testing Export/Import Merge & Conflict-Resolution...');
                
                // Establish initial state
                const testChar = characters.find(c => c.name === 'Direct Input Renamed Name');
                const testCharId = testChar.id;
                
                // Find its 'Default' group
                const defaultGrp = groups.find(g => g.characterId === testCharId && g.name === 'Default');
                const defaultGrpId = defaultGrp.id;
                
                // Clear savedQueues for this test character to be clean
                engine.savedQueues = engine.savedQueues.filter(w => w.characterId !== testCharId);
                
                // Add a widget to be overwritten
                const widgetToOverwrite = {
                    id: 'w_to_overwrite_id',
                    characterId: testCharId,
                    groupId: defaultGrpId,
                    name: 'Fireball',
                    formula: '8d6',
                    widgetType: 'roller',
                    color: 'none'
                };
                engine.savedQueues.push(widgetToOverwrite);
                
                // Set customDice to initial state
                customDice = [{ d: 12 }];
                
                // Mock import JSON
                const mockImport = {
                    campaigns: [
                        { id: 'camp_import_exist', name: 'Test Campaign' },
                        { id: 'camp_import_new', name: 'Brand New Campaign' }
                    ],
                    characters: [
                        { id: 'char_import_exist', name: 'Direct Input Renamed Name', campaignId: 'camp_import_exist', dndType: 'standard' },
                        { id: 'char_import_new', name: 'Brand New Character', campaignId: 'camp_import_exist', dndType: 'standard' }
                    ],
                    groups: [
                        { id: 'grp_import_exist', name: 'Default', characterId: 'char_import_exist', color: '#ff0000' },
                        { id: 'grp_import_new', name: 'Spells', characterId: 'char_import_exist', color: '#00ff00' }
                    ],
                    queues: [
                        // Conflicting name -> should overwrite widgetToOverwrite
                        { id: 'w_imported_conflict', name: 'Fireball', characterId: 'char_import_exist', groupId: 'grp_import_exist', formula: '12d6', color: '#ff0000', widgetType: 'roller' },
                        // New widget -> should be added
                        { id: 'w_imported_new', name: 'Magic Missile', characterId: 'char_import_exist', groupId: 'grp_import_exist', formula: '3d4+3', color: '#0000ff', widgetType: 'roller' }
                    ],
                    settings: {
                        customDice: [{ d: 33 }, { d: 12 }],
                        soundEnabled: false
                    }
                };
                
                // Mock FileReader
                window.FileReader = class {
                    constructor() {
                        this.onload = null;
                    }
                    readAsText(file) {
                        const event = {
                            target: {
                                result: JSON.stringify(mockImport)
                            }
                        };
                        setTimeout(() => {
                            if (this.onload) this.onload(event);
                        }, 0);
                    }
                };
                
                // Trigger import
                showModal = (opts) => {
                    // Mock click 'Merge'
                    return Promise.resolve(true); 
                };
                
                const mockEvent = {
                    target: {
                        files: [{ name: 'backup.json' }],
                        value: 'backup.json'
                    }
                };
                
                importSettings(mockEvent);
                
                // Wait for async file reader and import completion
                await new Promise(r => setTimeout(r, 50));
                
                // Assertions:
                // 1. Campaigns: 'Test Campaign' should NOT be duplicated. 'Brand New Campaign' should be added.
                const campaignNames = campaigns.map(c => c.name);
                if (!campaignNames.includes('Test Campaign')) throw new Error('Should keep Test Campaign');
                if (!campaignNames.includes('Brand New Campaign')) throw new Error('Should add Brand New Campaign');
                if (campaigns.filter(c => c.name === 'Test Campaign').length !== 1) throw new Error('Test Campaign should not be duplicated');
                
                // 2. Characters: 'Direct Input Renamed Name' should NOT be duplicated under 'Test Campaign'. 'Brand New Character' should be added.
                const activeCampObj = campaigns.find(c => c.name === 'Test Campaign');
                const campChars = characters.filter(c => c.campaignId === activeCampObj.id);
                if (campChars.filter(c => c.name === 'Direct Input Renamed Name').length !== 1) throw new Error('Direct Input Renamed Name should not be duplicated under Test Campaign');
                if (!campChars.some(c => c.name === 'Brand New Character')) throw new Error('Should add Brand New Character');
                
                // 3. Groups: 'Default' group should not be duplicated. 'Spells' group should be added.
                const charObj = characters.find(c => c.name === 'Direct Input Renamed Name' && c.campaignId === activeCampObj.id);
                const charGroups = groups.filter(g => g.characterId === charObj.id);
                if (charGroups.filter(g => g.name === 'Default').length !== 1) throw new Error('Default group should not be duplicated');
                if (!charGroups.some(g => g.name === 'Spells')) throw new Error('Should add Spells group');
                
                // 4. SavedQueues (Widgets / Arsenals):
                // 'Fireball' should be overwritten. The formula should change from '8d6' to '12d6', but the ID 'w_to_overwrite_id' MUST be preserved!
                const fireballWidget = engine.savedQueues.find(q => q.characterId === charObj.id && q.name === 'Fireball');
                if (!fireballWidget) throw new Error('Fireball widget should exist');
                if (fireballWidget.id !== 'w_to_overwrite_id') throw new Error('Overwritten Fireball widget should preserve its original ID');
                if (fireballWidget.formula !== '12d6') throw new Error('Fireball formula should be overwritten to 12d6');
                
                // 'Magic Missile' should be added as a new widget
                const mmWidget = engine.savedQueues.find(q => q.characterId === charObj.id && q.name === 'Magic Missile');
                if (!mmWidget) throw new Error('Magic Missile should be added');
                if (mmWidget.formula !== '3d4+3') throw new Error('Magic Missile formula should be 3d4+3');
                
                // 5. CustomDice: merged correctly. Should have d12 and d33.
                if (customDice.length !== 2) throw new Error('Custom dice should be merged (length 2)');
                if (customDice[0].d !== 12) throw new Error('Custom dice[0] should be 12');
                if (customDice[1].d !== 33) throw new Error('Custom dice[1] should be 33');

                // Test 12: Import third-party character sheet (Rimas.json)
                console.log('Testing third-party character sheet import (Rimas.json)...');
                
                // Mock FileReader to read rimasData
                window.FileReader = class {
                    constructor() {
                        this.onload = null;
                    }
                    readAsText(file) {
                        const event = {
                            target: {
                                result: window.rimasJsonStr
                            }
                        };
                        setTimeout(() => {
                            if (this.onload) this.onload(event);
                        }, 0);
                    }
                };
                
                // Trigger import settings (which will detect Shadowdarklings)
                const mockRimasEvent = {
                    target: {
                        files: [{ name: 'Rimas.json' }],
                        value: 'Rimas.json'
                    }
                };
                
                importSettings(mockRimasEvent);
                
                // Wait for import to complete
                await new Promise(r => setTimeout(r, 100));

                // Verify Rimas exists and is active
                const rimasChar = characters.find(c => c.name === 'Rimas');
                if (!rimasChar) throw new Error('Rimas character should be imported');
                if (activeCharacterId !== rimasChar.id) throw new Error('Rimas should be the active character');
                
                // Verify details
                const rimasWidgets = engine.savedQueues.filter(w => w.characterId === rimasChar.id);
                const classWidget = rimasWidgets.find(w => w.detailText === 'Class');
                if (!classWidget || classWidget.name !== 'Pit Fighter') throw new Error('Class should be Pit Fighter');
                const ancestryWidget = rimasWidgets.find(w => w.detailText === 'Ancestry');
                if (!ancestryWidget || ancestryWidget.name !== 'Half-Orc') throw new Error('Ancestry should be Half-Orc');
                
                // Verify stats variables
                if (rimasChar.variables.STR !== '14') throw new Error('STR variable should be 14');
                if (rimasChar.variables.CON !== '16') throw new Error('CON variable should be 16');
                if (rimasChar.variables.STR_mod !== '2') throw new Error('STR_mod variable should be 2');
                if (rimasChar.variables.WIS_mod !== '-1') throw new Error('WIS_mod variable should be -1');
                
                // Verify dynamic passive mods added to character variables
                if (rimasChar.variables.Attack_Melee !== '1') throw new Error('Attack_Melee passive mod should be 1');
                if (rimasChar.variables.Damage_Melee !== '1') throw new Error('Damage_Melee passive mod should be 1');

                // Verify HP and Gold stepper values
                const rimasHpW = rimasWidgets.find(w => w.name === 'HP' && w.widgetType === 'stepper');
                if (!rimasHpW || rimasHpW.value !== 16 || rimasHpW.max !== 16) throw new Error('HP max/value should be 16');
                
                const rimasGoldW = rimasWidgets.find(w => w.name === 'Gold' && w.widgetType === 'stepper');
                if (!rimasGoldW || rimasGoldW.value !== 6) throw new Error('Gold value should be 6');
                
                // Verify armor AC custom widgets
                const leatherW = rimasWidgets.find(w => w.name === 'Leather armor' && w.widgetType === 'number');
                if (!leatherW) throw new Error('Leather armor widget should be created');
                if (leatherW.addonToggle.checked !== true) throw new Error('Leather armor should be equipped');
                
                const testShieldW = rimasWidgets.find(w => w.name === 'Shield' && w.widgetType === 'number');
                if (!testShieldW || testShieldW.addonToggle.checked !== true) throw new Error('Shield should be equipped');
                
                // Verify weapon attacks (now dynamically using variables STR_mod + Attack_Melee)
                const longswordAtkW = rimasWidgets.find(w => w.name === 'Longsword Attack');
                if (!longswordAtkW) throw new Error('Longsword Attack widget should be created');
                
                const hasStrMod = longswordAtkW.unifiedQueue.some(n => n.nodeType === 'modifier' && n.type === 'variable' && n.value === 'STR_mod');
                const hasMeleeAtkMod = longswordAtkW.unifiedQueue.some(n => n.nodeType === 'modifier' && n.type === 'variable' && n.value === 'Attack_Melee');
                if (!hasStrMod || !hasMeleeAtkMod) throw new Error('Longsword Attack queue should reference STR_mod and Attack_Melee variables');
                
                const longswordDmgW = rimasWidgets.find(w => w.name === 'Longsword Damage');
                if (!longswordDmgW) throw new Error('Longsword Damage widget should be created');
                // formula is 1d8+Damage_Melee
                const dNode = longswordDmgW.unifiedQueue.find(n => n.nodeType === 'node');
                if (dNode.sides !== 8 || dNode.count !== 1) throw new Error('Longsword Damage should roll 1d8');
                const dModNode = longswordDmgW.unifiedQueue.find(n => n.nodeType === 'modifier');
                if (dModNode.value !== 'Damage_Melee') throw new Error('Longsword Damage modifier should reference Damage_Melee');
                
                // Verify talents and magic items listed in passives as a stepper
                const ignoreAttackW = rimasWidgets.find(w => w.name === 'WALK IT OFF');
                if (!ignoreAttackW) throw new Error('WALK IT OFF feature widget should be created');
                if (ignoreAttackW.widgetType !== 'stepper') throw new Error('WALK IT OFF should be a stepper widget due to 1/day limit');
                if (ignoreAttackW.max !== 1 || ignoreAttackW.value !== 1) throw new Error('WALK IT OFF stepper limits should be 1/1');
                if (!ignoreAttackW.detailText.includes('1/day, ignore all damage')) throw new Error('WALK IT OFF description is incorrect');

                // Verify Title details widget
                const rimasTitleW = rimasWidgets.find(w => w.detailText === 'Title');
                if (!rimasTitleW || rimasTitleW.name !== 'Rookie') throw new Error('Rimas title details widget should be Rookie');

                // Verify Pit Fighter class fallbacks
                const flourishW = rimasWidgets.find(w => w.name === 'FLOURISH');
                if (!flourishW || flourishW.widgetType !== 'stepper' || flourishW.max !== 3) throw new Error('FLOURISH stepper widget should be created');
                
                const implacableW = rimasWidgets.find(w => w.name === 'IMPLACABLE');
                if (!implacableW || implacableW.widgetType !== 'text') throw new Error('IMPLACABLE text widget should be created');

                const lastStandW = rimasWidgets.find(w => w.name === 'LAST STAND');
                if (!lastStandW || lastStandW.widgetType !== 'text') throw new Error('LAST STAND text widget should be created');

                const relentlessW = rimasWidgets.find(w => w.name === 'RELENTLESS');
                if (!relentlessW || relentlessW.widgetType !== 'stepper' || relentlessW.max !== 1) throw new Error('RELENTLESS stepper widget should be created');

                // Verify Mighty description suffix formatting
                const mightyW = rimasWidgets.find(w => w.name === 'MIGHTY');
                if (!mightyW) throw new Error('MIGHTY feature should exist');
                if (!mightyW.text.includes('You gain +1 to melee attack and damage rolls. (Half-Orc Ancestry Trait)')) {
                    throw new Error('Mighty description should place ancestry trait suffix after description');
                }

                // Verify gear mapping slots
                const slot1 = rimasWidgets.find(w => w.id.startsWith('w_gear_1_'));
                if (!slot1 || slot1.name !== 'Longsword') throw new Error('Gear slot 1 should be Longsword, got: ' + (slot1 ? slot1.name : 'null'));

                const slot8 = rimasWidgets.find(w => w.id.startsWith('w_gear_8_'));
                if (!slot8 || slot8.name !== 'Rations') throw new Error('Gear slot 8 should be Rations, got: ' + (slot8 ? slot8.name : 'null'));

                const slot9 = rimasWidgets.find(w => w.id.startsWith('w_gear_9_'));
                if (!slot9 || slot9.name !== '... extra slot') throw new Error('Gear slot 9 should be "... extra slot" (placeholder for Rations), got: ' + (slot9 ? slot9.name : 'null'));

                const slot10 = rimasWidgets.find(w => w.id.startsWith('w_gear_10_'));
                if (!slot10 || slot10.name !== 'Flask or bottle') throw new Error('Gear slot 10 should be Flask or bottle, got: ' + (slot10 ? slot10.name : 'null'));

                const slot11 = rimasWidgets.find(w => w.id.startsWith('w_gear_11_'));
                if (!slot11 || slot11.name !== 'Crowbar') throw new Error('Gear slot 11 should be Crowbar, got: ' + (slot11 ? slot11.name : 'null'));

                const slot12 = rimasWidgets.find(w => w.id.startsWith('w_gear_12_'));
                if (!slot12 || slot12.name !== '') throw new Error('Gear slot 12 should remain empty, got: ' + (slot12 ? slot12.name : 'null'));

                // Test 13: Import third-party character sheet (Horlabo.json)
                console.log('Testing third-party character sheet import (Horlabo.json)...');

                // Mock FileReader to read horlaboData
                window.FileReader = class {
                    constructor() {
                        this.onload = null;
                    }
                    readAsText(file) {
                        const event = {
                            target: {
                                result: window.horlaboJsonStr
                            }
                        };
                        setTimeout(() => {
                            if (this.onload) this.onload(event);
                        }, 0);
                    }
                };

                const mockHorlaboEvent = {
                    target: {
                        files: [{ name: 'Horlabo.json' }],
                        value: 'Horlabo.json'
                    }
                };

                importSettings(mockHorlaboEvent);

                // Wait for import to complete
                await new Promise(r => setTimeout(r, 100));

                // Verify Horlabo exists and is active
                const horlaboChar = characters.find(c => c.name === 'Horlabo');
                if (!horlaboChar) throw new Error('Horlabo character should be imported');
                if (activeCharacterId !== horlaboChar.id) throw new Error('Horlabo should be the active character');

                // Verify details
                const horlaboWidgets = engine.savedQueues.filter(w => w.characterId === horlaboChar.id);
                const hClassW = horlaboWidgets.find(w => w.detailText === 'Class');
                if (!hClassW || hClassW.name !== 'Wizard') throw new Error('Class should be Wizard');
                const hAncestryW = horlaboWidgets.find(w => w.detailText === 'Ancestry');
                if (!hAncestryW || hAncestryW.name !== 'Human') throw new Error('Ancestry should be Human');

                // Verify stats variables
                if (horlaboChar.variables.INT !== '21') throw new Error('INT variable should be 21');
                if (horlaboChar.variables.INT_mod !== '5') throw new Error('INT_mod variable should be 5');

                // Verify dynamic passive spellcheck modifiers (Plus1ToCastingSpells at level 7 and 9 should add to Spellcheck)
                const activeSpellcheck = window.getActiveCharacterVariable('Spellcheck');
                if (activeSpellcheck !== 2) throw new Error('Spellcheck modifier should be 2, got: ' + activeSpellcheck);

                // Verify Spellcheck variable in character sheet
                if (horlaboChar.variables.Spellcheck !== '2') throw new Error('Spellcheck variable should be 2, got: ' + horlaboChar.variables.Spellcheck);

                // Verify casting spells widget rolls: 1d20 + INT_mod + Spellcheck
                const spellCastW = horlaboWidgets.find(w => w.name === 'MAGIC MISSILE');
                if (!spellCastW) throw new Error('Magic Missile widget should be created');

                const hasIntMod = spellCastW.unifiedQueue.some(n => n.nodeType === 'modifier' && n.type === 'variable' && n.value === 'INT_mod');
                const hasSpellcheck = spellCastW.unifiedQueue.some(n => n.nodeType === 'modifier' && n.type === 'variable' && n.value === 'Spellcheck');
                if (!hasIntMod || !hasSpellcheck) throw new Error('Spell casting widget should reference INT_mod and Spellcheck variables');

                // Verify spell advantage checks, tier notes mapping, and sorting:
                const spellsGroup = groups.find(g => g.characterId === horlaboChar.id && g.name.toLowerCase() === 'spells');
                const spellWidgets = horlaboWidgets.filter(w => w.id.startsWith('w_spell_custom_'));
                const spellNames = spellWidgets.map(w => w.name);
                const expectedNames = [
                    "BURNING HANDS", "DETECT MAGIC", "HOLD PORTAL", "MAGIC MISSILE",
                    "HOLD PERSON", "INVISIBILITY", "MIRROR IMAGE", "MISTY STEP",
                    "FIREBALL", "GASEOUS FORM", "ILLUSION", "SENDING",
                    "CONTROL WATER", "DIVINATION",
                    "SCRYING", "SUMMON EXTRAPLANAR"
                ];
                for (let i = 0; i < expectedNames.length; i++) {
                    if (spellNames[i] !== expectedNames[i]) {
                        throw new Error('Spell sorting order mismatch at index ' + i + ': expected ' + expectedNames[i] + ', got ' + spellNames[i]);
                    }
                }

                const detectMagicW = spellWidgets.find(w => w.name === 'DETECT MAGIC');
                if (detectMagicW.includeAdvDis !== true) throw new Error('DETECT MAGIC should have Advantage/Disadvantage enabled');
                if (detectMagicW.addonNote !== 'T1 DC Wizard Spellcasting') throw new Error('DETECT MAGIC addonNote is incorrect: ' + detectMagicW.addonNote);

                const magicMissileW = spellWidgets.find(w => w.name === 'MAGIC MISSILE');
                if (magicMissileW.includeAdvDis !== false) throw new Error('MAGIC MISSILE should NOT have Advantage/Disadvantage enabled');
                if (magicMissileW.addonNote !== 'T1 DC Wizard Spellcasting') throw new Error('MAGIC MISSILE addonNote is incorrect: ' + magicMissileW.addonNote);

                const fireballW = spellWidgets.find(w => w.name === 'FIREBALL');
                if (fireballW.addonNote !== 'T3 DC Wizard Spellcasting') throw new Error('FIREBALL addonNote is incorrect: ' + fireballW.addonNote);

                // Verify gear mapping (seq slots and no extra slots)
                const hSlot1 = horlaboWidgets.find(w => w.id.startsWith('w_gear_1_'));
                if (!hSlot1 || hSlot1.name !== 'Dagger (obsidian)') throw new Error('Horlabo gear slot 1 should be Dagger (obsidian)');
                if (hSlot1.detailText !== '1. - Quantity: 1 | Slots: 1 | Cost: 3 gp') {
                    throw new Error('Horlabo gear slot 1 detailText is incorrect: ' + hSlot1.detailText);
                }

                const hSlot2 = horlaboWidgets.find(w => w.id.startsWith('w_gear_2_'));
                if (!hSlot2 || hSlot2.name !== 'Backpack') throw new Error('Horlabo gear slot 2 should be Backpack');

                const hSlot5 = horlaboWidgets.find(w => w.id.startsWith('w_gear_5_'));
                if (!hSlot5 || hSlot5.name !== 'Crowbar') throw new Error('Horlabo gear slot 5 should be Crowbar');

                const hSlot6 = horlaboWidgets.find(w => w.id.startsWith('w_gear_6_'));
                if (!hSlot6 || hSlot6.name !== 'Blade of Vengeance') throw new Error('Horlabo gear slot 6 should be Blade of Vengeance, got: ' + (hSlot6 ? hSlot6.name : 'null'));
                if (!hSlot6.detailText.includes('Quantity: 1 | Slots: 1')) throw new Error('Horlabo gear slot 6 detailText is incorrect: ' + hSlot6.detailText);
                if (!hSlot6.text.includes('Benefits: You have advantage on attacks against undead creatures')) throw new Error('Horlabo gear slot 6 text is incorrect: ' + hSlot6.text);

                const hSlot7 = horlaboWidgets.find(w => w.id.startsWith('w_gear_7_'));
                if (!hSlot7 || hSlot7.name !== 'Egg of the Cockatrice') throw new Error('Horlabo gear slot 7 should be Egg of the Cockatrice, got: ' + (hSlot7 ? hSlot7.name : 'null'));

                const hSlot8 = horlaboWidgets.find(w => w.id.startsWith('w_gear_8_'));
                if (!hSlot8 || hSlot8.name !== 'Tome Mordanticus') throw new Error('Horlabo gear slot 8 should be Tome Mordanticus, got: ' + (hSlot8 ? hSlot8.name : 'null'));

                const hSlot9 = horlaboWidgets.find(w => w.id.startsWith('w_gear_9_'));
                if (!hSlot9 || hSlot9.name !== '') throw new Error('Horlabo gear slot 9 should be empty');

                // Verify parsed ambition talent and other merged class talents
                const ambitionTalentW = horlaboWidgets.find(w => w.name === 'HUMAN AMBITION-1: SPELL MASTERY (DETECT MAGIC)');
                if (!ambitionTalentW) throw new Error('Human ambition talent SPELL MASTERY should be parsed and created');
                if (!ambitionTalentW.text || !ambitionTalentW.text.includes('advantage on casting one spell')) throw new Error('Human ambition talent description is incorrect');

                const statBonusTalentW = horlaboWidgets.find(w => w.name === 'WIZARD-1: STAT BONUS (+2 INT)');
                if (!statBonusTalentW) throw new Error('Wizard level 1 STAT BONUS (+2 INT) widget should be created');

                const statBonusTalentW5 = horlaboWidgets.find(w => w.name === 'WIZARD-5: STAT BONUS (+2 INT)');
                if (!statBonusTalentW5) throw new Error('Wizard level 5 STAT BONUS (+2 INT) widget should be created');

                const castingTalentW7 = horlaboWidgets.find(w => w.name === 'WIZARD-7: SPELLCASTING (+1 CASTING)');
                if (!castingTalentW7) throw new Error('Wizard level 7 SPELLCASTING (+1 CASTING) widget should be created');

                const castingTalentW9 = horlaboWidgets.find(w => w.name === 'WIZARD-9: SPELLCASTING (+1 CASTING)');
                if (!castingTalentW9) throw new Error('Wizard level 9 SPELLCASTING (+1 CASTING) widget should be created');

                // Verify Title detail widget
                const horlaboTitleW = horlaboWidgets.find(w => w.detailText === 'Title');
                if (!horlaboTitleW || horlaboTitleW.name !== 'Druid') throw new Error('Horlabo title details widget should be Druid');

                // Verify metadata details widget in passives is NOT created (since it is tossed)
                const detailsW = horlaboWidgets.find(w => w.name === 'CHARACTER DETAILS');
                if (detailsW) throw new Error('CHARACTER DETAILS widget should NOT be created');

                // Test 14: Import mock character sheet for refactored features (versatile, Weapon Mastery, Armor Master)
                console.log('Testing third-party character sheet importer refactored features...');
                const mockData = JSON.parse(window.rimasJsonStr);
                mockData.name = "Testy Refactor";
                mockData.level = 2;
                mockData.stats = { STR: 14, DEX: 12, CON: 16, INT: 10, WIS: 9, CHA: 8 };
                mockData.gear = [
                    { name: "Bastard Sword", type: "weapon", quantity: 1 },
                    { name: "Mithril chainmail", type: "armor", quantity: 1 }
                ];
                mockData.attacks = [
                    "BASTARD SWORD: +5, 1d8+3/1d10+3"
                ];
                mockData.bonuses = [
                    {
                        name: "WeaponMastery",
                        bonusName: "WeaponMastery",
                        bonusTo: "Bastard Sword",
                        bonusAmount: 1,
                        gainedAtLevel: 1,
                        sourceCategory: "Talent"
                    },
                    {
                        name: "ArmorMaster",
                        bonusName: "ArmorMaster",
                        bonusTo: "Mithril chainmail",
                        bonusAmount: 1,
                        gainedAtLevel: 1,
                        sourceCategory: "Talent"
                    }
                ];

                window.FileReader = class {
                    constructor() { this.onload = null; }
                    readAsText(file) {
                        const event = { target: { result: JSON.stringify(mockData) } };
                        setTimeout(() => { if (this.onload) this.onload(event); }, 0);
                    }
                };

                const mockTestyEvent = {
                    target: {
                        files: [{ name: 'Testy.json' }],
                        value: 'Testy.json'
                    }
                };

                importSettings(mockTestyEvent);
                await new Promise(r => setTimeout(r, 100));

                const testyChar = characters.find(c => c.name === 'Testy Refactor');
                if (!testyChar) throw new Error('Testy Refactor character should be imported');

                const testyWidgets = engine.savedQueues.filter(w => w.characterId === testyChar.id);

                // 1. Verify versatile weapon creation (one attack, two damage widgets)
                const bastardAtkW = testyWidgets.find(w => w.name === 'Bastard Sword Attack');
                if (!bastardAtkW) throw new Error('Bastard Sword Attack widget should be created');

                const bastardDmg1 = testyWidgets.find(w => w.name === 'Bastard Sword Damage (1-Hand)');
                const bastardDmg2 = testyWidgets.find(w => w.name === 'Bastard Sword Damage (2-Hand)');
                if (!bastardDmg1) throw new Error('Bastard Sword Damage (1-Hand) widget should be created');
                if (!bastardDmg2) throw new Error('Bastard Sword Damage (2-Hand) widget should be created');

                // 2. Verify Weapon Mastery (scaling levels variable node in attack/damage, base magic bonus isolated)
                const masteryNode = bastardAtkW.unifiedQueue.find(n => n.nodeType === 'modifier' && n.type === 'variable' && n.value === 'LVL');
                if (!masteryNode) throw new Error('Bastard Sword Attack should have level-scaling Weapon Mastery queue node');
                if (masteryNode.divisorValue !== 2 || masteryNode.divisorType !== 'literal') {
                    throw new Error('Weapon Mastery level-scaling node has incorrect divisor configuration');
                }

                // Verify base magical bonus is +1 in attack queue
                const magicAtkNode = bastardAtkW.unifiedQueue.find(n => n.nodeType === 'modifier' && n.type === 'literal' && n.value === 1 && n.operator === '+');
                if (!magicAtkNode) throw new Error('Bastard Sword Attack should isolate and add base magical bonus +1');

                // Verify damage queues: 1d8 / 1d10 + Damage_Melee + (Weapon Mastery level-scaling) + magicDmgBonus (+1)
                const d1Node = bastardDmg1.unifiedQueue.find(n => n.nodeType === 'node');
                if (d1Node.sides !== 8 || d1Node.count !== 1) throw new Error('Bastard Sword Damage (1-Hand) should roll 1d8');
                const magicDmgNode = bastardDmg1.unifiedQueue.find(n => n.nodeType === 'modifier' && n.type === 'literal' && n.value === 1 && n.operator === '+');
                if (!magicDmgNode) throw new Error('Bastard Sword Damage (1-Hand) should isolate and add base magical damage bonus +1');

                // 3. Verify Armor Master AC modifier application
                const mithrilW = testyWidgets.find(w => w.name === 'Mithril chainmail' && w.widgetType === 'number');
                if (!mithrilW) throw new Error('Mithril chainmail widget should be created');
                const armorMasterAcNode = mithrilW.unifiedQueue.find(n => n.nodeType === 'modifier' && n.type === 'literal' && n.value === 1 && n.operator === '+');
                if (!armorMasterAcNode) throw new Error('Mithril chainmail should have Armor Master modifier +1 in AC queue');
            })()

        `).then(() => {
            console.log('-> Passed.');
            console.log('\n🎉 ALL INTEGRATION DEEP DIVE TESTS PASSED SUCCESSFULLY! ✅');
            process.exit(0);
        }).catch(err => {
            console.error('\n❌ INTEGRATION DEEP DIVE TEST FAILED inside Test 7:');
            console.error(err.message);
            console.error(err.stack);
            process.exit(1);
        });

    } catch (err) {
        console.error('\n❌ INTEGRATION DEEP DIVE TEST FAILED:');
        console.error(err.message);
        console.error(err.stack);
        process.exit(1);
    }
});
