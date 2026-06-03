        function loadQueue(id, event) {
            if (event) event.stopPropagation();
            closeAllArsenalMenus();

            activeLoadoutId = id;
            engine.loadQueue(id);
            if (engine.rollRules.evalCriteria) {
                Object.assign(evalCriteria, JSON.parse(JSON.stringify(engine.rollRules.evalCriteria)));
                ['sum', 'count', 'sets'].forEach(tab => {
                    if (evalCriteria[tab]) {
                        const parentViewOnly = evalCriteria[tab].viewOnly || false;
                        evalCriteria[tab].forEach(c => {
                            c.viewOnly = parentViewOnly;
                        });
                    }
                });
            } else {
                evalCriteria.sum = [];
                evalCriteria.count = [];
                evalCriteria.sets = [];
                evalCriteria.list = [];
            }
            document.getElementById('rule-reroll-op').value = engine.rollRules.rerollOp;
            document.getElementById('rule-reroll-val').value = engine.rollRules.rerollVal ?? '';
            document.getElementById('rule-explode-op').value = engine.rollRules.explodeOp;
            document.getElementById('rule-explode-val').value = engine.rollRules.explodeVal ?? '';

            currentTargetMode = engine.rollRules.targetMode || 'sum';
            if (currentTargetMode === 'sum') {
                document.getElementById('rule-sum-op').value = engine.rollRules.targetOp || '';
                document.getElementById('rule-sum-val').value = engine.rollRules.targetVal || 'overall';
                document.getElementById('rule-count-op').value = '>=';
                document.getElementById('rule-count-val').value = '';
                document.getElementById('rule-count-thresh-op').value = '';
                document.getElementById('rule-count-thresh-val').value = '';
            } else if (currentTargetMode === 'count') {
                document.getElementById('rule-count-op').value = engine.rollRules.targetOp || '>=';
                document.getElementById('rule-count-val').value = engine.rollRules.targetVal ?? '';
                document.getElementById('rule-count-thresh-op').value = engine.rollRules.countThreshOp || '';
                document.getElementById('rule-count-thresh-val').value = engine.rollRules.countThreshVal ?? '';
                document.getElementById('rule-sum-op').value = '';
                document.getElementById('rule-sum-val').value = 'overall';
            } else {
                document.getElementById('rule-sum-op').value = '';
                document.getElementById('rule-sum-val').value = 'overall';
                document.getElementById('rule-count-op').value = '>=';
                document.getElementById('rule-count-val').value = '';
                document.getElementById('rule-count-thresh-op').value = '';
                document.getElementById('rule-count-thresh-val').value = '';
            }

            document.getElementById('rule-sets-op').value = engine.rollRules.setsOp || "";
            document.getElementById('rule-sets-val').value = engine.rollRules.setsVal ?? "";
            updateRulesUI();
            updateUI();
            vibrate(5);

            autoExpandRollPad();

            // Switch to dice mode to see the loaded queue
            const container = document.getElementById('main-container');
            if (container) {
                container.classList.remove('mode-arsenal');
                container.classList.add('mode-dice');
            }
        }
        function persistSaved() {
            localStorage.setItem('crypto_roller_saved', JSON.stringify(engine.savedQueues));
        }
        function saveSettings() {
            localStorage.setItem('crypto_roller_settings', JSON.stringify({
                soundEnabled: soundEnabled,
                volume: volume,
                instaQueue: isInstaQueue,
                arsenalQueue: isArsenalQueue,
                moddedQuick: isModdedQuick,
                customDice: customDice,
                currentTargetMode: currentTargetMode,
                headerHidden: headerHidden
            }));
        }
        function exportSettings() {
            const exportData = {
                queues: engine.savedQueues,
                characters: characters,
                groups: groups,
                activeCharacterId: activeCharacterId,
                activeGroupId: activeGroupId,
                campaigns: campaigns,
                activeCampaignId: activeCampaignId,
                openTabs: openTabs,
                settings: {
                    soundEnabled: soundEnabled,
                    volume: volume,
                    instaQueue: isInstaQueue,
                    arsenalQueue: isArsenalQueue,
                    moddedQuick: isModdedQuick,
                    customDice: customDice,
                    currentTargetMode: currentTargetMode,
                    headerHidden: headerHidden
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `StaticDice_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        function importSettings(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    const ctx = { templates, activeCampaignId, COLOR_PALETTE, engine, groups };
                    const detectResult = ParserRegistry.detectAndImport(imported, ctx);
                    if (detectResult) {
                        const { character, groups: newGroups, widgets: newWidgets } = detectResult.result;
                        
                        if (!activeCampaignId) {
                            if (campaigns.length === 0) {
                                campaigns = [{ id: 'default_campaign', name: 'Default Campaign' }];
                                activeCampaignId = 'default_campaign';
                                openTabs = [activeCampaignId];
                            } else {
                                activeCampaignId = campaigns[0].id;
                            }
                        }
                        
                        character.campaignId = activeCampaignId;
                        characters.push(character);
                        groups.push(...newGroups);
                        engine.savedQueues.push(...newWidgets);
                        
                        activeCharacterId = character.id;
                        activeGroupId = newGroups.length > 0 ? newGroups[0].id : null;
                        
                        syncCharacterVariables(character);
                        organizeCombatWidgets(character.id, engine, groups);
                        
                        persistArsenal();
                        persistSaved();
                        
                        renderCampaignSelect();
                        renderCharacterSelect();
                        renderGroupTabs();
                        renderSavedQueues();
                        renderBinder();
                        
                        showModal({
                            title: 'Character Imported!',
                            body: `Successfully imported "${character.name}" (${detectResult.importerName})! All stats, weapons, spells, and gear have been loaded.`,
                            alertOnly: true
                        });
                        
                        event.target.value = '';
                        return;
                    }

                    let importedQueues = [];
                    let importedSettings = null;

                    if (Array.isArray(imported)) {
                        importedQueues = imported;
                    } else if (imported && typeof imported === 'object') {
                        importedQueues = imported.queues || [];
                        importedSettings = imported.settings;
                    } else {
                        throw new Error("Invalid format");
                    }

                    showModal({
                        title: 'Import Settings',
                        body: 'Choose how to handle your loadouts.',
                        confirmText: 'Merge',
                        cancelText: 'Overwrite'
                    }).then(mergeChosen => {
                        const mode = mergeChosen ? 'merge' : 'overwrite';

                        if (mode === 'merge') {
                            const campIdMap = {};
                            const charIdMap = {};
                            const grpIdMap = {};
                            const widgetIdMap = {};

                            // 1. Merge campaigns (conflict is case-insensitive trimmed name)
                            if (imported.campaigns) {
                                imported.campaigns.forEach(c => {
                                    const existing = campaigns.find(curr => curr.name.trim().toLowerCase() === c.name.trim().toLowerCase());
                                    if (existing) {
                                        campIdMap[c.id] = existing.id;
                                    } else {
                                        const idCollision = campaigns.some(curr => curr.id === c.id);
                                        const targetCampId = idCollision ? 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) : c.id;
                                        campaigns.push({
                                            id: targetCampId,
                                            name: c.name
                                        });
                                        campIdMap[c.id] = targetCampId;
                                    }
                                });
                            }

                            // 2. Merge characters (conflict is case-insensitive trimmed name under the same mapped campaign)
                            if (imported.characters) {
                                imported.characters.forEach(c => {
                                    const targetCampId = campIdMap[c.campaignId] || c.campaignId || activeCampaignId || 'default_campaign';
                                    const existing = characters.find(curr => curr.campaignId === targetCampId && curr.name.trim().toLowerCase() === c.name.trim().toLowerCase());
                                    if (existing) {
                                        const targetCharId = existing.id;
                                        Object.assign(existing, c, { id: targetCharId, campaignId: targetCampId });
                                        charIdMap[c.id] = targetCharId;
                                    } else {
                                        const idCollision = characters.some(curr => curr.id === c.id);
                                        const targetCharId = idCollision ? 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) : c.id;
                                        characters.push({
                                            ...c,
                                            id: targetCharId,
                                            campaignId: targetCampId
                                        });
                                        charIdMap[c.id] = targetCharId;
                                    }
                                });
                            }

                            // 3. Merge groups (conflict is case-insensitive trimmed name under the same mapped character)
                            if (imported.groups) {
                                imported.groups.forEach(g => {
                                    const targetCharId = charIdMap[g.characterId] || g.characterId || activeCharacterId;
                                    const existing = groups.find(curr => curr.characterId === targetCharId && curr.name.trim().toLowerCase() === g.name.trim().toLowerCase());
                                    if (existing) {
                                        const targetGrpId = existing.id;
                                        Object.assign(existing, g, { id: targetGrpId, characterId: targetCharId });
                                        grpIdMap[g.id] = targetGrpId;
                                    } else {
                                        const idCollision = groups.some(curr => curr.id === g.id);
                                        const targetGrpId = idCollision ? 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) : g.id;
                                        groups.push({
                                            ...g,
                                            id: targetGrpId,
                                            characterId: targetCharId
                                        });
                                        grpIdMap[g.id] = targetGrpId;
                                    }
                                });
                            }

                            // Ensure current active selections map to valid entities if they were mapped
                            if (imported.activeCampaignId && campIdMap[imported.activeCampaignId]) {
                                activeCampaignId = campIdMap[imported.activeCampaignId];
                            }
                            if (imported.activeCharacterId && charIdMap[imported.activeCharacterId]) {
                                activeCharacterId = charIdMap[imported.activeCharacterId];
                            }
                            if (imported.activeGroupId && grpIdMap[imported.activeGroupId]) {
                                activeGroupId = grpIdMap[imported.activeGroupId];
                            }

                            // Keep current active selections valid
                            if (!campaigns.some(c => c.id === activeCampaignId)) {
                                activeCampaignId = campaigns.length > 0 ? campaigns[0].id : null;
                            }
                            const campaignChars = characters.filter(c => c.campaignId === activeCampaignId);
                            if (!campaignChars.some(c => c.id === activeCharacterId)) {
                                activeCharacterId = campaignChars.length > 0 ? campaignChars[0].id : null;
                            }
                            const charGroups = groups.filter(g => g.characterId === activeCharacterId);
                            if (!charGroups.some(g => g.id === activeGroupId)) {
                                activeGroupId = charGroups.length > 0 ? charGroups[0].id : null;
                            }

                            // 4. Merge/Overwrite dice arsenals (saved queues/widgets)
                            importedQueues.forEach(item => {
                                const targetCharId = charIdMap[item.characterId] || item.characterId || activeCharacterId;
                                const targetGrpId = grpIdMap[item.groupId] || item.groupId || activeGroupId;

                                if (!targetCharId || !targetGrpId) return; // safety check

                                const existing = engine.savedQueues.find(q =>
                                    q.characterId === targetCharId &&
                                    q.groupId === targetGrpId &&
                                    q.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                                );

                                if (existing) {
                                    const targetWidgetId = existing.id;
                                    // Construct clean widget containing all incoming fields but keeping the existing ID
                                    const cleanWidget = {
                                        ...item,
                                        id: targetWidgetId,
                                        characterId: targetCharId,
                                        groupId: targetGrpId
                                    };
                                    const idx = engine.savedQueues.indexOf(existing);
                                    if (idx !== -1) {
                                        engine.savedQueues[idx] = cleanWidget;
                                    }
                                    widgetIdMap[item.id] = targetWidgetId;
                                } else {
                                    const idCollision = engine.savedQueues.some(q => q.id === item.id);
                                    const targetWidgetId = idCollision ? 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) : item.id;
                                    const newWidget = {
                                        ...item,
                                        id: targetWidgetId,
                                        characterId: targetCharId,
                                        groupId: targetGrpId
                                    };
                                    engine.savedQueues.push(newWidget);
                                    widgetIdMap[item.id] = targetWidgetId;
                                }
                            });

                            // 5. Update/Remap widget IDs referenced in cascade roll chains
                            engine.savedQueues.forEach(q => {
                                if (q.chain) {
                                    if (q.chain.preRoll && q.chain.preRoll.arsenalId) {
                                        const oldId = q.chain.preRoll.arsenalId;
                                        if (widgetIdMap[oldId]) {
                                            q.chain.preRoll.arsenalId = widgetIdMap[oldId];
                                        }
                                    }
                                    if (q.chain.postRoll) {
                                        if (q.chain.postRoll.success && q.chain.postRoll.success.arsenalId) {
                                            const oldId = q.chain.postRoll.success.arsenalId;
                                            if (widgetIdMap[oldId]) {
                                                q.chain.postRoll.success.arsenalId = widgetIdMap[oldId];
                                            }
                                        }
                                        if (q.chain.postRoll.crit && q.chain.postRoll.crit.arsenalId) {
                                            const oldId = q.chain.postRoll.crit.arsenalId;
                                            if (widgetIdMap[oldId]) {
                                                q.chain.postRoll.crit.arsenalId = widgetIdMap[oldId];
                                            }
                                        }
                                        if (q.chain.postRoll.fail && q.chain.postRoll.fail.arsenalId) {
                                            const oldId = q.chain.postRoll.fail.arsenalId;
                                            if (widgetIdMap[oldId]) {
                                                q.chain.postRoll.fail.arsenalId = widgetIdMap[oldId];
                                            }
                                        }
                                    }
                                }
                            });

                            // Merge open tabs
                            if (imported.openTabs) {
                                imported.openTabs.forEach(tId => {
                                    const mappedId = campIdMap[tId];
                                    if (mappedId && !openTabs.includes(mappedId)) {
                                        openTabs.push(mappedId);
                                    }
                                });
                            }
                        } else {
                            // Overwrite mode
                            if (imported.campaigns && imported.campaigns.length > 0) {
                                campaigns = imported.campaigns;
                            } else {
                                campaigns = [{ id: 'default_campaign', name: 'Default Campaign' }];
                            }
                            if (imported.activeCampaignId) {
                                activeCampaignId = imported.activeCampaignId;
                            } else {
                                activeCampaignId = campaigns[0].id;
                            }
                            if (imported.openTabs) {
                                openTabs = imported.openTabs;
                            } else {
                                openTabs = [activeCampaignId];
                            }
                            if (imported.characters && imported.characters.length > 0) {
                                characters = imported.characters;
                            }
                            if (imported.groups && imported.groups.length > 0) {
                                groups = imported.groups;
                            }
                            if (imported.activeCharacterId) {
                                activeCharacterId = imported.activeCharacterId;
                            } else if (characters.length > 0) {
                                activeCharacterId = characters[0].id;
                            }
                            if (imported.activeGroupId) {
                                activeGroupId = imported.activeGroupId;
                            } else {
                                const charGroups = groups.filter(g => g.characterId === activeCharacterId);
                                activeGroupId = charGroups.length > 0 ? charGroups[0].id : null;
                            }

                            // If legacy import without any characters/groups, assign to active
                            if (!imported.characters || imported.characters.length === 0) {
                                importedQueues.forEach(item => {
                                    if (!item.characterId) item.characterId = activeCharacterId;
                                    if (!item.groupId) item.groupId = activeGroupId;
                                });
                            }

                            engine.setSavedQueues(importedQueues);
                        }

                        if (importedSettings) {
                            if (importedSettings.soundEnabled !== undefined) {
                                soundEnabled = importedSettings.soundEnabled;
                            }
                            if (importedSettings.volume !== undefined) {
                                volume = importedSettings.volume;
                                updateVolume(volume);
                                document.getElementById('volume-slider').value = volume;
                            }
                            if (importedSettings.instaQueue !== undefined) {
                                isInstaQueue = importedSettings.instaQueue;
                                if (isInstaQueue === true) isInstaQueue = 'Queue Only';
                                else if (isInstaQueue === false) isInstaQueue = 'Roll Only';
                            }
                            if (importedSettings.arsenalQueue !== undefined) {
                                isArsenalQueue = importedSettings.arsenalQueue;
                                if (isArsenalQueue === true) isArsenalQueue = 'Roll & Queue';
                                else if (isArsenalQueue === false) isArsenalQueue = 'Roll Only';
                            }
                            if (importedSettings.moddedQuick !== undefined) {
                                isModdedQuick = importedSettings.moddedQuick;
                            }
                            if (importedSettings.customDice !== undefined) {
                                if (mode === 'merge') {
                                    importedSettings.customDice.forEach(d => {
                                        if (!customDice.some(existing => existing.d === d.d)) {
                                            customDice.push(d);
                                        }
                                    });
                                    customDice.sort((a, b) => a.d - b.d);
                                } else {
                                    customDice = importedSettings.customDice;
                                }
                            }
                            if (importedSettings.currentTargetMode !== undefined) {
                                currentTargetMode = importedSettings.currentTargetMode;
                            }
                            if (importedSettings.headerHidden !== undefined) {
                                headerHidden = importedSettings.headerHidden;
                                document.body.classList.toggle('header-hidden', headerHidden);
                            }
                            renderDiceGrid();
                            saveSettings();
                            updateSoundUI();
                        }

                        persistSaved();
                        persistArsenal();
                        renderCharacterSelect();
                        renderGroupTabs();
                        renderSavedQueues();
                        showModal({ title: 'Import Complete', body: 'Settings, characters, groups, and loadouts successfully imported!', alertOnly: true });
                    });
                } catch (err) {
                    showModal({ title: 'Import Error', body: "Please ensure it's a valid StaticDice settings backup.", alertOnly: true, danger: true });
                }
                event.target.value = '';
            };
            reader.readAsText(file);
        }
        function loadTemplates() {
            let custom = [];
            try {
                const stored = localStorage.getItem('crypto_roller_templates');
                if (stored) {
                    custom = JSON.parse(stored);
                }
            } catch (e) { }
            templates = [...getInitialTemplates(), ...custom];
        }
        function exportTemplates() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "templates.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
        function importTemplates(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function (e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        // Merge logic: ensure we don't import default templates as custom, and merge custom ones.
                        const newCustomTemplates = imported.filter(t => !t.isDefault);

                        let addedCount = 0;
                        newCustomTemplates.forEach(t => {
                            if (!templates.find(ext => ext.id === t.id)) {
                                templates.push(t);
                                addedCount++;
                            }
                        });

                        persistTemplates();
                        renderTemplates();

                        await showModal({
                            title: 'Templates Imported',
                            body: `Successfully imported ${addedCount} new templates.`,
                            alertOnly: true
                        });
                    } else {
                        throw new Error("Invalid format");
                    }
                } catch (err) {
                    console.error('Error importing templates:', err);
                    await showModal({
                        title: 'Import Failed',
                        body: 'The selected file is not a valid templates JSON file.',
                        alertOnly: true
                    });
                }
                event.target.value = ''; // Reset input
            };
            reader.readAsText(file);
        }
        function persistTemplates() {
            const custom = templates.filter(t => !t.isDefault);
            localStorage.setItem('crypto_roller_templates', JSON.stringify(custom));
        }
        function persistArsenal() {
            localStorage.setItem('crypto_roller_arsenal', JSON.stringify({
                characters,
                groups,
                activeCharacterId,
                activeGroupId,
                campaigns,
                activeCampaignId,
                openTabs
            }));
        }
