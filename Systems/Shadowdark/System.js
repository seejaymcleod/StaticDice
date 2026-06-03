// ShadowdarkSystem.js

// Generic Schemas
const ShadowdarkSystem = new DiceSystem('shadowdark', 'Shadowdark');
CMSStore.systems['shadowdark'] = ShadowdarkSystem;

const ShadowdarkCharacterSchema = {
    identity: {
        name: "Unnamed",
        title: "",
        ancestry: "",
        class: "",
        alignment: "",
        background: "",
        deity: ""
    },
    progression: {
        level: 1,
        xp: 0,
        nextLvl: 10
    },
    stats: {
        STR: { score: 10, mod: 0 },
        DEX: { score: 10, mod: 0 },
        CON: { score: 10, mod: 0 },
        INT: { score: 10, mod: 0 },
        WIS: { score: 10, mod: 0 },
        CHA: { score: 10, mod: 0 }
    },
    combatState: {
        AC: 10,
        HP_Max: 1,
        HP_Current: 1,
        deathRoundCheckboxes: [false, false, false, false, false, false, false, false]
    },
    features: {
        languages: [],
        talents: []
    }
};

const ShadowdarkMonsterSchema = {
    identity: {
        name: "Unknown Monster",
        description: ""
    },
    combatState: {
        AC: 10,
        armorType: "unarmored",
        HP: 1
    },
    actions: [],
    movement: "near",
    modifiers: {
        STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0
    },
    metadata: {
        alignment: "neutral",
        level: 1
    },
    features: []
};

// Generic Blueprints
const GenericShadowdarkCharacter = new EntityBlueprint('sd_char_generic', 'shadowdark', 'Shadowdark Character', 'character');
GenericShadowdarkCharacter.initialState = ShadowdarkCharacterSchema;

const GenericShadowdarkMonster = new EntityBlueprint('sd_mon_generic', 'shadowdark', 'Shadowdark Monster', 'monster');
GenericShadowdarkMonster.initialState = ShadowdarkMonsterSchema;

ShadowdarkSystem.blueprints.entities.push(GenericShadowdarkCharacter, GenericShadowdarkMonster);
