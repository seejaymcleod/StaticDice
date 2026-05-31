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
            "LVL": "1",
            "HP": "10",
            "MaxHP": "10",
            "AC": "10",
            "STR": "10", "DEX": "10", "CON": "10", "INT": "10", "WIS": "10", "CHA": "10",
            "STR_mod": "0", "DEX_mod": "0", "CON_mod": "0", "INT_mod": "0", "WIS_mod": "0", "CHA_mod": "0",
            "Attack_Melee": "0", "Attack_Ranged": "0", "Spellcheck": "0", "Backstab_Dice_Bonus": "0", "Backstab_Dice": "1"
        },
        groups: [
            { id: 'stats', name: 'Stats', color: '#00d4ff' },
            { id: 'combat', name: 'Combat', color: '#ff003c' },
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
                groupId: 'stats',
                name: 'HP',
                widgetType: 'stepper',
                min: 0,
                max: 10,
                value: 10,
                showTracker: true
            },
            {
                id: 'w_ac',
                groupId: 'stats',
                name: 'AC',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'AC',
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
                id: 'w_str',
                groupId: 'stats',
                name: 'Strength Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_dex',
                groupId: 'stats',
                name: 'Dexterity Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_con',
                groupId: 'stats',
                name: 'Constitution Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CON_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_int',
                groupId: 'stats',
                name: 'Intelligence Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'INT_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_wis',
                groupId: 'stats',
                name: 'Wisdom Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'WIS_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_cha',
                groupId: 'stats',
                name: 'Charisma Check',
                widgetType: 'roller',
                includeAdvDis: true,
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CHA_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
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
                value: 0,
                bindsVariable: 'STR_mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_dex',
                groupId: 'stats',
                name: 'DEX Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'DEX_mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_con',
                groupId: 'stats',
                name: 'CON Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'CON_mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_int',
                groupId: 'stats',
                name: 'INT Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'INT_mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_wis',
                groupId: 'stats',
                name: 'WIS Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'WIS_mod',
                variableRelType: 'define',
                hidden: true
            },
            {
                id: 'w_mod_cha',
                groupId: 'stats',
                name: 'CHA Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'CHA_mod',
                variableRelType: 'define',
                hidden: true
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
                id: 'w_atk_melee_str',
                groupId: 'combat',
                name: 'Attack Melee - STR',
                widgetType: 'roller',
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
                widgetType: 'roller',
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
                widgetType: 'roller',
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
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'DEX_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Attack_Ranged', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_spellcheck_int',
                groupId: 'combat',
                name: 'Spellcheck - INT',
                widgetType: 'roller',
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
                groupId: 'combat',
                name: 'Spellcheck - WIS',
                widgetType: 'roller',
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
                groupId: 'combat',
                name: 'Spellcheck - CHA',
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'CHA_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'Spellcheck', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_backstab_dice_display',
                groupId: 'combat',
                name: 'Backstab Dice',
                widgetType: 'roller',
                bindsVariable: 'Backstab_Dice',
                variableRelType: 'define',
                unifiedQueue: [
                    { nodeType: 'modifier', type: 'literal', value: 1, operator: '+' },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'LVL', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'literal', divisorValue: 2, roundMode: 'down' }
                ]
            }
        ]
    },
    {
        id: 'template_sd_monster',
        name: 'Shadowdark Monster (Blank)',
        system: 'Shadowdark',
        dndType: 'monster',
        isDefault: true,
        variables: {
            "HP": "5",
            "MaxHP": "5",
            "AC": "10",
            "LVL": "1",
            "ATK_mod": "0"
        },
        groups: [
            { id: 'actions', name: 'Actions', color: '#ff003c' },
            { id: 'stats', name: 'Stats', color: '#00d4ff' }
        ],
        widgets: [
            {
                id: 'w_m_hp',
                groupId: 'stats',
                name: 'HP',
                widgetType: 'stepper',
                min: 0,
                max: 5,
                value: 5
            },
            {
                id: 'w_m_ac',
                groupId: 'stats',
                name: 'AC',
                widgetType: 'number',
                value: 10,
                bindsVariable: 'AC',
                variableRelType: 'define'
            },
            {
                id: 'w_m_lvl',
                groupId: 'stats',
                name: 'Level',
                widgetType: 'number',
                value: 1,
                bindsVariable: 'LVL',
                variableRelType: 'define'
            },
            {
                id: 'w_m_atk_mod',
                groupId: 'stats',
                name: 'Attack Modifier',
                widgetType: 'number',
                value: 0,
                bindsVariable: 'ATK_mod',
                variableRelType: 'define'
            },
            {
                id: 'w_m_atk',
                groupId: 'actions',
                name: 'Claw Attack Roll',
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'ATK_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_m_dmg',
                groupId: 'actions',
                name: 'Claw Damage Roll',
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 6, count: 1 }
                ]
            }
        ]
    }
];
