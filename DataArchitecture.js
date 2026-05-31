// DataArchitecture.js

class DiceSystem {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.blueprints = {
            entities: [],
            components: []
        };
    }
}

// Blueprints (The Forge)
class Blueprint {
    constructor(id, systemId, name, type) {
        this.id = id;
        this.systemId = systemId;
        this.name = name;
        this.type = type; // 'entity' | 'component'
    }
}

class EntityBlueprint extends Blueprint {
    constructor(id, systemId, name, entityType) {
        super(id, systemId, name, 'entity');
        this.entityType = entityType; // 'character', 'monster', 'hazard'
        this.components = []; // Array of ComponentBlueprints or their IDs
        this.initialState = {};
    }
}

class ComponentBlueprint extends Blueprint {
    constructor(id, systemId, name, componentType) {
        super(id, systemId, name, 'component');
        this.componentType = componentType; // 'spell', 'item', 'attack'
        this.data = {}; // e.g. macro formula, damage
    }
}

// Instances (The Active State)
class Instance {
    constructor(blueprint) {
        this.id = 'inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.systemId = blueprint.systemId;
        this.blueprintId = blueprint.id; // reference to origin
        this.name = blueprint.name;
        this.state = {}; 
    }
}

class EntityInstance extends Instance {
    constructor(blueprint) {
        super(blueprint);
        this.entityType = blueprint.entityType;
        this.components = []; 
        
        // Deep clone initial state from blueprint
        this.state = JSON.parse(JSON.stringify(blueprint.initialState || {}));
    }
}

class ComponentInstance extends Instance {
    constructor(blueprint) {
        super(blueprint);
        this.componentType = blueprint.componentType;
        this.data = JSON.parse(JSON.stringify(blueprint.data || {}));
    }
}

// Containers (The Binder)
class Container {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type; // 'campaign' | 'encounter'
        this.children = []; 
        this.instances = []; // Array of Instance objects
    }
}

class Campaign extends Container {
    constructor(id, name) {
        super(id, name, 'campaign');
    }
}

class Encounter extends Container {
    constructor(id, name, parentCampaignId) {
        super(id, name, 'encounter');
        this.parentCampaignId = parentCampaignId;
    }
}

// Global Store
const CMSStore = {
    systems: {},
    campaigns: {}
};

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
