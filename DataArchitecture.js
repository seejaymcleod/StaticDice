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

