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
            "STR_mod": "0", "DEX_mod": "0", "CON_mod": "0", "INT_mod": "0", "WIS_mod": "0", "CHA_mod": "0"
        },
        groups: [
            { id: 'stats', name: 'Stats', color: '#00d4ff' },
            { id: 'combat', name: 'Combat', color: '#ff003c' }
        ],
        widgets: [
            {
                id: 'w_hp',
                groupId: 'stats',
                name: 'HP',
                widgetType: 'stepper',
                min: 0,
                max: 10,
                value: 10
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
                id: 'w_atk',
                groupId: 'combat',
                name: 'Melee Attack Roll',
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 20, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
                ]
            },
            {
                id: 'w_dmg',
                groupId: 'combat',
                name: 'Sword Damage Roll',
                widgetType: 'roller',
                unifiedQueue: [
                    { nodeType: 'node', sides: 8, count: 1 },
                    { nodeType: 'operator', operator: '+' },
                    { nodeType: 'modifier', type: 'variable', value: 'STR_mod', operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
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
