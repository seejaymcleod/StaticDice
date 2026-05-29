const engine = {
    queue: [],
    activeModifier: null,
    modifierLevel: 0,
    applyModifier(type) {
        if (this.queue.length === 0) {
            if (this.activeModifier === type) {
                this.modifierLevel++;
            } else {
                this.activeModifier = type;
                this.modifierLevel = 1;
            }
            return;
        }

        const lastNode = this.queue[this.queue.length - 1];
        if (lastNode && lastNode.nodeType === 'operator' && (lastNode.operator === 'ADV' || lastNode.operator === 'DIS')) {
            if (lastNode.operator === type) {
                lastNode.modifierLevel = (lastNode.modifierLevel || 1) + 1;
            } else {
                lastNode.operator = type;
                lastNode.modifierLevel = 1;
            }
        } else {
            const isValidLeft = lastNode && (lastNode.nodeType === 'node' || (lastNode.nodeType === 'operator' && lastNode.operator === ')'));
            if (isValidLeft) {
                this.queue.push({
                    nodeType: 'operator',
                    operator: type,
                    modifierLevel: 1
                });
            } else {
                if (this.activeModifier === type) {
                    this.modifierLevel++;
                } else {
                    this.activeModifier = type;
                    this.modifierLevel = 1;
                }
            }
        }
    }
};

engine.queue.push({nodeType: 'node', sides: 20});
engine.applyModifier('ADV');
console.log("After ADV:", JSON.stringify(engine.queue));
engine.applyModifier('DIS');
console.log("After DIS:", JSON.stringify(engine.queue));
