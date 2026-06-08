// Assets/TemplatesData.js

// This file acts as the hardy, long-term storage for default and community templates.
// It avoids browser storage limits and CORS issues for static sites.
window.StaticDiceTemplates = [
    {
        id: 'template_sd_character',
        name: 'Shadowdark Character (Blank)',
        system: 'Shadowdark',
        dndType: 'standard',
        isDefault: true,
        variables: {
            "HP": "10",
            "MaxHP": "10",
            "AC": "10",
            "AC_Armor": "10", "AC_Shield": "0", "AC_Mod": "0",
            "LVL": "1", "XP": "0", "Gold": "0", "Luck": "0",
            "STR": "10", "DEX": "10", "CON": "10", "INT": "10", "WIS": "10", "CHA": "10",
            "STR_mod": "0", "DEX_mod": "0", "CON_mod": "0", "INT_mod": "0", "WIS_mod": "0", "CHA_mod": "0",
            "Attack_Melee": "0", "Attack_Ranged": "0", "Damage_Melee": "0", "Damage_Ranged": "0", "Spellcheck": "0", "Backstab_Dice_Bonus": "0", "Backstab_Dice": "1"
        },
        groups: [
            { id: 'stats', name: 'Stats', color: '#00d4ff' },
            { id: 'combat', name: 'Combat', color: '#ff003c' },
            { id: 'spells', name: 'Spells', color: '#b565ff' },
            { id: 'gear', name: 'Gear', color: '#ff9900' },
            { id: 'passives', name: 'Passives', color: '#10b981' },
            { id: 'notes', name: 'Notes', color: '#ff55aa' },
            { id: 'details', name: 'Details', color: '#00ff88' }
        ],
        widgets: [
            {
                id: 'w_class',
                groupId: 'details',
                name: '',
                detailText: 'Class',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_title',
                groupId: 'details',
                name: '',
                detailText: 'Title',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_ancestry',
                groupId: 'details',
                name: '',
                detailText: 'Ancestry',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_background',
                groupId: 'details',
                name: '',
                detailText: 'Background',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_deity',
                groupId: 'details',
                name: '',
                detailText: 'Deity',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_alignment',
                groupId: 'details',
                name: '',
                detailText: 'Alignment',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_languages',
                groupId: 'details',
                name: '',
                detailText: 'Languages',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_hp',
                groupId: 'combat',
                name: 'HP',
                color: '#ff003c',
                widgetType: 'stepper',
                min: 0,
                max: 10,
                value: 10,
                showTracker: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false
            },
            {
                id: 'w_ac_total',
                groupId: 'combat',
                name: 'Armor Class',
                color: '#00d4ff',
                widgetType: 'number',
                bindsVariable: 'AC',
                variableRelType: 'define',
                value: 10,
                showFormula: false,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'modifier', type: 'variable', value: 'AC_Armor', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'AC_Shield', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'AC_Mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_str',
                groupId: 'stats',
                name: 'STR CHECK [$+-$ $STR_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_dex',
                groupId: 'stats',
                name: 'DEX CHECK [$+-$ $DEX_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_con',
                groupId: 'stats',
                name: 'CON CHECK [$+-$ $CON_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CON_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_int',
                groupId: 'stats',
                name: 'INT CHECK [$+-$ $INT_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'INT_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_wis',
                groupId: 'stats',
                name: 'WIS CHECK [$+-$ $WIS_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'WIS_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_cha',
                groupId: 'stats',
                name: 'CHA CHECK [$+-$ $CHA_MOD$]',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CHA_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_luck',
                groupId: 'stats',
                name: 'Luck',
                color: '#ff9900',
                widgetType: 'stepper',
                min: 0,
                max: 1,
                value: 0,
                bindsVariable: 'Luck',
                variableRelType: 'define'
            },
            {
                id: 'w_lvl',
                groupId: 'stats',
                name: 'Level',
                widgetType: 'number',
                value: 1,
                bindsVariable: 'LVL',
                variableRelType: 'define'
            },
            {
                id: 'w_xp',
                groupId: 'stats',
                name: 'XP',
                widgetType: 'stepper',
                min: 0,
                max: 100,
                value: 0,
                bindsVariable: 'XP',
                variableRelType: 'define'
            },
            {
                id: 'w_score_str',
                groupId: 'stats',
                name: 'STR Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'STR',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_score_dex',
                groupId: 'stats',
                name: 'DEX Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'DEX',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_score_con',
                groupId: 'stats',
                name: 'CON Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'CON',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_score_int',
                groupId: 'stats',
                name: 'INT Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'INT',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_score_wis',
                groupId: 'stats',
                name: 'WIS Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'WIS',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_score_cha',
                groupId: 'stats',
                name: 'CHA Score',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'CHA',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_str',
                groupId: 'stats',
                name: 'STR Modifier',
                widgetType: 'number',
                bindsVariable: 'STR_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_mod_dex',
                groupId: 'stats',
                name: 'DEX Modifier',
                widgetType: 'number',
                bindsVariable: 'DEX_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_mod_con',
                groupId: 'stats',
                name: 'CON Modifier',
                widgetType: 'number',
                bindsVariable: 'CON_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'CON', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_mod_int',
                groupId: 'stats',
                name: 'INT Modifier',
                widgetType: 'number',
                bindsVariable: 'INT_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'INT', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_mod_wis',
                groupId: 'stats',
                name: 'WIS Modifier',
                widgetType: 'number',
                bindsVariable: 'WIS_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'WIS', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_mod_cha',
                groupId: 'stats',
                name: 'CHA Modifier',
                widgetType: 'number',
                bindsVariable: 'CHA_mod',
                variableRelType: 'define',
                value: 0,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'operator', operator: '(' },
                    { nodeType: 'modifier', type: 'variable', value: 'CHA', operator: '+' },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: ')' },
                    { nodeType: 'operator', operator: '/', roundMode: 'down' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_var_attack_melee',
                groupId: 'stats',
                name: 'Attack Melee Mod',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Attack_Melee',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_var_attack_ranged',
                groupId: 'stats',
                name: 'Attack Ranged Mod',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Attack_Ranged',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_var_damage_melee',
                groupId: 'stats',
                name: 'Damage Melee Mod',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Damage_Melee',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_var_damage_ranged',
                groupId: 'stats',
                name: 'Damage Ranged Mod',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Damage_Ranged',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_var_spellcheck',
                groupId: 'stats',
                name: 'Spellcheck Mod',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Spellcheck',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_var_backstab_dice_bonus',
                groupId: 'stats',
                name: 'Backstab Dice Bonus',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'Backstab_Dice_Bonus',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_torch_timer',
                groupId: 'stats',
                name: 'Torch Timer',
                color: '#ff9900',
                widgetType: 'timer',
                maxTime: 3600,
                currentTime: 3600,
                isPaused: true,
                diceFormula: '',
                rundownText: 'Torch Extinguished!',
                animationType: 'torches',
                detailText: 'Active Torch'
            },

            {
                id: 'w_spellcheck_int',
                groupId: 'spells',
                name: 'SPELLCHECK - INT [$+-$ {$INT_MOD$ + $SPELLCHECK$}]',
                color: '#b565ff',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'INT_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Spellcheck', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_spellcheck_wis',
                groupId: 'spells',
                name: 'SPELLCHECK - WIS [$+-$ {$WIS_MOD$ + $SPELLCHECK$}]',
                color: '#b565ff',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'WIS_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Spellcheck', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_spellcheck_cha',
                groupId: 'spells',
                name: 'SPELLCHECK - CHA [$+-$ {$CHA_MOD$ + $SPELLCHECK$}]',
                color: '#b565ff',
                widgetType: 'roller',
                includeAdvDis: true,
                showFormula: false,
                fullShowFormula: false,
                showNote: false,
                fullShowNote: false,
                showDetail: false,
                fullShowDetail: false,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CHA_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Spellcheck', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_armor',
                groupId: 'combat',
                name: 'Unarmored',
                color: '#00d4ff',
                widgetType: 'number',
                bindsVariable: 'AC_Armor',
                variableRelType: 'define',
                showFormula: false,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                addonToggle: {
                    labelOn: 'Equipped',
                    labelOff: 'Unequipped',
                    checked: true
                },
                unifiedQueue: [
                    { nodeType: 'modifier', type: 'literal', value: 10, operator: '+' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_shield',
                groupId: 'combat',
                name: 'Shield',
                color: '#00d4ff',
                widgetType: 'number',
                bindsVariable: 'AC_Shield',
                variableRelType: 'define',
                showFormula: false,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                addonToggle: {
                    labelOn: 'Equipped',
                    labelOff: 'Unequipped',
                    checked: false
                },
                unifiedQueue: [
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_ac_mod',
                groupId: 'combat',
                name: 'Misc AC Mod',
                color: '#00d4ff',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'AC_Mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_backstab_dice_display',
                groupId: 'combat',
                name: 'Backstab Dice',
                widgetType: 'number',
                bindsVariable: 'Backstab_Dice',
                variableRelType: 'define',
                value: 1,
                hidden: true,
                unifiedQueue: [
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'LVL', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'literal', divisorValue: 2, roundMode: 'down' }
                ]
            },
            {
                id: 'w_atk_melee_str',
                groupId: 'combat',
                name: 'Attack Melee - STR',
                color: '#ff9900',
                widgetType: 'roller',
                includeAdvDis: true,
                hidden: true,
                showFormula: true,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Attack_Melee', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_atk_melee_dex',
                groupId: 'combat',
                name: 'Attack Melee - DEX',
                color: '#ff9900',
                widgetType: 'roller',
                includeAdvDis: true,
                hidden: true,
                showFormula: true,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Attack_Melee', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_atk_ranged_str',
                groupId: 'combat',
                name: 'Attack Ranged - STR',
                color: '#ffdd00',
                widgetType: 'roller',
                includeAdvDis: true,
                hidden: true,
                showFormula: true,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Attack_Ranged', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_atk_ranged_dex',
                groupId: 'combat',
                name: 'Attack Ranged - DEX',
                color: '#ffdd00',
                widgetType: 'roller',
                includeAdvDis: true,
                hidden: true,
                showFormula: true,
                fullShowFormula: true,
                showNote: true,
                fullShowNote: true,
                showDetail: true,
                fullShowDetail: true,
                compactShowFormula: false,
                compactShowNote: false,
                compactShowDetail: false,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Attack_Ranged', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_gold',
                groupId: 'gear',
                name: 'Gold',
                color: '#ff9900',
                widgetType: 'stepper',
                min: 0,
                max: 999,
                value: 0,
                bindsVariable: 'Gold',
                variableRelType: 'define'
            },
            {
                id: 'w_gear_1',
                groupId: 'gear',
                name: '',
                detailText: '1.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_2',
                groupId: 'gear',
                name: '',
                detailText: '2.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_3',
                groupId: 'gear',
                name: '',
                detailText: '3.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_4',
                groupId: 'gear',
                name: '',
                detailText: '4.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_5',
                groupId: 'gear',
                name: '',
                detailText: '5.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_6',
                groupId: 'gear',
                name: '',
                detailText: '6.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_7',
                groupId: 'gear',
                name: '',
                detailText: '7.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_8',
                groupId: 'gear',
                name: '',
                detailText: '8.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_9',
                groupId: 'gear',
                name: '',
                detailText: '9.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_10',
                groupId: 'gear',
                name: '',
                detailText: '10.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_11',
                groupId: 'gear',
                name: '',
                detailText: '11.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_12',
                groupId: 'gear',
                name: '',
                detailText: '12.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_13',
                groupId: 'gear',
                name: '',
                detailText: '13.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_14',
                groupId: 'gear',
                name: '',
                detailText: '14.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_15',
                groupId: 'gear',
                name: '',
                detailText: '15.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_16',
                groupId: 'gear',
                name: '',
                detailText: '16.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_17',
                groupId: 'gear',
                name: '',
                detailText: '17.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_18',
                groupId: 'gear',
                name: '',
                detailText: '18.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_19',
                groupId: 'gear',
                name: '',
                detailText: '19.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_gear_20',
                groupId: 'gear',
                name: '',
                detailText: '20.',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_1',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_2',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_3',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_4',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_5',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            },
            {
                id: 'w_note_6',
                groupId: 'notes',
                name: '',
                detailText: '',
                widgetType: 'text',
                text: '',
                collapsed: false
            }
        ]
    },
    {
        id: 'template_sd_encounter',
        name: 'Shadowdark Encounter (Blank)',
        system: 'Shadowdark',
        dndType: 'encounter',
        isDefault: true,
        variables: {},
        groups: [
            { id: 'combat', name: 'Combat', color: '#ff003c' },
            { id: 'passives', name: 'Passives', color: '#10b981' }
        ],
        widgets: []
    },

    {
        id: 'template_sd_monster_skeleton',
        name: 'Skeleton (Shadowdark)',
        system: 'Shadowdark',
        dndType: 'monster',
        isDefault: true,
        variables: {},
        groups: [
            { id: 'combat', name: 'Combat', color: '#ff003c' }
        ],
        widgets: [
            {
                id: 'w_eg_skeletons',
                groupId: 'combat',
                name: 'Skeleton Group',
                color: '#ff9900',
                widgetType: 'entity-group',
                sharedGridId: null,
                entityTemplate: {
                    namePrefix: 'Skeleton',
                    widgets: [
                        {
                            name: 'Notes',
                            widgetType: 'text',
                            displayMode: 'micro',
                            width: 6,
                            text: ''
                        },
                        {
                            name: 'HP',
                            widgetType: 'stepper',
                            min: 0,
                            max: 11,
                            value: 11,
                            displayMode: 'micro',
                            width: 12,
                        },
                        {
                            name: 'Trigger',
                            widgetType: 'trigger',
                            displayMode: 'micro',
                            width: 6,
                            targetWidgetId: '',
                            condition: 'always',
                            conditionValue: 0,
                            action: 'show-button',
                            actionParams: {
                                label: 'Destroy',
                                actionType: 'delete-parent-entity',
                                btnColor: 'rose'
                            }
                        }
                    ]
                }
            },
            {
                id: 'w_s_skel_desc',
                parentId: 'w_eg_skeletons',
                groupId: 'combat',
                name: 'Description',
                widgetType: 'text',
                displayMode: 'compact',
                text: 'A bleach-boned skeleton with red pinpoints of light in its eyes.',
                hideName: true,
                width: 12
            },
            {
                id: 'w_g_skeleton_stats',
                parentId: 'w_eg_skeletons',
                groupId: 'combat',
                widgetType: 'grid',
                columns: 12,
                name: 'Ability Scores',
                hideName: true
            },
            {
                id: 'w_s_skel_str',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Str',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_dex',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Dex',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 0, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_con',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Con',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_int',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Int',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 2, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_wis',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Wis',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 0, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_cha',
                parentId: 'w_g_skeleton_stats',
                groupId: 'combat',
                name: 'Cha',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                width: 2,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '-' },
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' }
                ]
            },
            {
                id: 'w_g_skeleton_other',
                parentId: 'w_eg_skeletons',
                groupId: 'combat',
                widgetType: 'grid',
                columns: 12,
                name: 'Vital Stats',
                hideName: true
            },
            {
                id: 'w_s_skel_ac',
                parentId: 'w_g_skeleton_other',
                groupId: 'combat',
                name: 'AC',
                widgetType: 'number',
                displayMode: 'micro',
                width: 6,
                value: 13,
                detailText: '(chainmail)',
                showSign: false
            },
            {
                id: 'w_s_skel_al',
                parentId: 'w_g_skeleton_other',
                groupId: 'combat',
                name: 'AL',
                widgetType: 'text',
                displayMode: 'micro',
                width: 6,
                text: 'C'
            },
            {
                id: 'w_s_skel_lv',
                parentId: 'w_g_skeleton_other',
                groupId: 'combat',
                name: 'LV',
                widgetType: 'number',
                displayMode: 'micro',
                width: 6,
                value: 2,
                showSign: false
            },
            {
                id: 'w_s_skel_mv',
                parentId: 'w_g_skeleton_other',
                groupId: 'combat',
                name: 'MV',
                widgetType: 'text',
                displayMode: 'micro',
                width: 6,
                text: 'near'
            },
            {
                id: 'w_s_skel_passive',
                parentId: 'w_eg_skeletons',
                groupId: 'combat',
                name: 'Undead',
                widgetType: 'text',
                displayMode: 'compact',
                text: 'Immune to morale checks.',
                width: 12
            },
            {
                id: 'w_g_skeleton_attacks',
                parentId: 'w_eg_skeletons',
                groupId: 'combat',
                widgetType: 'grid',
                columns: 12,
                name: 'Attacks',
                hideName: true
            },
            {
                id: 'w_s_skel_atk1',
                parentId: 'w_g_skeleton_attacks',
                groupId: 'combat',
                name: 'Shortsword Atk',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                microShowFormula: false,
                width: 6,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_dmg1',
                parentId: 'w_g_skeleton_attacks',
                groupId: 'combat',
                name: 'Shortsword Dmg',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                microShowFormula: false,
                width: 6,
                unifiedQueue: [
                    { nodeType: 'node', sides: 6, count: 1 }
                ]
            },
            {
                id: 'w_s_skel_atk2',
                parentId: 'w_g_skeleton_attacks',
                groupId: 'combat',
                name: 'Shortbow Atk',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                microShowFormula: false,
                width: 6,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'literal', value: 0, operator: '+' }
                ]
            },
            {
                id: 'w_s_skel_dmg2',
                parentId: 'w_g_skeleton_attacks',
                groupId: 'combat',
                name: 'Shortbow Dmg',
                widgetType: 'roller',
                displayMode: 'micro',
                hideName: false,
                microShowFormula: false,
                width: 6,
                unifiedQueue: [
                    { nodeType: 'node', sides: 4, count: 1 }
                ]
            }
        ]
    }
];
