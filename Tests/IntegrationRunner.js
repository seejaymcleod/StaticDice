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
