// ShadowdarkParser.js

function parseUsageLimit(desc) {
    if (!desc) return null;
    const cleanDesc = desc.toLowerCase();
    if (cleanDesc.includes('per level') || cleanDesc.includes('/level')) {
        return 'LVL';
    }
    if (cleanDesc.includes('once per') || cleanDesc.includes('1/day') || cleanDesc.includes('1 per day') || cleanDesc.includes('1/combat') || cleanDesc.includes('1 per combat') || cleanDesc.includes('once/day')) {
        return 1;
    }
    if (cleanDesc.includes('twice per') || cleanDesc.includes('2/day') || cleanDesc.includes('2 per day') || cleanDesc.includes('2/combat') || cleanDesc.includes('2 per combat') || cleanDesc.includes('twice/day')) {
        return 2;
    }
    if (cleanDesc.includes('three times') || cleanDesc.includes('3/day') || cleanDesc.includes('3 per day') || cleanDesc.includes('3/combat') || cleanDesc.includes('3 per combat')) {
        return 3;
    }
    const match = cleanDesc.match(/(\d+)\s*(?:\/|per)\s*(?:day|combat|week|encounter|rest)/);
    if (match) {
        return parseInt(match[1]) || 1;
    }
    return null;
}

function parseDamageFormula(formula) {
    if (!formula) return [{ nodeType: 'node', sides: 6, count: 1 }];
    let cleanFormula = formula.split('/')[0].trim();
    const dmgMatch = cleanFormula.match(/^(\d+d\d+(?:[+-]\d+)?)/);
    if (dmgMatch) {
        cleanFormula = dmgMatch[1];
    }
    const match = cleanFormula.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
    if (match) {
        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const queue = [
            { nodeType: 'node', sides: sides, count: count }
        ];
        if (match[3] && match[4]) {
            const op = match[3];
            const val = parseInt(match[4]);
            queue.push(
                { nodeType: 'operator', operator: op },
                { nodeType: 'modifier', type: 'literal', value: val, operator: op }
            );
        }
        return queue;
    }
    return [{ nodeType: 'node', sides: 6, count: 1 }];
}

function organizeCombatWidgets(charId, engine, groups) {
    const charWidgets = engine.savedQueues.filter(w => w.characterId === charId);
    const otherWidgets = engine.savedQueues.filter(w => w.characterId !== charId);
    
    const combatGrp = groups.find(g => g.characterId === charId && g.name.toLowerCase() === 'combat');
    if (!combatGrp) return;
    const combatGrpId = combatGrp.id;
    
    const combatWidgets = charWidgets.filter(w => w.groupId === combatGrpId);
    const nonCombatWidgets = charWidgets.filter(w => w.groupId !== combatGrpId);
    
    const hpW = combatWidgets.find(w => w.name === 'HP');
    const acTotalW = combatWidgets.find(w => w.name === 'Armor Class');
    const unarmoredW = combatWidgets.find(w => w.name === 'Unarmored');
    const shieldW = combatWidgets.find(w => w.name === 'Shield');
    const acModW = combatWidgets.find(w => w.name === 'Misc AC Mod');
    const backstabW = combatWidgets.find(w => w.name === 'Backstab Dice');
    
    const defaultAttacks = combatWidgets.filter(w => 
        w.id.includes('w_atk_melee_str') || 
        w.id.includes('w_atk_melee_dex') || 
        w.id.includes('w_atk_ranged_str') || 
        w.id.includes('w_atk_ranged_dex') ||
        ['Attack Melee - STR', 'Attack Melee - DEX', 'Attack Ranged - STR', 'Attack Ranged - DEX'].includes(w.name)
    );
    
    const bodyArmors = combatWidgets.filter(w => 
        w.bindsVariable === 'AC_Armor' && 
        w !== unarmoredW
    );
    
    const knownIds = new Set([
        hpW?.id, acTotalW?.id, unarmoredW?.id, shieldW?.id, acModW?.id, backstabW?.id,
        ...defaultAttacks.map(w => w.id),
        ...bodyArmors.map(w => w.id)
    ].filter(Boolean));
    
    const customWeapons = combatWidgets.filter(w => !knownIds.has(w.id));
    
    const sortedCombat = [
        hpW,
        acTotalW,
        ...bodyArmors,
        unarmoredW,
        shieldW,
        ...customWeapons,
        acModW,
        backstabW,
        ...defaultAttacks
    ].filter(Boolean);
    
    engine.savedQueues = [
        ...otherWidgets,
        ...nonCombatWidgets,
        ...sortedCombat
    ];
}

const ShadowdarkParser = {
    name: 'Shadowdarklings (Shadowdark)',
    detect(data) {
        return data && typeof data === 'object' && 
               (data.stats || data.rolledStats) &&
               data.ancestry !== undefined && 
               data.class !== undefined;
    },
    parse: function(data, ctx) {
        const templates = ctx.templates;
        const activeCampaignId = ctx.activeCampaignId;
        const COLOR_PALETTE = ctx.COLOR_PALETTE;

        // 1. Get the template
        const tpl = templates.find(t => t.id === 'template_sd_character');
        
        // 2. Spawn character
        const newCharId = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newChar = {
            id: newCharId,
            name: data.name || 'Imported Character',
            dndType: (tpl && tpl.dndType) ? tpl.dndType : 'standard',
            campaignId: activeCampaignId,
            variables: JSON.parse(JSON.stringify((tpl && tpl.variables) ? tpl.variables : {}))
        };

        const groupIdMap = {};
        const newGroups = (tpl ? tpl.groups : []).map((g, idx) => {
            const newGrpId = 'grp_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
            groupIdMap[g.id] = newGrpId;
            return {
                id: newGrpId,
                name: g.name,
                color: g.color || '#00d4ff',
                characterId: newCharId
            };
        });

        const newWidgets = (tpl ? tpl.widgets : []).map((w, idx) => {
            const prefix = w.id || 'w';
            const newWId = prefix + '_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
            return {
                ...JSON.parse(JSON.stringify(w)),
                id: newWId,
                characterId: newCharId,
                groupId: groupIdMap[w.groupId] || null
            };
        });

        // Check if a passives group exists or add it
        let passivesGrpId = groupIdMap['passives'];
        if (!passivesGrpId) {
            const existingPassivesGrp = newGroups.find(g => g.name.toLowerCase() === 'passives');
            if (existingPassivesGrp) {
                passivesGrpId = existingPassivesGrp.id;
            } else {
                passivesGrpId = 'grp_' + Date.now() + '_passives_' + Math.random().toString(36).substring(2, 5);
                newGroups.push({
                    id: passivesGrpId,
                    name: 'Passives',
                    color: '#10b981',
                    characterId: newCharId
                });
            }
        }

        // Embed Compendiums
        const WEAPON_COMPENDIUM = {
            "bastard sword": { name: "Bastard Sword", properties: ["Versatile"], range: "Close", type: "Melee", damage: { oneHanded: "1d8", twoHanded: "1d10" } },
            "greataxe": { name: "Greataxe", properties: ["Versatile"], range: "Close", type: "Melee", damage: { oneHanded: "1d8", twoHanded: "1d10" } },
            "staff": { name: "Staff", properties: ["Versatile"], range: "Close", type: "Melee", damage: { twoHanded: "1d4" } },
            "javelin": { name: "Javelin", properties: ["Thrown"], range: "Close/Far", type: "MeleeRanged", damage: { oneHanded: "1d4" } },
            "dagger": { name: "Dagger", properties: ["Finesse", "Thrown"], range: "Close/Near", type: "MeleeRanged", damage: { oneHanded: "1d4" } },
            "dagger (obsidian)": { name: "Dagger (obsidian)", properties: ["Finesse", "Thrown"], range: "Close/Near", type: "MeleeRanged", damage: { oneHanded: "1d4" } },
            "longbow": { name: "Longbow", properties: [], range: "Far", type: "Ranged", damage: { twoHanded: "1d8" } },
            "shortbow": { name: "Shortbow", properties: [], range: "Far", type: "Ranged", damage: { twoHanded: "1d4" } },
            "club": { name: "Club", properties: [], range: "Close", type: "Melee", damage: { oneHanded: "1d4" } },
            "greatsword": { name: "Greatsword", properties: [], range: "Close", type: "Melee", damage: { twoHanded: "1d12" } },
            "longsword": { name: "Longsword", properties: [], range: "Close", type: "Melee", damage: { oneHanded: "1d8" } },
            "shortsword": { name: "Shortsword", properties: [], range: "Close", type: "Melee", damage: { oneHanded: "1d6" } },
            "spear": { name: "Spear", properties: ["Thrown"], range: "Close/Near", type: "MeleeRanged", damage: { oneHanded: "1d6" } },
            "crossbow": { name: "Crossbow", properties: ["Loading"], range: "Far", type: "Ranged", damage: { twoHanded: "1d6" } },
            "mace": { name: "Mace", properties: [], range: "Close", type: "Melee", damage: { oneHanded: "1d6" } },
            "warhammer": { name: "Warhammer", properties: [], range: "Close", type: "Melee", damage: { twoHanded: "1d10" } },
            "whip": { name: "Whip", properties: ["Finesse"], range: "Near", type: "Melee", damage: { oneHanded: "1d4" } }
        };

        const ARMOR_COMPENDIUM = {
            "leather armor": { base: 11, addDex: true },
            "leather": { base: 11, addDex: true },
            "chainmail": { base: 13, addDex: true },
            "plate mail": { base: 15, addDex: false },
            "plate": { base: 15, addDex: false },
            "brigandine": { base: 12, addDex: true },
            "hide": { base: 12, addDex: true },
            "hide armor": { base: 12, addDex: true },
            "studded": { base: 12, addDex: true },
            "studded leather": { base: 12, addDex: true },
            "mithril plate": { base: 15, addDex: false },
            "mithril plate mail": { base: 15, addDex: false },
            "mithril chainmail": { base: 13, addDex: true }
        };

        function findWeaponInfo(wpName) {
            const nameLower = (wpName || '').toLowerCase().trim();
            if (WEAPON_COMPENDIUM[nameLower]) {
                return WEAPON_COMPENDIUM[nameLower];
            }
            for (const [key, info] of Object.entries(WEAPON_COMPENDIUM)) {
                if (nameLower.includes(key)) {
                    return info;
                }
            }
            return null;
        }

        function findArmorInfo(armName) {
            const nameLower = (armName || '').toLowerCase().trim();
            if (ARMOR_COMPENDIUM[nameLower]) {
                return ARMOR_COMPENDIUM[nameLower];
            }
            for (const [key, info] of Object.entries(ARMOR_COMPENDIUM)) {
                if (nameLower.includes(key)) {
                    return info;
                }
            }
            return null;
        }

        function formatFeatureDescription(desc) {
            if (!desc) return '';
            const varnames = new Set(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'HP', 'AC', 'XP', 'ADV', 'DIS', 'DC']);
            return desc.replace(/(?:\s+|^)([A-Z]{2,}(?::|\b))/g, (match, word) => {
                const cleanWord = word.replace(/[^A-Z]/g, '');
                if (varnames.has(cleanWord)) {
                    return match;
                }
                return '\n' + word;
            }).trim();
        }

        // Build a map of features (ancestry, bonuses, level talents)
        const featuresMap = new Map();

        function normalizeSourceName(sourceName) {
            if (!sourceName) return 'Class';
            let cleaned = sourceName.replace(/\(Class\)/gi, '').replace(/\(Ancestry\)/gi, '').trim();
            if (cleaned.toLowerCase().includes('wizard')) return 'Wizard';
            if (cleaned.toLowerCase().includes('priest') || cleaned.toLowerCase().includes('cleric')) return 'Priest';
            if (cleaned.toLowerCase().includes('fighter')) return 'Fighter';
            if (cleaned.toLowerCase().includes('thief')) return 'Thief';
            if (cleaned.toLowerCase().includes('ranger')) return 'Ranger';
            if (cleaned.toLowerCase().includes('paladin')) return 'Paladin';
            if (cleaned.toLowerCase().includes('warlock')) return 'Warlock';
            if (cleaned.toLowerCase().includes('bard')) return 'Bard';
            if (cleaned.toLowerCase().includes('druid')) return 'Druid';
            return cleaned;
        }

        function normalizeTalentName(name, desc) {
            const nameUpper = (name || '').toUpperCase();
            const descUpper = (desc || '').toUpperCase();
            
            if (nameUpper.includes('SPELL MASTERY') || nameUpper.includes('ADVONCASTONESPELL') || descUpper.includes('ADVANTAGE WHEN CASTING') || descUpper.includes('ADVANTAGE ON CASTING') || descUpper.includes('SPELL MASTERY')) {
                return 'SPELL MASTERY';
            }
            if (nameUpper.includes('STAT BONUS') || nameUpper.includes('STATBONUS') || descUpper.includes('+2 TO ') || (descUpper.includes('+2') && descUpper.includes('INTELLIGENCE')) || (descUpper.includes('+2') && descUpper.includes('STRENGTH')) || (descUpper.includes('+2') && descUpper.includes('DEXTERITY')) || (descUpper.includes('+2') && descUpper.includes('CONSTITUTION')) || (descUpper.includes('+2') && descUpper.includes('WISDOM')) || (descUpper.includes('+2') && descUpper.includes('CHARISMA'))) {
                return 'STAT BONUS';
            }
            if (nameUpper.includes('CASTING') || descUpper.includes('+1 TO WIZARD SPELL CASTING') || descUpper.includes('+1 TO WIZARD SPELLCASTING') || descUpper.includes('+1 TO PRIEST SPELL CASTING') || descUpper.includes('+1 TO PRIEST SPELLCASTING') || descUpper.includes('SPELL CASTING ROLLS') || descUpper.includes('SPELLCASTING ROLLS') || descUpper.includes('SPELL CASTING') || descUpper.includes('SPELLCASTING')) {
                return 'CASTING';
            }
            return name;
        }

        function parseStatBonusModifiers(desc) {
            return []; // Core stats are initialized to final values; no need to double-apply stat modifiers from talents
            const descLower = desc.toLowerCase();
            const mods = [];
            const stats = {
                'strength': 'STR',
                'dexterity': 'DEX',
                'constitution': 'CON',
                'intelligence': 'INT',
                'wisdom': 'WIS',
                'charisma': 'CHA'
            };
            for (const [statName, varName] of Object.entries(stats)) {
                const regex = new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?${statName}`, 'i');
                const match = descLower.match(regex);
                if (match) {
                    mods.push({ variable: varName, value: parseInt(match[1]) || 2 });
                }
            }
            return mods;
        }

        function cleanFeatureName(name) {
            if (!name) return '';
            let prefix = '';
            let namePart = name;
            const prefixMatch = name.match(/^([A-Z\s0-9_]+-\d+):(.*)$/i);
            if (prefixMatch) {
                prefix = prefixMatch[1].trim().toUpperCase() + ': ';
                namePart = prefixMatch[2];
            }
            
            // Extract parenthesized choice suffix if uppercase/choice-like
            let choiceSuffix = "";
            const choiceMatch = namePart.match(/\s*\(([^)]+)\)$/);
            if (choiceMatch) {
                const inside = choiceMatch[1];
                if (inside === inside.toUpperCase() || inside.startsWith('+') || inside.startsWith('-')) {
                    choiceSuffix = ` (${inside})`;
                    namePart = namePart.substring(0, choiceMatch.index);
                }
            }
            
            let cleaned = namePart.replace(/\bpassive\b/gi, '');
            cleaned = cleaned.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
            cleaned = cleaned.replace(/_/g, ' ');
            cleaned = cleaned.replace(/\s*\([^)]+\)/g, '');
            cleaned = cleaned.replace(/^(half-orc|human|elf|dwarf|halfling|goblin|wizard|priest|cleric|druid|ranger|paladin|warlock|bard|fighter|thief|class|ancestry|pit fighter)[\s:-]+/i, '');
            cleaned = cleaned.replace(/^(human|half-orc|elf|dwarf|halfling|goblin|wizard|priest|cleric|druid|ranger|paladin|warlock|bard|fighter|thief)\s+(?=\w)/i, '');
            cleaned = cleaned.replace(/[\s:-]+/g, ' ');
            const result = cleaned.trim().toUpperCase();
            const SD_NAME_MAPPINGS = {
                'IGNORE ONE ATTACK': 'WALK IT OFF',
                'IGNOREONEATTACK': 'WALK IT OFF'
            };
            const mapped = SD_NAME_MAPPINGS[result] || result;
            
            if (mapped === 'WALK IT OFF') {
                return 'WALK IT OFF';
            }
            
            let finalResult = mapped;
            return (finalResult + choiceSuffix).toUpperCase();
        }

        function addOrUpdateFeature(name, level, desc, mods, category) {
            if (!name || !name.trim()) return;

            if (!/^[a-zA-Z\s0-9_]+-\d+:/i.test(name)) {
                let parts = name.split(':').map(p => p.trim());
                if (parts.length >= 2) {
                    const firstLower = parts[0].toLowerCase();
                    const knownSources = ['half-orc', 'human', 'elf', 'dwarf', 'halfling', 'goblin', 'wizard', 'priest', 'cleric', 'druid', 'ranger', 'paladin', 'warlock', 'bard', 'fighter', 'thief', 'pit fighter', 'class', 'ancestry'];
                    if (knownSources.includes(firstLower)) {
                        parts.shift();
                    }
                }
                if (parts.length >= 2) {
                    name = parts[0];
                    desc = parts.slice(1).join(': ').trim() + (desc ? '\n' + desc : '');
                } else if (parts.length === 1) {
                    name = parts[0];
                }
            }

            const formattedDesc = formatFeatureDescription(desc);
            const key = `${name.toLowerCase().trim()}_${level}`;
            if (featuresMap.has(key)) {
                const existing = featuresMap.get(key);
                if (formattedDesc && (!existing.desc || existing.desc.length < formattedDesc.length)) {
                    existing.desc = formattedDesc;
                }
                if (mods && mods.length > 0) {
                    mods.forEach(m => {
                        if (!existing.mods.some(em => em.variable === m.variable)) {
                            existing.mods.push(m);
                        }
                    });
                }
            } else {
                featuresMap.set(key, {
                    name: name.trim(),
                    level: level,
                    desc: formattedDesc || '',
                    mods: mods || [],
                    category: category || ''
                });
            }
        }

        // Ancestry detection
        const ancestry = data.ancestry || 'Human';
        if (ancestry.toLowerCase().includes('half-orc') || ancestry.toLowerCase().includes('halforc')) {
            addOrUpdateFeature(
                'Mighty (Half-Orc)',
                1,
                'You gain +1 to melee attack and damage rolls. (Half-Orc Ancestry Trait)',
                [
                    { variable: 'Attack_Melee', value: 1 },
                    { variable: 'Damage_Melee', value: 1 }
                ],
                'Ancestry'
            );
        } else if (ancestry.toLowerCase().includes('human')) {
            addOrUpdateFeature(
                'Human Ambition',
                1,
                'You gain one additional random talent at character creation. (Human Ancestry Trait)',
                [],
                'Ancestry'
            );
        } else if (ancestry.toLowerCase().includes('elf')) {
            addOrUpdateFeature(
                'Farsight (Elf)',
                1,
                'You gain +1 to far ranged weapon attack rolls. (Elf Ancestry Trait)',
                [
                    { variable: 'Attack_Ranged', value: 1 }
                ],
                'Ancestry'
            );
        } else if (ancestry.toLowerCase().includes('dwarf')) {
            addOrUpdateFeature(
                'Stout (Dwarf)',
                1,
                'You gain +2 maximum hit points at character creation. (Dwarf Ancestry Trait)',
                [],
                'Ancestry'
            );
        } else if (ancestry.toLowerCase().includes('halfling')) {
            addOrUpdateFeature(
                'Stealthy (Halfling)',
                1,
                'You gain advantage on stealth checks. (Halfling Ancestry Trait)',
                [],
                'Ancestry'
            );
        } else if (ancestry.toLowerCase().includes('goblin')) {
            addOrUpdateFeature(
                'Sneaky (Goblin)',
                1,
                'You gain advantage on stealth/sneaking checks. (Goblin Ancestry Trait)',
                [],
                'Ancestry'
            );
        }

        // Populate class features from rules compendium
        const CLASS_FEATURES_COMPENDIUM = {
            "wizard": [
                {
                    name: "WIZARD-1: LEARNING SPELLS",
                    desc: "You can learn a wizard spell from a scroll with DC 15 INT check."
                },
                {
                    name: "WIZARD-1: WIZARD SPELLCASTING",
                    desc: "To cast a Wizard spell, roll 1d20 + INT modifier + Spellcheck vs a DC equal to 10 + the spell's tier."
                }
            ],
            "pit fighter": [
                {
                    name: "FLOURISH",
                    desc: "3/day, regain 1d6 hit points when you hit with a melee attack."
                },
                {
                    name: "IMPLACABLE",
                    desc: "ADV on CON checks to resist injury, poison, or endure extreme environments."
                },
                {
                    name: "LAST STAND",
                    desc: "You get up from dying with 1 hit point on a natural 20."
                },
                {
                    name: "RELENTLESS",
                    desc: "1/day, when you would be reduced to 0 hit points, you are reduced to 1 hit point instead."
                }
            ],
            "ranger": [
                {
                    name: "HERBALISM",
                    desc: "INT check to prepare a herbal remedy you choose. If fail can't try to prepare that remedy again until rested. HERBS: [DC 11] SALVE: Heal 1HP, [DC 12] STIMULANT: Can't be surprised for 5 rounds, [DC 13] FOEBANE: ADV on attacks and damage vs one creature type you choose for 1d6 rounds, [DC 14] RESTORATIVE: Ends a poison or disease, [DC 15] CURATIVE: as Potion of Healing"
                },
                {
                    name: "WAYFINDER",
                    desc: "Trained in navigation, tracking, bushcraft, stealth and wild animals"
                }
            ]
        };

        if (data.class) {
            const clsLower = data.class.toLowerCase().trim();
            for (const [clsKey, features] of Object.entries(CLASS_FEATURES_COMPENDIUM)) {
                if (clsLower.includes(clsKey)) {
                    features.forEach(f => {
                        addOrUpdateFeature(f.name, 1, f.desc, [], 'Class');
                    });
                }
            }
        }

        // Parse bonuses
        const weaponMasteryList = [];
        const armorMasterList = [];
        let plus1ToHitMelee = 0;
        let plus1ToHitRanged = 0;
        let plus1ToDmgMelee = 0;
        let plus1ToDmgRanged = 0;
        let spellcheckBonus = 0;
        let backstabDiceBonus = 0;
        let advInitiative = false;
        const weaponDamageD12List = [];

        if (data.bonuses) {
            data.bonuses.forEach(b => {
                const bName = (b.name || '').toLowerCase();
                const bBonusName = (b.bonusName || '').toLowerCase();
                const bBonusTo = (b.bonusTo || '').toLowerCase();
                const bDesc = (b.desc || b.talentRolledDesc || '').toLowerCase();
                const amount = parseInt(b.bonusAmount) || 1;

                if (bName === 'weaponmastery' || bBonusName === 'weaponmastery') {
                    weaponMasteryList.push({ weapon: bBonusTo.trim().toLowerCase(), amount: amount });
                } else if (bName === 'armormaster' || bBonusName === 'armormaster') {
                    armorMasterList.push({ armor: bBonusTo.trim().toLowerCase(), amount: amount });
                } else if (bName === 'backstabincrease' || bBonusName === 'backstabincrease') {
                    backstabDiceBonus += amount;
                } else if (bName === 'plus1tohit' || bBonusName === 'plus1tohit') {
                    plus1ToHitMelee += amount;
                    plus1ToHitRanged += amount;
                } else if (bName === 'plus1tohitanddamage' || bBonusName === 'plus1tohitanddamage') {
                    if (bBonusTo.includes('ranged')) {
                        plus1ToHitRanged += amount;
                        plus1ToDmgRanged += amount;
                    } else {
                        plus1ToHitMelee += amount;
                        plus1ToDmgMelee += amount;
                    }
                } else if (bBonusName === 'plus1tocastingspells' || bName === 'plus1tocastingspells' || 
                           (bName === 'plustwointorplusonewizcasting' && bBonusTo === 'wizard') ||
                           (bName === 'plustwointorplusonewizcasting' && bBonusName === 'plus1tocastingspells')) {
                    spellcheckBonus += amount;
                } else if (bName === 'advoninitiative' || bBonusName === 'advoninitiative') {
                    advInitiative = true;
                } else if (bName === 'setweapontypedamage' || bBonusName === 'setweapontypedamage') {
                    const wpName = bBonusTo.split(':')[0].trim().toLowerCase();
                    weaponDamageD12List.push(wpName);
                }
            });
        }

        // Talent / Abilities detection from data.bonuses & levels
        const rawTalents = [];

        if (data.bonuses) {
            data.bonuses.forEach(b => {
                if (b.sourceCategory === 'Talent' || b.sourceCategory === 'Ability' || b.sourceCategory === 'Item' || b.sourceType === 'Item') {
                    if (b.bonusTo && b.bonusTo.startsWith('Tier:')) return;
                    if (b.bonusTo === 'Languages') return;
                    
                    const mods = [];
                    const bNameLower = (b.bonusName || '').toLowerCase();
                    const bToLower = (b.bonusTo || '').toLowerCase();
                    const descLower = (b.talentRolledDesc || b.desc || '').toLowerCase();
                    const amount = parseInt(b.bonusAmount) || 1;

                    const isWeaponMastery = b.name === 'WeaponMastery' || b.bonusName === 'WeaponMastery';
                    const isArmorMaster = b.name === 'ArmorMaster' || b.bonusName === 'ArmorMaster';

                    if (!isWeaponMastery && !isArmorMaster) {
                        // Parse stat bonus modifiers (like +2 to Intelligence)
                        const statMods = parseStatBonusModifiers(descLower);
                        if (statMods.length > 0) mods.push(...statMods);

                        // Also parse from b.bonusTo if it defines a stat bonus (e.g. "INT:+2")
                        if (b.bonusTo && /^([A-Z]{3}):\+?(-?\d+)/i.test(b.bonusTo)) {
                            const match = b.bonusTo.match(/^([A-Z]{3}):\+?(-?\d+)/i);
                            const varName = match[1].toUpperCase();
                            const val = parseInt(match[2]) || 0;
                            const coreStats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
                            if (!coreStats.includes(varName) && !mods.some(m => m.variable === varName)) {
                                mods.push({ variable: varName, value: val });
                            }
                        }

                        if (bNameLower.includes('plus1tocastingspells') || 
                            bToLower.includes('spellcasting') || 
                            bToLower.includes('spell casting') || 
                            (descLower.includes('spellcasting check') && !descLower.includes(' or ')) || 
                            (descLower.includes('spell casting check') && !descLower.includes(' or ')) || 
                            descLower.includes('spell casting rolls') ||
                            descLower.includes('spellcasting rolls') ||
                            (bNameLower.includes('plustwointorplusonewizcasting') && (descLower.includes('casting') || descLower.includes('spellcasting') || descLower.includes('spell casting')) && !descLower.includes(' or '))) {
                            mods.push({ variable: 'Spellcheck', value: amount });
                        }
                        if ((descLower.includes('+1 to melee attack') || descLower.includes('+1 melee attack')) && !descLower.includes(' or ')) {
                            mods.push({ variable: 'Attack_Melee', value: amount });
                        }
                        if ((descLower.includes('+1 to melee damage') || descLower.includes('+1 melee damage')) && !descLower.includes(' or ')) {
                            mods.push({ variable: 'Damage_Melee', value: amount });
                        }
                        if ((descLower.includes('+1 to ranged attack') || descLower.includes('+1 ranged attack')) && !descLower.includes(' or ')) {
                            mods.push({ variable: 'Attack_Ranged', value: amount });
                        }
                        if ((descLower.includes('+1 to ranged damage') || descLower.includes('+1 ranged damage')) && !descLower.includes(' or ')) {
                            mods.push({ variable: 'Damage_Ranged', value: amount });
                        }
                        if (bNameLower.includes('backstabincrease') || bToLower.includes('backstabincrease')) {
                            mods.push({ variable: 'Backstab_Dice_Bonus', value: amount });
                        }
                        if (bToLower === 'ac') {
                            mods.push({ variable: 'AC_Mod', value: amount });
                        }
                    }

                    const level = b.gainedAtLevel || 1;
                    const desc = b.talentRolledDesc || b.desc || `Bonus from ${b.sourceName} (${b.sourceType})`;
                    const source = normalizeSourceName(b.sourceName || 'Class');

                    if (b.sourceCategory === 'Talent') {
                        rawTalents.push({
                            type: 'bonus',
                            level: level,
                            source: source,
                            name: b.name,
                            bonusName: b.bonusName,
                            bonusTo: b.bonusTo,
                            desc: desc,
                            mods: mods,
                            rawBonus: b
                        });
                    } else {
                        addOrUpdateFeature(b.bonusName || b.name, level, desc, mods, b.sourceCategory);
                    }
                }
            });
        }

        if (data.levels) {
            data.levels.forEach(lvl => {
                const level = lvl.level || 1;
                const source = normalizeSourceName(data.class || 'Class');
                if (lvl.talentRolledName && lvl.talentRolledName.trim()) {
                    rawTalents.push({
                        type: 'roll',
                        level: level,
                        source: source,
                        name: lvl.talentRolledName,
                        desc: lvl.talentRolledDesc
                    });
                }
                if (lvl.Rolled12ChosenTalentName && lvl.Rolled12ChosenTalentName.trim()) {
                    rawTalents.push({
                        type: 'roll',
                        level: level,
                        source: source,
                        name: lvl.Rolled12ChosenTalentName,
                        desc: lvl.Rolled12ChosenTalentDesc
                    });
                }
            });
        }

        if (data.ambitionTalentLevel) {
            const level = data.ambitionTalentLevel.level || 1;
            const source = 'Human Ambition';
            if (data.ambitionTalentLevel.talentRolledName && data.ambitionTalentLevel.talentRolledName.trim()) {
                rawTalents.push({
                    type: 'roll',
                    level: level,
                    source: source,
                    name: data.ambitionTalentLevel.talentRolledName,
                    desc: data.ambitionTalentLevel.talentRolledDesc
                });
            }
            if (data.ambitionTalentLevel.Rolled12ChosenTalentName && data.ambitionTalentLevel.Rolled12ChosenTalentName.trim()) {
                rawTalents.push({
                    type: 'roll',
                    level: level,
                    source: source,
                    name: data.ambitionTalentLevel.Rolled12ChosenTalentName,
                    desc: data.ambitionTalentLevel.Rolled12ChosenTalentDesc
                });
            }
        }

        // Group rawTalents by (source, level)
        const groupedTalents = {};
        rawTalents.forEach(t => {
            const key = `${t.source.toLowerCase().trim()}_${t.level}`;
            if (!groupedTalents[key]) {
                groupedTalents[key] = {
                    source: t.source,
                    level: t.level,
                    entries: []
                };
            }
            groupedTalents[key].entries.push(t);
        });

        // Merge each group and add to featuresMap
        Object.values(groupedTalents).forEach(group => {
            const source = group.source;
            const level = group.level;

            let hasStatBonusChoice = false;
            let statChoiceDetails = '';
            let hasCastingChoice = false;
            let castingChoiceDetails = '';
            let hasSpellMasteryChoice = false;
            let spellMasteryDetails = '';
            const allMods = [];
            const descriptions = [];

            group.entries.forEach(e => {
                if (e.desc) descriptions.push(e.desc);
                if (e.mods) allMods.push(...e.mods);

                if (e.type === 'bonus') {
                    const b = e.rawBonus;
                    const bName = (b.name || '').toLowerCase();
                    const bBonusName = (b.bonusName || '').toLowerCase();
                    const bBonusTo = (b.bonusTo || '').toLowerCase();
                    const amount = parseInt(b.bonusAmount) || 2;

                    if (bBonusName === 'statbonus' || bName === 'statbonus' || bBonusTo.includes(':+') || bBonusTo.includes(':-')) {
                        hasStatBonusChoice = true;
                        if (b.bonusTo && b.bonusTo.includes(':')) {
                            const parts = b.bonusTo.split(':');
                            const cleanVal = parts[1].replace(/^\+/, '');
                            statChoiceDetails = `+${cleanVal} ${parts[0].toUpperCase()}`;
                        } else if (b.desc && b.desc.toUpperCase().includes('+2 TO ')) {
                            const match = b.desc.toUpperCase().match(/\+2 TO ([A-Z]+)/);
                            if (match) {
                                statChoiceDetails = `+2 ${match[1].substring(0, 3)}`;
                            } else {
                                statChoiceDetails = `+2 INT`;
                            }
                        } else {
                            statChoiceDetails = `+2 INT`;
                        }
                    }
                    if (bBonusName === 'plus1tocastingspells' || bName === 'plus1tocastingspells' || bBonusTo === 'wizard' || bBonusTo === 'priest') {
                        if (bBonusName === 'plus1tocastingspells' || bName === 'plus1tocastingspells') {
                            hasCastingChoice = true;
                            castingChoiceDetails = `+1 CASTING`;
                        }
                    }
                    if (bBonusTo === 'advoncastonespell' || bName === 'advoncastonespell') {
                        hasSpellMasteryChoice = true;
                        if (b.bonusName) {
                            spellMasteryDetails = b.bonusName.toUpperCase();
                        }
                    }
                }
            });

            let mergedName = '';
            const levelStr = `${source.toUpperCase()}-${level}`;

            if (hasSpellMasteryChoice) {
                mergedName = `${levelStr}: SPELL MASTERY (${spellMasteryDetails})`;
            } else if (hasStatBonusChoice) {
                mergedName = `${levelStr}: STAT BONUS (${statChoiceDetails})`;
            } else if (hasCastingChoice) {
                mergedName = `${levelStr}: SPELLCASTING (${castingChoiceDetails})`;
            } else {
                const firstEntry = group.entries[0];
                const cleanedName = cleanFeatureName(firstEntry.name || firstEntry.bonusName || '');
                if (cleanedName.includes(':')) {
                    mergedName = cleanedName;
                } else {
                    mergedName = `${levelStr}: ${cleanedName}`;
                }
            }

            const uniqueDescs = Array.from(new Set(descriptions.map(d => d.trim()))).filter(Boolean);
            const mergedDesc = uniqueDescs.join('\n\n');

            const uniqueMods = [];
            allMods.forEach(m => {
                if (!uniqueMods.some(um => um.variable === m.variable)) {
                    uniqueMods.push(m);
                }
            });

            addOrUpdateFeature(mergedName, level, mergedDesc, uniqueMods, 'Talent');
        });

        // Sum passive modifier variables locally (to adjust weapons magic bonuses calculations)
        let attackMeleeMod = 0;
        let attackRangedMod = 0;
        let damageMeleeMod = 0;
        let damageRangedMod = 0;
        let spellcheckMod = 0;

        Array.from(featuresMap.values()).forEach(f => {
            if (f.mods) {
                f.mods.forEach(m => {
                    if (m.variable === 'Attack_Melee') attackMeleeMod += m.value;
                    if (m.variable === 'Attack_Ranged') attackRangedMod += m.value;
                    if (m.variable === 'Damage_Melee') damageMeleeMod += m.value;
                    if (m.variable === 'Damage_Ranged') damageRangedMod += m.value;
                    if (m.variable === 'Spellcheck') spellcheckMod += m.value;
                });
            }
        });

        // 3. Stats widgets mapping
        if (data.stats) {
            const statsMap = {
                STR: 'w_score_str', DEX: 'w_score_dex', CON: 'w_score_con',
                INT: 'w_score_int', WIS: 'w_score_wis', CHA: 'w_score_cha'
            };
            Object.keys(statsMap).forEach(statKey => {
                const val = data.stats[statKey];
                if (val !== undefined) {
                    const statW = newWidgets.find(w => w.id.includes(statsMap[statKey]));
                    if (statW) {
                        statW.value = val;
                    }
                    newChar.variables[statKey] = String(val);
                }
            });
        }

        // Apply HP and XP and LVL and Alignment
        const hpW = newWidgets.find(w => w.id.includes('w_hp'));
        if (hpW && data.maxHitPoints !== undefined) {
            hpW.max = data.maxHitPoints;
            hpW.value = data.maxHitPoints;
        }
        const xpW = newWidgets.find(w => w.id.includes('w_xp'));
        if (xpW && data.XP !== undefined) {
            xpW.value = data.XP;
        }
        const lvlW = newWidgets.find(w => w.id.includes('w_level'));
        if (lvlW && data.level !== undefined) {
            lvlW.value = data.level;
        }
        const classW = newWidgets.find(w => w.id.includes('w_class'));
        if (classW && data.class) {
            classW.name = data.class;
        }
        const alignW = newWidgets.find(w => w.id.includes('w_alignment'));
        if (alignW && data.alignment) {
            alignW.name = data.alignment;
        }
        const titleW = newWidgets.find(w => w.id.includes('w_title'));
        if (titleW && data.title) {
            titleW.name = data.title;
        }
        const ancestryW = newWidgets.find(w => w.id.includes('w_ancestry'));
        if (ancestryW && data.ancestry) {
            ancestryW.name = data.ancestry;
        }
        const bgW = newWidgets.find(w => w.id.includes('w_background'));
        if (bgW && data.background) {
            bgW.name = data.background;
        }
        const deityW = newWidgets.find(w => w.id.includes('w_deity'));
        if (deityW && data.deity) {
            deityW.name = data.deity;
        }
        const langW = newWidgets.find(w => w.id.includes('w_languages'));
        if (langW && data.languages) {
            langW.name = data.languages;
        }
        const goldW = newWidgets.find(w => w.id.includes('w_gold'));
        if (goldW && data.gold !== undefined) {
            goldW.value = data.gold;
        }

        // Apply Initiative Advantage
        const initW = newWidgets.find(w => w.id.includes('w_initiative'));
        if (initW && advInitiative) {
            initW.includeAdvDis = true;
        }

        // 4. Armor parsing
        const bodyArmorWidgets = [];
        let hasShield = false;

        let armorList = data.armor || [];
        if (armorList.length === 0 && data.gear) {
            armorList = data.gear.filter(g => g.type === 'armor');
        }

        if (armorList.length > 0) {
            armorList.forEach(item => {
                const nameLower = (item.name || '').toLowerCase();
                if (nameLower.includes('shield')) {
                    hasShield = true;
                } else {
                    const baseInfo = findArmorInfo(item.name);
                    if (baseInfo) {
                        const armorId = 'w_armor_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                        const armorQueue = [
                            { nodeType: 'modifier', type: 'literal', value: baseInfo.base, operator: '+' }
                        ];
                        if (baseInfo.addDex) {
                            armorQueue.push(
                                { nodeType: 'operator', operator: '+' },
                                { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+' }
                            );
                        }

                        // Apply ArmorMaster AC bonus if applicable
                        const amBonus = armorMasterList.find(am => nameLower.includes(am.armor));
                        if (amBonus) {
                            armorQueue.push(
                                { nodeType: 'operator', operator: '+' },
                                { nodeType: 'modifier', type: 'literal', value: amBonus.amount, operator: '+' }
                            );
                        }
                        
                        const bodyArmorWidget = {
                            id: armorId,
                            characterId: newCharId,
                            groupId: groupIdMap['combat'],
                            name: item.name,
                            color: '#00d4ff',
                            widgetType: 'number',
                            bindsVariable: 'AC_Armor',
                            variableRelType: 'define',
                            addonToggle: {
                                labelOn: 'Equipped',
                                labelOff: 'Unequipped',
                                checked: false
                            },
                            unifiedQueue: armorQueue
                        };
                        bodyArmorWidgets.push(bodyArmorWidget);
                    }
                }
            });
        }
        
        const shieldW = newWidgets.find(w => w.id.includes('w_shield') || w.name === 'Shield');
        if (shieldW) {
            shieldW.addonToggle.checked = hasShield;
            // Shield AC bonus from ArmorMaster
            const shieldAmBonus = armorMasterList.find(am => am.armor.includes('shield'));
            if (shieldAmBonus && shieldW.unifiedQueue) {
                shieldW.unifiedQueue.push(
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: shieldAmBonus.amount, operator: '+' }
                );
            }
        }
        
        if (bodyArmorWidgets.length > 0) {
            // Equip only the first body armor widget
            bodyArmorWidgets[0].addonToggle.checked = true;
            
            const unarmoredIdx = newWidgets.findIndex(w => w.id.includes('w_armor') && w.name === 'Unarmored');
            if (unarmoredIdx > -1) {
                newWidgets.splice(unarmoredIdx, 0, ...bodyArmorWidgets);
            } else {
                bodyArmorWidgets.forEach(w => newWidgets.push(w));
            }
            
            const unarmoredW = newWidgets.find(w => w.id.includes('w_armor') && w.name === 'Unarmored');
            if (unarmoredW) {
                unarmoredW.addonToggle.checked = false;
            }
        }

        // 5. Gear mapping: combine normal gear and magic items sequentially
        const allGearItems = [];
        if (data.gear) {
            data.gear.forEach(g => {
                allGearItems.push({
                    name: g.name,
                    quantity: g.quantity || 1,
                    slots: g.slots !== undefined ? g.slots : 1,
                    cost: g.cost || 0,
                    currency: g.currency || 'gp',
                    isMagic: false,
                    raw: g
                });
            });
        }
        if (data.magicItems) {
            data.magicItems.forEach(mi => {
                allGearItems.push({
                    name: mi.name,
                    quantity: 1,
                    slots: mi.slots !== undefined ? mi.slots : 1,
                    cost: 0,
                    currency: 'gp',
                    isMagic: true,
                    raw: mi
                });
            });
        }

        let slotNum = 1;
        allGearItems.forEach(item => {
            const gearWidget = newWidgets.find(w => w.id.includes(`w_gear_${slotNum}`));
            if (gearWidget) {
                gearWidget.name = item.name;
                
                const infoParts = [
                    `Quantity: ${item.quantity}`,
                    `Slots: ${item.slots}`
                ];
                if (item.cost > 0) {
                    infoParts.push(`Cost: ${item.cost} ${item.currency}`);
                }
                const gearInfoStr = infoParts.join(' | ');
                gearWidget.detailText = `${slotNum}. - ${gearInfoStr}`;
                
                if (item.isMagic) {
                    const details = [];
                    const mi = item.raw;
                    if (mi.benefits) details.push(`Benefits: ${mi.benefits}`);
                    if (mi.features) details.push(`Features: ${mi.features}`);
                    if (mi.personalityTraits) details.push(`Personality: ${mi.personalityTraits}`);
                    if (mi.personalityVirtue) details.push(`Virtue: ${mi.personalityVirtue}`);
                    if (mi.personalityFlaws) details.push(`Flaws: ${mi.personalityFlaws}`);
                    if (mi.curses) details.push(`Curses: ${mi.curses}`);
                    if (mi.bonusNote) details.push(`Note: ${mi.bonusNote}`);
                    if (mi.attackNote) details.push(`Attack Note: ${mi.attackNote}`);
                    
                    gearWidget.text = details.join('\n\n');
                    gearWidget.collapsed = true;
                } else {
                    gearWidget.text = "";
                    gearWidget.collapsed = true;
                }
            }
            
            const slotsToConsume = item.slots;
            if (slotsToConsume > 1) {
                for (let extra = 1; extra < slotsToConsume; extra++) {
                    slotNum++;
                    const extraWidget = newWidgets.find(w => w.id.includes(`w_gear_${slotNum}`));
                    if (extraWidget) {
                        extraWidget.name = `... extra slot`;
                        extraWidget.detailText = `${slotNum}.`;
                        extraWidget.text = `Occupied by extra slot for ${item.name}`;
                        extraWidget.collapsed = true;
                    }
                }
            }
            slotNum++;
        });

        // 6. Weapon attacks mapping (using Attack_Melee / Damage_Melee etc.)
        const strValVal = data.stats.STR || 10;
        const dexValVal = data.stats.DEX || 10;
        const parsedStrMod = Math.floor((strValVal - 10) / 2);
        const parsedDexMod = Math.floor((dexValVal - 10) / 2);

        let weaponColorIdx = 0;
        if (data.attacks) {
            data.attacks.forEach(attackStr => {
                if (attackStr.trim().startsWith('SPELLS:') || attackStr.toLowerCase().includes('to cast a')) {
                    return;
                }
                
                let name = "Weapon Attack";
                let bonus = 0;
                let damage = "1d6";
                let notes = "";
                
                const parts = attackStr.split(':');
                if (parts.length >= 2) {
                    name = parts[0].trim();
                    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    
                    const remaining = parts.slice(1).join(':').trim();
                    const commaIdx = remaining.indexOf(',');
                    if (commaIdx !== -1) {
                        const attackPart = remaining.substring(0, commaIdx).trim();
                        const damagePart = remaining.substring(commaIdx + 1).trim();
                        
                        const bonusMatch = attackPart.match(/^([+-]?\d+)/);
                        if (bonusMatch) {
                            bonus = parseInt(bonusMatch[1]);
                        }
                        if (attackPart.includes('(N)')) {
                            notes += "Near. ";
                        }
                        
                        const dmgMatch = damagePart.match(/^(\d+d\d+(?:[+-]\d+)?)/);
                        if (dmgMatch) {
                            damage = damagePart;
                            notes += damagePart.substring(dmgMatch[1].length).trim();
                        } else {
                            damage = damagePart;
                        }
                    }
                }

                const nameLower = name.toLowerCase();
                const wInfo = findWeaponInfo(name);

                // Check properties
                const isFinesse = (wInfo && wInfo.properties.includes("Finesse")) || attackStr.toLowerCase().includes('fin') || nameLower.includes('whip') || nameLower.includes('dagger');
                const isRanged = (wInfo && wInfo.type === "Ranged") || nameLower.includes('bow') || nameLower.includes('crossbow') || nameLower.includes('sling') || nameLower.includes('pistol') || nameLower.includes('rifle') || attackStr.includes('(N)') || attackStr.includes('(F)') || notes.includes('Near') || notes.includes('Far');
                const isVersatile = (wInfo && wInfo.properties.includes("Versatile")) || damage.includes('/');

                // Dynamic stat modifier choosing for Finesse
                const attackStat = isFinesse 
                    ? (parsedDexMod >= parsedStrMod ? 'DEX_mod' : 'STR_mod')
                    : (isRanged ? 'DEX_mod' : 'STR_mod');
                
                const attackModVal = isFinesse 
                    ? Math.max(parsedStrMod, parsedDexMod)
                    : (isRanged ? parsedDexMod : parsedStrMod);

                const attackModVar = isRanged ? 'Attack_Ranged' : 'Attack_Melee';
                const currentGlobalAttackMod = isRanged ? attackRangedMod : attackMeleeMod;
                
                // Determine Weapon Mastery values
                const hasMastery = weaponMasteryList.find(wm => nameLower.includes(wm.weapon));
                const masteryBonusVal = hasMastery ? (1 + Math.floor((data.level || 1) * 0.5)) : 0;

                // Subtraction formula to isolate weapon's magical bonus
                const magicBonus = bonus - attackModVal - currentGlobalAttackMod - masteryBonusVal;

                const weaponColor = COLOR_PALETTE ? COLOR_PALETTE[weaponColorIdx % COLOR_PALETTE.length] : '#ff55aa';
                weaponColorIdx++;

                // Build Attack Widget
                const attackWId = 'w_atk_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                const attackQueue = buildAttackQueue(attackStat, attackModVar, magicBonus, masteryBonusVal);

                const attackWidget = {
                    id: attackWId,
                    characterId: newCharId,
                    groupId: groupIdMap['combat'],
                    name: `${name} Attack`,
                    color: weaponColor,
                    widgetType: 'roller',
                    includeAdvDis: true,
                    addonNote: notes ? `Notes: ${notes.trim()}` : '',
                    unifiedQueue: attackQueue
                };
                newWidgets.push(attackWidget);
                
                // Build Damage Widget(s)
                const damageModVar = isRanged ? 'Damage_Ranged' : 'Damage_Melee';
                const currentGlobalDamageMod = isRanged ? damageRangedMod : damageMeleeMod;
                const isD12Weapon = weaponDamageD12List.some(w => nameLower.includes(w));

                function parseAndPushDamageWidget(dmgFormula, labelSuffix) {
                    const damageWId = 'w_dmg_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                    const damageQueue = buildDamageQueue(dmgFormula, damageModVar, currentGlobalDamageMod, masteryBonusVal, isD12Weapon);
                    
                    const damageWidget = {
                        id: damageWId,
                        characterId: newCharId,
                        groupId: groupIdMap['combat'],
                        name: `${name} Damage${labelSuffix}`,
                        color: weaponColor,
                        widgetType: 'roller',
                        includeAdvDis: false,
                        unifiedQueue: damageQueue
                    };
                    newWidgets.push(damageWidget);
                }

                if (isVersatile) {
                    let cleanDmg = damage.split('(')[0].trim();
                    const versatileParts = cleanDmg.split('/');
                    if (versatileParts.length >= 2) {
                        parseAndPushDamageWidget(versatileParts[0].trim(), " (1-Hand)");
                        parseAndPushDamageWidget(versatileParts[1].trim(), " (2-Hand)");
                    } else if (wInfo && wInfo.damage.oneHanded && wInfo.damage.twoHanded) {
                        const cleanFormula = damage.split('(')[0].trim();
                        const dmgMatch = cleanFormula.match(/^1d\d+(?:([+-])(\d+))?$/);
                        const modifierSuffix = (dmgMatch && dmgMatch[1] && dmgMatch[2]) ? `${dmgMatch[1]}${dmgMatch[2]}` : "";
                        
                        const oneHandedFormula = `${wInfo.damage.oneHanded.numDice}${wInfo.damage.oneHanded.diceType}${modifierSuffix}`;
                        const twoHandedFormula = `${wInfo.damage.twoHanded.numDice}${wInfo.damage.twoHanded.diceType}${modifierSuffix}`;
                        parseAndPushDamageWidget(oneHandedFormula, " (1-Hand)");
                        parseAndPushDamageWidget(twoHandedFormula, " (2-Hand)");
                    } else {
                        parseAndPushDamageWidget(damage, "");
                    }
                } else {
                    parseAndPushDamageWidget(damage, "");
                }
            });
        }

        // Helper functions for building queues
        function buildAttackQueue(attackStat, attackModVar, magicBonus, masteryBonusVal) {
            const queue = [
                { nodeType: 'node', sides: 20, count: 1 },
                { nodeType: 'operator', operator: '+' },
                { nodeType: 'modifier', type: 'variable', value: attackStat, operator: '+' },
                { nodeType: 'operator', operator: '+' },
                { nodeType: 'modifier', type: 'variable', value: attackModVar, operator: '+' }
            ];

            if (masteryBonusVal > 0) {
                queue.push(
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'LVL', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'literal', divisorValue: 2, roundMode: 'down' }
                );
            }

            if (magicBonus !== 0) {
                const op = magicBonus > 0 ? '+' : '-';
                queue.push(
                    { nodeType: 'operator', operator: op },
                    { nodeType: 'modifier', type: 'literal', value: Math.abs(magicBonus), operator: op }
                );
            }
            return queue;
        }

        function buildDamageQueue(formulaStr, damageModVar, currentGlobalDamageMod, masteryBonusVal, isD12Weapon) {
            let cleanDmg = (formulaStr || '1d6').split('(')[0].trim();
            const dmgRegexMatch = cleanDmg.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
            if (dmgRegexMatch) {
                const dCount = parseInt(dmgRegexMatch[1]);
                let dSides = isD12Weapon ? 12 : parseInt(dmgRegexMatch[2]);
                const dOp = dmgRegexMatch[3] || '+';
                const dModVal = dmgRegexMatch[4] ? parseInt(dmgRegexMatch[4]) : 0;
                const signedModVal = dOp === '-' ? -dModVal : dModVal;
                
                const magicDmgBonus = signedModVal - currentGlobalDamageMod - (masteryBonusVal || 0);
                
                const queue = [
                    { nodeType: 'node', sides: dSides, count: dCount },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: damageModVar, operator: '+' }
                ];

                if (masteryBonusVal > 0) {
                    queue.push(
                        { nodeType: 'operator', operator: '+' },
                        { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' },
                        { nodeType: 'operator', operator: '+' },
                        { nodeType: 'modifier', type: 'variable', value: 'LVL', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'literal', divisorValue: 2, roundMode: 'down' }
                    );
                }

                if (magicDmgBonus !== 0) {
                    const op = magicDmgBonus > 0 ? '+' : '-';
                    queue.push(
                        { nodeType: 'operator', operator: op },
                        { nodeType: 'modifier', type: 'literal', value: Math.abs(magicDmgBonus), operator: op }
                    );
                }
                return queue;
            }
            return [{ nodeType: 'node', sides: 6, count: 1 }];
        }

        // 7. Spells known mapping
        if (data.spellsKnown && data.spellsKnown.trim().toLowerCase() !== 'none') {
            const spellList = data.spellsKnown.split(',').map(s => s.trim()).filter(Boolean);
            const clsLower = (data.class || '').trim().toLowerCase();
            const castingStatMap = {
                'wizard': 'INT',
                'priest': 'WIS',
                'cleric': 'WIS',
                'druid': 'WIS',
                'ranger': 'WIS',
                'paladin': 'WIS',
                'warlock': 'CHA',
                'bard': 'CHA'
            };
            const castStat = castingStatMap[clsLower] || 'INT';
            const castModVar = `${castStat}_mod`;

            const findSpellTier = (spellName, bonuses) => {
                if (!bonuses) return 1;
                const spellNameLower = spellName.toLowerCase().trim();
                for (const b of bonuses) {
                    const bName = (b.bonusName || '').toLowerCase().trim();
                    if (bName === spellNameLower && b.bonusTo) {
                        const tierMatch = b.bonusTo.match(/Tier:(\d+)/i);
                        if (tierMatch) return parseInt(tierMatch[1]) || 1;
                    }
                    if (bName === spellNameLower && b.name) {
                        const tierMatch = b.name.match(/Tier\s+(\d+)/i);
                        if (tierMatch) return parseInt(tierMatch[1]) || 1;
                    }
                }
                return 1;
            };
            
            const spellsWithTier = spellList.map(spellName => {
                return {
                    name: spellName,
                    tier: findSpellTier(spellName, data.bonuses)
                };
            });

            // Sort by tier ascending, then alphabetically by name
            spellsWithTier.sort((a, b) => {
                if (a.tier !== b.tier) {
                    return a.tier - b.tier;
                }
                return a.name.localeCompare(b.name);
            });

            spellsWithTier.forEach(spellObj => {
                const spellName = spellObj.name;
                const tier = spellObj.tier;
                const hasSpellAdv = data.bonuses && data.bonuses.some(b => 
                    b.bonusTo === 'AdvOnCastOneSpell' && 
                    (b.bonusName || '').toLowerCase().trim() === spellName.toLowerCase().trim()
                );
                const includeAdvDis = !!hasSpellAdv;
                const classTitle = (data.class || 'Wizard').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                const spellWId = 'w_spell_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                const spellWidget = {
                    id: spellWId,
                    characterId: newCharId,
                    groupId: groupIdMap['spells'],
                    name: spellName.toUpperCase(),
                    widgetType: 'roller',
                    includeAdvDis: includeAdvDis,
                    addonNote: `T${tier} DC ${classTitle} Spellcasting`,
                    addonToggle: {
                        checked: true,
                        labelOn: 'Ready',
                        labelOff: 'Miscast'
                    },
                    unifiedQueue: [
                        { nodeType: 'node', sides: 20, count: 1 },
                        { nodeType: 'operator', operator: '+' },
                        { nodeType: 'modifier', type: 'variable', value: castModVar, operator: '+' },
                        { nodeType: 'operator', operator: '+' },
                        { nodeType: 'modifier', type: 'variable', value: 'Spellcheck', operator: '+' }
                    ]
                };
                newWidgets.push(spellWidget);
            });
        }

        // 8. Custom talents, class abilities, magic items, and ancestry traits mapping
        Array.from(featuresMap.values()).forEach(f => {
            const isItemFeature = f.category === 'Item' || f.category === 'MagicItem' || (f.category && f.category.toLowerCase().includes('item'));
            const targetGrpId = isItemFeature ? (groupIdMap['gear'] || passivesGrpId) : passivesGrpId;

            // Generically parse source name, level, and category from the feature
            let sourceName = '';
            let sourceType = f.category || 'Class';
            let level = f.level || null;
            let hasLevelPrefix = false;

            const prefixMatch = (f.name || '').match(/^([A-Z\s0-9_-]+)-(\d+):(.*)$/i);
            if (prefixMatch) {
                const rawSource = prefixMatch[1].trim();
                level = parseInt(prefixMatch[2]) || level;
                hasLevelPrefix = true;
                sourceName = rawSource.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            if (f.desc) {
                const bonusFromMatch = f.desc.match(/Bonus from\s+([^(]+)\s*\((Class|Ancestry|Item|Talent)\)/i);
                if (bonusFromMatch) {
                    sourceName = bonusFromMatch[1].trim();
                    sourceType = bonusFromMatch[2].trim();
                }
            }

            if (!sourceName) {
                const parenMatch = (f.name || '').match(/\((Half-Orc|Human|Elf|Dwarf|Halfling|Goblin|Wizard|Priest|Cleric|Druid|Ranger|Paladin|Warlock|Bard|Fighter|Thief)\)/i);
                if (parenMatch) {
                    sourceName = parenMatch[1].trim();
                    sourceType = 'Ancestry';
                } else if (f.category) {
                    if (f.category.toLowerCase() === 'class') {
                        sourceName = data.class || 'Class';
                        sourceType = 'Class';
                    } else if (f.category.toLowerCase() === 'ancestry') {
                        sourceName = data.ancestry || 'Ancestry';
                        sourceType = 'Ancestry';
                    } else {
                        sourceName = f.category;
                        sourceType = f.category;
                    }
                }
            }

            if (sourceName) {
                if (sourceName.toLowerCase() === 'class') {
                    sourceName = data.class || 'Class';
                    sourceType = 'Class';
                } else if (sourceName.toLowerCase() === 'ancestry') {
                    sourceName = data.ancestry || 'Ancestry';
                    sourceType = 'Ancestry';
                }
                sourceName = sourceName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                const knownAncestries = ['human', 'elf', 'dwarf', 'halfling', 'goblin', 'half-orc', 'human ambition'];
                if (knownAncestries.includes(sourceName.toLowerCase()) || (f.category && f.category.toLowerCase() === 'ancestry') || (sourceType && sourceType.toLowerCase() === 'ancestry')) {
                    sourceType = 'Ancestry';
                } else if ((f.category && f.category.toLowerCase() === 'class') || (sourceType && sourceType.toLowerCase() === 'class')) {
                    sourceType = 'Class';
                }
            }

            let addonNoteVal = '';
            if (sourceName) {
                addonNoteVal = `Bonus: ${sourceName}(${sourceType})`;
                if (hasLevelPrefix && level !== null) {
                    addonNoteVal += `-${level}`;
                }
            }

            let cleanDesc = f.desc || '';
            if (cleanDesc) {
                cleanDesc = cleanDesc.replace(/Bonus from\s+[^(]+\s*\((Class|Ancestry|Item|Talent)\)/gi, '').trim();
                cleanDesc = cleanDesc.replace(/^\n+/, '').replace(/\n+$/, '').trim();
            }

            const limit = parseUsageLimit(cleanDesc);
            if (limit !== null) {
                const widget = {
                    id: 'w_feat_stepper_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    characterId: newCharId,
                    groupId: targetGrpId,
                    name: cleanFeatureName(f.name),
                    widgetType: 'stepper',
                    min: 0,
                    max: limit,
                    value: typeof limit === 'number' ? limit : (data.level || 1),
                    showTracker: true,
                    addonNote: addonNoteVal || null,
                    detailText: cleanDesc || '',
                    passiveModifiers: f.mods && f.mods.length > 0 ? f.mods : null
                };
                newWidgets.push(widget);
            } else {
                const widget = {
                    id: 'w_feat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    characterId: newCharId,
                    groupId: targetGrpId,
                    name: cleanFeatureName(f.name),
                    widgetType: 'text',
                    addonNote: addonNoteVal || null,
                    text: cleanDesc || 'No description.',
                    collapsed: true,
                    passiveModifiers: f.mods && f.mods.length > 0 ? f.mods : null
                };
                newWidgets.push(widget);
            }
        });

        // Add WEAPONS and ARMOR proficiencies to the Passives group
        const CLASS_PROFICIENCIES = {
            "fighter": {
                weapons: "All weapons",
                armor: "All armor, shields"
            },
            "pit fighter": {
                weapons: "All weapons",
                armor: "All armor, shields"
            },
            "priest": {
                weapons: "Club, mace, staff, warhammer",
                armor: "Chainmail, leather armor, plate mail, shield"
            },
            "cleric": {
                weapons: "Club, mace, staff, warhammer",
                armor: "Chainmail, leather armor, plate mail, shield"
            },
            "thief": {
                weapons: "Club, dagger, garrote, handaxe, L-crossbow, shortbow, shortsword",
                armor: "Leather armor, studded leather armor"
            },
            "wizard": {
                weapons: "Dagger, staff",
                armor: "None"
            },
            "ranger": {
                weapons: "All weapons",
                armor: "Leather armor, studded leather armor, shields"
            },
            "paladin": {
                weapons: "All weapons",
                armor: "All armor, shields"
            },
            "warlock": {
                weapons: "Club, dagger, handaxe, shortbow, shortsword, staff",
                armor: "Leather armor, studded leather armor"
            },
            "bard": {
                weapons: "Club, dagger, L-crossbow, shortbow, shortsword",
                armor: "Leather armor, studded leather armor, shields"
            },
            "druid": {
                weapons: "Club, dagger, javelin, spear, staff",
                armor: "Leather armor, studded leather armor, shields"
            }
        };
        const clsLower = (data.class || '').trim().toLowerCase();
        const prof = CLASS_PROFICIENCIES[clsLower];
        if (prof) {
            newWidgets.push({
                id: 'w_prof_weapons_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                characterId: newCharId,
                groupId: passivesGrpId,
                name: 'WEAPONS',
                widgetType: 'text',
                text: prof.weapons,
                collapsed: false
            });
            newWidgets.push({
                id: 'w_prof_armor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                characterId: newCharId,
                groupId: passivesGrpId,
                name: 'ARMOR',
                widgetType: 'text',
                text: prof.armor,
                collapsed: false
            });
        }

        // 9. Additional Metadata and Treasures mapping (putting anything unmapped in notes group as individual widgets)
        let notesGrpId = groupIdMap['notes'];
        if (!notesGrpId) {
            const existingNotesGrp = newGroups.find(g => g.name.toLowerCase() === 'notes');
            if (existingNotesGrp) {
                notesGrpId = existingNotesGrp.id;
            } else {
                notesGrpId = 'grp_' + Date.now() + '_notes_' + Math.random().toString(36).substring(2, 5);
                newGroups.push({
                    id: notesGrpId,
                    name: 'Notes',
                    color: '#ff55aa',
                    characterId: newCharId
                });
            }
        }

        const handledKeys = new Set([
            'name', 'stats', 'rolledStats', 'ancestry', 'class', 'level', 'levels',
            'XP', 'ambitionTalentLevel', 'title', 'alignment', 'background', 'deity',
            'maxHitPoints', 'armorClass', 'gearSlotsTotal', 'gearSlotsUsed', 'bonuses',
            'goldRolled', 'gold', 'silver', 'copper', 'gear', 'treasures', 'magicItems',
            'attacks', 'ledger', 'spellsKnown', 'languages', 'creationMethod', 'coreRulesOnly',
            'activeSources', 'edits'
        ]);
        Object.keys(data).forEach(key => {
            if (!handledKeys.has(key)) {
                const val = data[key];
                if (val !== null && val !== undefined) {
                    let textVal = '';
                    if (typeof val === 'object') {
                        textVal = JSON.stringify(val, null, 2);
                    } else {
                        textVal = String(val);
                    }
                    newWidgets.push({
                        id: 'w_meta_' + key + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        characterId: newCharId,
                        groupId: notesGrpId,
                        name: key.toUpperCase(),
                        widgetType: 'text',
                        text: textVal,
                        collapsed: true
                    });
                }
            }
        });

        if (data.treasures && data.treasures.length > 0) {
            const treasureLines = data.treasures.map(t => {
                const costText = t.cost ? ` (${t.cost} ${t.currency || 'gp'})` : '';
                return `- ${t.name}${costText}`;
            });
            newWidgets.push({
                id: 'w_treasures_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                characterId: newCharId,
                groupId: passivesGrpId,
                name: 'TREASURES',
                widgetType: 'text',
                text: treasureLines.join('\n'),
                collapsed: true
            });
        }

        return {
            character: newChar,
            groups: newGroups,
            widgets: newWidgets
        };
    }
};

ParserRegistry.register(ShadowdarkParser);
