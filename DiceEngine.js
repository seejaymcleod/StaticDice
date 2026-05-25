class DiceEngine {
    constructor() {
        this.queue = []; // Unified queue of chips (dice and modifier chips in exact visual/chronological order)
        this.activeModifier = null; // 'ADV', 'DIS', or null
        this.modifierLevel = 0;
        this.rollRules = {
            rerollOp: "", rerollVal: null,
            explodeOp: "", explodeVal: null,
            targetMode: "sum", targetOp: "", targetVal: null,
            countThreshOp: "", countThreshVal: null,
            setsOp: "", setsVal: null
        };
        this.savedQueues = [];
        this.rng = this.defaultRng;
        this.overallTarget = null;
    }

    get rollingQueue() {
        const self = this;
        const filtered = this.queue
            .filter(c => c.chipType === 'dice')
            .map(c => ({ sides: c.sides, count: c.count }));

        return new Proxy(filtered, {
            get(target, prop, receiver) {
                if (prop === 'push') {
                    return function(...args) {
                        args.forEach(item => {
                            self.queue.push({
                                chipType: 'dice',
                                id: 'dice_' + Math.random(),
                                sides: item.sides,
                                count: item.count
                            });
                        });
                        return self.queue.filter(c => c.chipType === 'dice').length;
                    };
                }
                if (prop === 'pop') {
                    return function() {
                        for (let i = self.queue.length - 1; i >= 0; i--) {
                            if (self.queue[i].chipType === 'dice') {
                                const popped = self.queue.splice(i, 1)[0];
                                return { sides: popped.sides, count: popped.count };
                            }
                        }
                        return undefined;
                    };
                }
                if (prop === 'splice') {
                    return function(start, deleteCount, ...items) {
                        const diceIndices = [];
                        self.queue.forEach((c, idx) => {
                            if (c.chipType === 'dice') diceIndices.push(idx);
                        });
                        const targetIndices = diceIndices.slice(start, start + deleteCount);
                        targetIndices.sort((a, b) => b - a).forEach(idx => {
                            self.queue.splice(idx, 1);
                        });
                        const insertIndex = diceIndices[start] !== undefined ? diceIndices[start] : self.queue.length;
                        const preparedItems = items.map(item => ({
                            chipType: 'dice',
                            id: 'dice_' + Math.random(),
                            sides: item.sides,
                            count: item.count
                        }));
                        self.queue.splice(insertIndex, 0, ...preparedItems);
                        return [];
                    };
                }
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            }
        });
    }

    set rollingQueue(val) {
        this.queue = this.queue.filter(c => c.chipType !== 'dice');
        if (Array.isArray(val)) {
            val.forEach(item => {
                this.queue.push({
                    chipType: 'dice',
                    id: 'dice_' + Math.random(),
                    sides: item.sides,
                    count: item.count
                });
            });
        }
    }

    get _flatMod() {
        const self = this;
        const filtered = this.queue.filter(c => c.chipType === 'modifier');
        
        return new Proxy(filtered, {
            get(target, prop, receiver) {
                if (prop === 'push') {
                    return function(...args) {
                        args.forEach(item => {
                            self.queue.push({
                                ...item,
                                chipType: 'modifier',
                                id: item.id || ('mod_' + Math.random())
                            });
                        });
                        return self.queue.filter(c => c.chipType === 'modifier').length;
                    };
                }
                if (prop === 'pop') {
                    return function() {
                        for (let i = self.queue.length - 1; i >= 0; i--) {
                            if (self.queue[i].chipType === 'modifier') {
                                const popped = self.queue.splice(i, 1)[0];
                                return popped;
                            }
                        }
                        return undefined;
                    };
                }
                if (prop === 'splice') {
                    return function(start, deleteCount, ...items) {
                        const modIndices = [];
                        self.queue.forEach((c, idx) => {
                            if (c.chipType === 'modifier') modIndices.push(idx);
                        });
                        
                        const targetIndices = modIndices.slice(start, start + deleteCount);
                        targetIndices.sort((a, b) => b - a).forEach(idx => {
                            self.queue.splice(idx, 1);
                        });
                        
                        const insertIndex = modIndices[start] !== undefined ? modIndices[start] : self.queue.length;
                        const preparedItems = items.map(item => ({
                            ...item,
                            chipType: 'modifier',
                            id: item.id || ('mod_' + Math.random())
                        }));
                        self.queue.splice(insertIndex, 0, ...preparedItems);
                        return [];
                    };
                }
                
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            }
        });
    }

    set _flatMod(val) {
        this.queue = this.queue.filter(c => c.chipType !== 'modifier');
        if (Array.isArray(val)) {
            val.forEach(item => {
                this.queue.push({
                    ...item,
                    chipType: 'modifier',
                    id: item.id || ('mod_' + Math.random())
                });
            });
        }
    }

    get flatMod() {
        const flatList = this.queue.filter(c => c.chipType === 'modifier');
        if (flatList.length === 0) {
            return 0;
        }
        if (flatList.length === 1) {
            const first = flatList[0];
            if (first.type === 'literal' &&
                (!first.multiplierType || first.multiplierType === 'none') &&
                (!first.divisorType || first.divisorType === 'none')) {
                return first.operator === '-' ? -first.value : first.value;
            }
            if (first.type === 'variable' &&
                (!first.multiplierType || first.multiplierType === 'none') &&
                (!first.divisorType || first.divisorType === 'none')) {
                return first.value;
            }
        }
        return flatList;
    }

    set flatMod(val) {
        if (Array.isArray(val)) {
            this._flatMod = val;
        } else if (typeof val === 'string' && val !== '') {
            this._flatMod = [{
                type: 'variable',
                value: val,
                operator: '+',
                multiplierType: 'none',
                multiplierValue: 1,
                divisorType: 'none',
                divisorValue: 1,
                roundMode: 'none'
            }];
        } else if (typeof val === 'number' && val !== 0) {
            this._flatMod = [{
                type: 'literal',
                value: Math.abs(val),
                operator: val >= 0 ? '+' : '-',
                multiplierType: 'none',
                multiplierValue: 1,
                divisorType: 'none',
                divisorValue: 1,
                roundMode: 'none'
            }];
        } else {
            this._flatMod = [];
        }
    }

    defaultRng(sides) {
        if (typeof window !== 'undefined' && window.crypto) {
            const cryptoArray = new Uint32Array(1);
            const maxVal = 2 ** 32;
            const limit = maxVal - (maxVal % sides);
            let val;
            do {
                window.crypto.getRandomValues(cryptoArray);
                val = cryptoArray[0];
            } while (val >= limit);
            return (val % sides) + 1;
        } else {
            return Math.floor(Math.random() * sides) + 1;
        }
    }

    // Set custom RNG function (useful for testing)
    setRng(fn) {
        this.rng = fn;
    }

    changeQueue(sides, delta) {
        if (delta > 0) {
            const lastChip = this.queue[this.queue.length - 1];
            if (lastChip && lastChip.chipType === 'dice' && lastChip.sides === sides) {
                lastChip.count += delta;
            } else {
                if (lastChip && (
                    lastChip.chipType === 'dice' ||
                    lastChip.chipType === 'number' ||
                    lastChip.chipType === 'modifier' ||
                    (lastChip.chipType === 'operator' && lastChip.operator === ')')
                )) {
                    this.queue.push({
                        chipType: 'operator',
                        operator: '+',
                        roundMode: 'none'
                    });
                }
                this.queue.push({
                    chipType: 'dice',
                    id: 'dice_' + Date.now() + Math.random(),
                    sides: sides,
                    count: delta
                });
            }
        } else if (delta < 0) {
            for (let i = this.queue.length - 1; i >= 0; i--) {
                const chip = this.queue[i];
                if (chip.chipType === 'dice' && chip.sides === sides) {
                    chip.count += delta;
                    if (chip.count <= 0) {
                        this.queue.splice(i, 1);
                    }
                    break;
                }
            }
        }
    }

    backspaceQueue() {
        if (this.overallTarget !== null) {
            this.overallTarget = null;
        } else if (this.activeModifier) {
            this.activeModifier = null;
            this.modifierLevel = 0;
        } else if (this.queue.length > 0) {
            this.queue.pop();
        }
    }

    adjustFlatMod(val) {
        const lastChip = this.queue[this.queue.length - 1];
        if (lastChip && lastChip.chipType === 'modifier' && lastChip.type === 'literal' && lastChip.multiplierType === 'none' && lastChip.divisorType === 'none') {
            let currentVal = Number(lastChip.value) || 0;
            let op = lastChip.operator || '+';
            if (op === '-') currentVal = -currentVal;
            
            currentVal += val;
            if (currentVal === 0) {
                this.queue.pop();
            } else {
                lastChip.operator = currentVal >= 0 ? '+' : '-';
                lastChip.value = Math.abs(currentVal);
            }
        } else {
            if (val !== 0) {
                this.queue.push({
                    chipType: 'modifier',
                    id: 'mod_' + Date.now() + Math.random(),
                    type: 'literal',
                    value: Math.abs(val),
                    operator: val >= 0 ? '+' : '-',
                    multiplierType: 'none',
                    multiplierValue: 1,
                    divisorType: 'none',
                    divisorValue: 1,
                    roundMode: 'none'
                });
            }
        }
    }

    adjustOverallTarget(val) {
        if (this.overallTarget === null) this.overallTarget = 0;
        this.overallTarget += val;
    }

    applyModifier(type) {
        if (this.activeModifier === type) {
            this.modifierLevel++;
        } else if (this.activeModifier !== null) {
            this.activeModifier = null;
            this.modifierLevel = 0;
        } else {
            this.activeModifier = type;
            this.modifierLevel = 1;
        }
    }

    clearQueue() {
        this.queue = [];
        this.activeModifier = null;
        this.modifierLevel = 0;
        
        this.rollRules = {
            rerollOp: "", rerollVal: null,
            explodeOp: "", explodeVal: null,
            targetMode: "sum", targetOp: "", targetVal: null,
            countThreshOp: "", countThreshVal: null,
            setsOp: "", setsVal: null
        };
        
        this.overallTarget = null;
    }

    isQueueValid() {
        if (this.queue.length === 0) return false;

        let openParenCount = 0;
        const binaryOps = ['+', '-', '*', '/'];

        for (let i = 0; i < this.queue.length; i++) {
            const current = this.queue[i];
            const next = this.queue[i + 1];

            if (current.chipType === 'operator') {
                if (current.operator === '(') {
                    openParenCount++;
                    if (next && next.chipType === 'operator' && next.operator === ')') {
                        return false;
                    }
                    if (next && next.chipType === 'operator' && binaryOps.includes(next.operator)) {
                        return false;
                    }
                } else if (current.operator === ')') {
                    openParenCount--;
                    if (openParenCount < 0) return false;
                } else if (binaryOps.includes(current.operator)) {
                    if (!next) return false;
                    if (next.chipType === 'operator' && binaryOps.includes(next.operator)) {
                        return false;
                    }
                    if (next.chipType === 'operator' && next.operator === ')') {
                        return false;
                    }
                }
            }
        }

        const last = this.queue[this.queue.length - 1];
        if (last.chipType === 'operator' && last.operator !== ')') {
            return false;
        }

        const first = this.queue[0];
        if (first.chipType === 'operator' && first.operator !== '(') {
            return false;
        }

        return openParenCount === 0;
    }

    updateRules(rules) {
        this.rollRules = { ...this.rollRules, ...rules };
    }

    resolveVariable(name) {
        if (typeof window !== 'undefined' && window.getActiveCharacterVariable) {
            const resolved = window.getActiveCharacterVariable(name);
            if (resolved !== null) return resolved;
        }
        return null;
    }

    checkCondition(val, op, target) {
        if (!op || target === null || target === undefined || target === '') return false;
        
        let actualTarget = target;
        const resolved = this.resolveVariable(target);
        if (resolved !== null) {
            actualTarget = resolved;
        }
        
        const v = Number(val);
        const t = Number(actualTarget);
        if (isNaN(t)) return false;
        
        if (op === '>=') return v >= t;
        if (op === '<=') return v <= t;
        if (op === '>') return v > t;
        if (op === '<') return v < t;
        if (op === '=') return v === t;
        return false;
    }

    evaluateCriteriaList(val, criteriaList, overallTarget) {
        if (!Array.isArray(criteriaList) || criteriaList.length === 0) return true;
        
        let isSuccess = false;
        criteriaList.forEach((c, idx) => {
            let actualVal = c.numVal;
            if (c.mode === 'VAR') {
                if (c.varVal === 'target') {
                    actualVal = overallTarget !== null ? overallTarget : 0;
                } else {
                    const resolved = this.resolveVariable(c.varVal);
                    actualVal = resolved !== null ? resolved : 0;
                }
            }
            const cond = this.checkCondition(val, c.op, actualVal);
            
            if (idx === 0) {
                isSuccess = cond;
            } else {
                const gate = c.gate || 'AND';
                if (gate === 'AND') {
                    isSuccess = isSuccess && cond;
                } else if (gate === 'OR') {
                    isSuccess = isSuccess || cond;
                } else if (gate === 'AND/OR' || gate === 'AND_OR') {
                    isSuccess = isSuccess || cond;
                }
            }
        });
        return isSuccess;
    }

    // ARSENAL LOGIC
    saveQueue(name, color = '#ef4444') {
        if (this.queue.length === 0) return null;
        const newSaved = {
            id: Date.now(),
            name: name,
            color: color,
            queue: JSON.parse(JSON.stringify(this.rollingQueue)), // for legacy backwards compatibility
            modifier: this.activeModifier,
            modLevel: this.modifierLevel,
            flat: JSON.parse(JSON.stringify(this._flatMod)), // for legacy backwards compatibility
            unifiedQueue: JSON.parse(JSON.stringify(this.queue)),
            rules: JSON.parse(JSON.stringify(this.rollRules)),
            includeAdvDis: false
        };
        this.savedQueues.push(newSaved);
        return newSaved;
    }


    loadQueue(id) {
        const item = this.savedQueues.find(q => q.id === id);
        if (!item) return;

        // If saved queue is unified, load it directly:
        if (item.unifiedQueue && Array.isArray(item.unifiedQueue)) {
            this.queue = JSON.parse(JSON.stringify(item.unifiedQueue));
        } else if (item.queue && item.queue.some(c => c.chipType !== undefined)) {
            this.queue = JSON.parse(JSON.stringify(item.queue));
        } else {
            // Legacy queue: rebuild from item.queue and item.flat
            this.queue = [];
            if (Array.isArray(item.queue)) {
                item.queue.forEach(q => {
                    this.queue.push({
                        chipType: 'dice',
                        id: 'dice_' + Math.random(),
                        sides: q.sides,
                        count: q.count
                    });
                });
            }
            let loadedFlat = item.flat;
            if (!Array.isArray(loadedFlat)) {
                if (typeof loadedFlat === 'string' && loadedFlat !== '') {
                    loadedFlat = [{
                        type: 'variable',
                        value: loadedFlat,
                        operator: '+',
                        multiplierType: 'none',
                        multiplierValue: 1,
                        divisorType: 'none',
                        divisorValue: 1,
                        roundMode: 'none'
                    }];
                } else if (typeof loadedFlat === 'number' && loadedFlat !== 0) {
                    loadedFlat = [{
                        type: 'literal',
                        value: Math.abs(loadedFlat),
                        operator: loadedFlat >= 0 ? '+' : '-',
                        multiplierType: 'none',
                        multiplierValue: 1,
                        divisorType: 'none',
                        divisorValue: 1,
                        roundMode: 'none'
                    }];
                } else {
                    loadedFlat = [];
                }
            }
            loadedFlat.forEach(f => {
                this.queue.push({
                    ...f,
                    chipType: 'modifier',
                    id: f.id || ('mod_' + Math.random())
                });
            });
        }

        this.activeModifier = item.modifier;
        this.modifierLevel = item.modLevel;
        
        this.rollRules = item.rules ? JSON.parse(JSON.stringify(item.rules)) : { rerollOp: "", rerollVal: null, explodeOp: "", explodeVal: null, targetMode: "sum", targetOp: "", targetVal: null, countThreshOp: "", countThreshVal: null, setsOp: "", setsVal: null };
        if (!this.rollRules.targetMode) this.rollRules.targetMode = "sum";
        if (this.rollRules.countThreshOp === undefined) this.rollRules.countThreshOp = "";
        if (this.rollRules.countThreshVal === undefined) this.rollRules.countThreshVal = null;
    }

    deleteQueue(id) {
        this.savedQueues = this.savedQueues.filter(q => q.id !== id);
    }

    renameQueue(id, newName) {
        const item = this.savedQueues.find(q => q.id === id);
        if (item) item.name = newName;
    }

    changeQueueColor(id, color) {
        const item = this.savedQueues.find(q => q.id === id);
        if (item) item.color = color;
    }

    updateSavedQueue(id) {
        const item = this.savedQueues.find(q => q.id === id);
        if (!item) return false;

        item.queue = JSON.parse(JSON.stringify(this.rollingQueue)); // for legacy backward compatibility
        item.flat = JSON.parse(JSON.stringify(this._flatMod)); // for legacy backward compatibility
        item.unifiedQueue = JSON.parse(JSON.stringify(this.queue));
        item.modifier = this.activeModifier;
        item.modLevel = this.modifierLevel;
        item.rules = JSON.parse(JSON.stringify(this.rollRules));
        return true;
    }

    setSavedQueues(queues) {
        this.savedQueues = queues;
    }

    getSavedQueues() {
        return this.savedQueues;
    }

    // ROLL LOGIC
    resolveModifier(flatModList) {
        if (!Array.isArray(flatModList)) {
            if (typeof flatModList === 'string' && flatModList !== '') {
                const resolved = this.resolveVariable(flatModList);
                return resolved !== null ? resolved : 0;
            }
            return Number(flatModList) || 0;
        }

        let total = 0;
        flatModList.forEach(term => {
            let base = 0;
            if (term.type === 'variable') {
                const resolved = this.resolveVariable(term.value);
                base = resolved !== null ? resolved : 0;
            } else {
                base = Number(term.value) || 0;
            }

            let mult = 1;
            if (term.multiplierType === 'variable') {
                const resolved = this.resolveVariable(term.multiplierValue);
                mult = resolved !== null ? resolved : 1;
            } else if (term.multiplierType === 'literal') {
                mult = Number(term.multiplierValue);
                if (isNaN(mult)) mult = 1;
            }

            let div = 1;
            if (term.divisorType === 'variable') {
                const resolved = this.resolveVariable(term.divisorValue);
                div = resolved !== null ? resolved : 1;
            } else if (term.divisorType === 'literal') {
                div = Number(term.divisorValue);
                if (isNaN(div) || div === 0) div = 1;
            }

            let result = (base * mult) / div;

            if (term.roundMode === 'up') {
                result = Math.ceil(result);
            } else if (term.roundMode === 'down') {
                result = Math.floor(result);
            } else if (term.roundMode === 'round') {
                result = Math.round(result);
            }

            if (term.operator === '-') {
                total -= result;
            } else {
                total += result;
            }
        });

        return total;
    }

    getModifierTermString(term) {
        let base = term.value;
        let op = term.operator === '-' ? '-' : '+';
        
        let expr = `${base}`;
        if (term.multiplierType && term.multiplierType !== 'none') {
            expr += ` * ${term.multiplierValue}`;
        }
        if (term.divisorType && term.divisorType !== 'none') {
            expr += ` / ${term.divisorValue}`;
        }
        
        if (term.roundMode === 'up') {
            expr = `${expr} (↑)`;
        } else if (term.roundMode === 'down') {
            expr = `${expr} (↓)`;
        } else if (term.roundMode === 'round') {
            expr = `${expr} (≈)`;
        }
        
        return `${op} ${expr}`;
    }

    _normalizeFlatMod(flat) {
        let list = [];
        if (Array.isArray(flat)) {
            list = flat.map(item => ({
                ...item,
                chipType: 'modifier',
                id: item.id || ('mod_' + Math.random())
            }));
        } else if (typeof flat === 'string' && flat !== '') {
            list = [{
                chipType: 'modifier',
                id: 'mod_' + Math.random(),
                type: 'variable',
                value: flat,
                operator: '+',
                multiplierType: 'none',
                multiplierValue: 1,
                divisorType: 'none',
                divisorValue: 1,
                roundMode: 'none'
            }];
        } else if (typeof flat === 'number' && flat !== 0) {
            list = [{
                chipType: 'modifier',
                id: 'mod_' + Math.random(),
                type: 'literal',
                value: Math.abs(flat),
                operator: flat >= 0 ? '+' : '-',
                multiplierType: 'none',
                multiplierValue: 1,
                divisorType: 'none',
                divisorValue: 1,
                roundMode: 'none'
            }];
        }
        return list;
    }

    calculateRoll(forcedQueue = null, isInstant = false, overrides = null) {
        let evalChips = [];
        if (forcedQueue) {
            if (forcedQueue.some(c => c.chipType !== undefined)) {
                evalChips = forcedQueue;
            } else {
                evalChips = forcedQueue.map(q => ({
                    chipType: 'dice',
                    sides: q.sides,
                    count: q.count
                }));
                const activeFlat = (overrides && overrides.flat !== undefined) ? overrides.flat : (isInstant ? [] : this._flatMod);
                evalChips = evalChips.concat(this._normalizeFlatMod(activeFlat));
            }
        } else {
            if (overrides) {
                if (overrides.queue) {
                    if (overrides.queue.some(c => c.chipType !== undefined)) {
                        evalChips = overrides.queue;
                    } else {
                        const diceChips = overrides.queue.map(q => ({ chipType: 'dice', sides: q.sides, count: q.count }));
                        const flatList = this._normalizeFlatMod(overrides.flat !== undefined ? overrides.flat : []);
                        evalChips = diceChips.concat(flatList);
                    }
                } else {
                    evalChips = this.queue;
                }
            } else {
                evalChips = this.queue;
            }
        }

        const activeModifier = (overrides && overrides.modifier !== undefined) ? overrides.modifier : this.activeModifier;
        const activeModLevel = (overrides && overrides.modLevel !== undefined) ? overrides.modLevel : this.modifierLevel;
        const activeRules = (overrides && overrides.rules !== undefined) ? overrides.rules : this.rollRules;
        const activeOverallTarget = (overrides && overrides.overallTarget !== undefined) ? overrides.overallTarget : this.overallTarget;

        if (evalChips.length === 0) return null;

        const isListMode = activeRules.targetMode === 'list';
        let total = isListMode ? [] : 0;
        let breakdownRows = [];
        let hasCritHit = false;
        let hasCritFail = false;
        let allSetGroups = {};
        let totalRerolls = 0;
        let totalExplosions = 0;

        if (isListMode) {
            evalChips.forEach(chip => {
                if (chip.chipType === 'dice') {
                    let pool = [];
                    let rawRolls = [];
                    let groupRerolls = 0;
                    let groupExplosions = 0;
                    const rollsToTake = 1 + (activeModifier ? activeModLevel : 0);

                    for (let i = 0; i < chip.count; i++) {
                        let dieRolls = [];
                        for (let j = 0; j < rollsToTake; j++) dieRolls.push(this.rng(chip.sides));

                        let kept = dieRolls[0];
                        if (activeModifier === 'ADV') kept = Math.max(...dieRolls);
                        if (activeModifier === 'DIS') kept = Math.min(...dieRolls);

                        let dieLog = "";
                        if (dieRolls.length > 1) {
                            dieLog += `(${dieRolls.join(', ')})${activeModifier === 'ADV' ? 'kh1' : 'kl1'}->`;
                        }
                        dieLog += `${kept}`;

                        // Reroll Logic
                        let rerollCount = 0;
                        const rOp = (chip.rerollOp !== undefined) ? chip.rerollOp : activeRules.rerollOp;
                        const rVal = (chip.rerollVal !== undefined) ? chip.rerollVal : activeRules.rerollVal;
                        while (rOp && rVal !== null && this.checkCondition(kept, rOp, rVal) && rerollCount < 10) {
                            kept = this.rng(chip.sides);
                            dieLog += `r->${kept}`;
                            rerollCount++;
                        }
                        groupRerolls += rerollCount;

                        let totalValueForThisDie = kept;

                        // Explode Logic
                        let explodeCount = 0;
                        let currentExplodeDie = kept;
                        const eOp = (chip.explodeOp !== undefined) ? chip.explodeOp : activeRules.explodeOp;
                        const eVal = (chip.explodeVal !== undefined) ? chip.explodeVal : activeRules.explodeVal;
                        while (eOp && eVal !== null && this.checkCondition(currentExplodeDie, eOp, eVal) && explodeCount < 10) {
                            currentExplodeDie = this.rng(chip.sides);
                            totalValueForThisDie += currentExplodeDie;
                            dieLog += `!->${currentExplodeDie}`;
                            explodeCount++;
                        }
                        groupExplosions += explodeCount;

                        if (activeRules.targetOp || activeRules.targetMode === 'count' || activeRules.setsOp) {
                            pool.push(kept);
                            if (explodeCount > 0) {
                                let parts = dieLog.split('!->');
                                for (let p = 1; p < parts.length; p++) {
                                    pool.push(parseInt(parts[p]));
                                }
                            }
                        } else {
                            pool.push(totalValueForThisDie);
                        }

                        rawRolls.push(dieLog);

                        if (chip.sides === 20 && !activeRules.targetOp && activeRules.targetMode === 'sum') {
                            if (totalValueForThisDie === 20) hasCritHit = true;
                            if (totalValueForThisDie === 1) hasCritFail = true;
                        }
                    }

                    let sum = 0;
                    let filteredPool = pool;
                    
                    // 1. Apply Target Condition (Only for COUNT mode)
                    if (activeRules.targetMode === 'count') {
                        if (activeRules.evalCriteria && Array.isArray(activeRules.evalCriteria.count)) {
                            filteredPool = pool.filter(v => this.evaluateCriteriaList(v, activeRules.evalCriteria.count, activeOverallTarget));
                        } else if (activeRules.targetOp) {
                            filteredPool = pool.filter(v => this.checkCondition(v, activeRules.targetOp, activeRules.targetVal));
                        }
                    }

                    // 2. Apply Sets Condition
                    let setGroups = {};
                    const hasSetsCriteria = activeRules.evalCriteria && Array.isArray(activeRules.evalCriteria.sets) && activeRules.evalCriteria.sets.length > 0;
                    if (hasSetsCriteria || (activeRules.setsOp && activeRules.setsVal !== null)) {
                        const counts = {};
                        filteredPool.forEach(v => counts[v] = (counts[v] || 0) + 1);
                        
                        Object.keys(counts).forEach(v => {
                            if (hasSetsCriteria) {
                                if (this.evaluateCriteriaList(counts[v], activeRules.evalCriteria.sets, activeOverallTarget)) {
                                    setGroups[v] = counts[v];
                                }
                            } else if (this.checkCondition(counts[v], activeRules.setsOp, activeRules.setsVal)) {
                                    setGroups[v] = counts[v];
                            }
                        });

                        filteredPool = filteredPool.filter(v => setGroups[v] !== undefined);
                    }

                    // Aggregate set groups across all dice groups
                    Object.entries(setGroups).forEach(([v, c]) => {
                        allSetGroups[v] = (allSetGroups[v] || 0) + c;
                    });
                    totalRerolls += groupRerolls;
                    totalExplosions += groupExplosions;
                    
                    if (activeRules.targetMode === 'count') {
                        sum = filteredPool.length;
                    } else if (activeRules.targetMode === 'list') {
                        filteredPool.sort((a, b) => a - b);
                        sum = filteredPool.join(', ');
                    } else {
                        sum = filteredPool.reduce((a, b) => a + b, 0);
                    }
                    
                    // Build formula string
                    let f = `${chip.count}d${chip.sides}`;
                    if (activeModifier === 'ADV') f += 'kh1';
                    if (activeModifier === 'DIS') f += 'kl1';
                    if (activeRules.rerollOp && activeRules.rerollVal !== null) f += `r${activeRules.rerollOp.replace('=', '')}${activeRules.rerollVal}`;
                    if (activeRules.explodeOp && activeRules.explodeVal !== null) f += `e${activeRules.explodeOp.replace('=', '')}${activeRules.explodeVal}`;
                    if (activeRules.targetMode === 'count' || activeRules.targetMode === 'sum') {
                        if (activeRules.targetOp && activeRules.targetVal !== null && activeRules.targetVal !== '') {
                            if (activeRules.targetMode === 'count') f += 'c';
                            let valStr = activeRules.targetVal;
                            if (activeRules.targetMode === 'sum') {
                                if (valStr === 'overall') valStr = 'TARGET';
                                else if (valStr === 'varX') valStr = 'VARX';
                            }
                            f += `${activeRules.targetOp.replace('=', '')}${valStr}`;
                        }
                    }
                    if (activeRules.setsOp && activeRules.setsVal !== null) f += `set${activeRules.setsOp.replace('=', '')}${activeRules.setsVal}`;
                    f = f.replace(/>=/g, '≥').replace(/<=/g, '≤');

                    let highlightedRaw = rawRolls.map(dieStr => {
                        const parts = dieStr.split('->');
                        const lastPart = parts[parts.length - 1];
                        const val = parseInt(lastPart.split('!')[0]);
                        
                        if (activeRules.setsOp && activeRules.setsVal !== null) {
                            if (setGroups[val] !== undefined) {
                                return `<span class="set-match" data-val="${val}">${dieStr}</span>`;
                            } else {
                                return `<span class="set-dim">${dieStr}</span>`;
                            }
                        }
                        return dieStr;
                    });

                    breakdownRows.push({
                        formula: f,
                        rolls: highlightedRaw.join(', '),
                        subtotal: sum
                    });
                    
                    if (sum) total.push(sum);
                }
            });
            total = total.join(', ') || '0';
        } else {
            let tokens = [];

            evalChips.forEach(chip => {
                if (chip.chipType === 'dice') {
                    let pool = [];
                    let rawRolls = [];
                    let groupRerolls = 0;
                    let groupExplosions = 0;
                    const rollsToTake = 1 + (activeModifier ? activeModLevel : 0);

                    for (let i = 0; i < chip.count; i++) {
                        let dieRolls = [];
                        for (let j = 0; j < rollsToTake; j++) dieRolls.push(this.rng(chip.sides));

                        let kept = dieRolls[0];
                        if (activeModifier === 'ADV') kept = Math.max(...dieRolls);
                        if (activeModifier === 'DIS') kept = Math.min(...dieRolls);

                        let dieLog = "";
                        if (dieRolls.length > 1) {
                            dieLog += `(${dieRolls.join(', ')})${activeModifier === 'ADV' ? 'kh1' : 'kl1'}->`;
                        }
                        dieLog += `${kept}`;

                        // Reroll Logic
                        let rerollCount = 0;
                        const rOp = (chip.rerollOp !== undefined) ? chip.rerollOp : activeRules.rerollOp;
                        const rVal = (chip.rerollVal !== undefined) ? chip.rerollVal : activeRules.rerollVal;
                        while (rOp && rVal !== null && this.checkCondition(kept, rOp, rVal) && rerollCount < 10) {
                            kept = this.rng(chip.sides);
                            dieLog += `r->${kept}`;
                            rerollCount++;
                        }
                        groupRerolls += rerollCount;

                        let totalValueForThisDie = kept;

                        // Explode Logic
                        let explodeCount = 0;
                        let currentExplodeDie = kept;
                        const eOp = (chip.explodeOp !== undefined) ? chip.explodeOp : activeRules.explodeOp;
                        const eVal = (chip.explodeVal !== undefined) ? chip.explodeVal : activeRules.explodeVal;
                        while (eOp && eVal !== null && this.checkCondition(currentExplodeDie, eOp, eVal) && explodeCount < 10) {
                            currentExplodeDie = this.rng(chip.sides);
                            totalValueForThisDie += currentExplodeDie;
                            dieLog += `!->${currentExplodeDie}`;
                            explodeCount++;
                        }
                        groupExplosions += explodeCount;

                        if (activeRules.targetOp || activeRules.targetMode === 'count' || activeRules.setsOp) {
                            pool.push(kept);
                            if (explodeCount > 0) {
                                let parts = dieLog.split('!->');
                                for (let p = 1; p < parts.length; p++) {
                                    pool.push(parseInt(parts[p]));
                                }
                            }
                        } else {
                            pool.push(totalValueForThisDie);
                        }

                        rawRolls.push(dieLog);

                        if (chip.sides === 20 && !activeRules.targetOp && activeRules.targetMode === 'sum') {
                            if (totalValueForThisDie === 20) hasCritHit = true;
                            if (totalValueForThisDie === 1) hasCritFail = true;
                        }
                    }

                    let sum = 0;
                    let filteredPool = pool;
                    
                    // 1. Apply Target Condition (Only for COUNT mode)
                    if (activeRules.targetMode === 'count') {
                        if (activeRules.evalCriteria && Array.isArray(activeRules.evalCriteria.count)) {
                            filteredPool = pool.filter(v => this.evaluateCriteriaList(v, activeRules.evalCriteria.count, activeOverallTarget));
                        } else if (activeRules.targetOp) {
                            filteredPool = pool.filter(v => this.checkCondition(v, activeRules.targetOp, activeRules.targetVal));
                        }
                    }

                    // 2. Apply Sets Condition
                    let setGroups = {};
                    const hasSetsCriteria = activeRules.evalCriteria && Array.isArray(activeRules.evalCriteria.sets) && activeRules.evalCriteria.sets.length > 0;
                    if (hasSetsCriteria || (activeRules.setsOp && activeRules.setsVal !== null)) {
                        const counts = {};
                        filteredPool.forEach(v => counts[v] = (counts[v] || 0) + 1);
                        
                        Object.keys(counts).forEach(v => {
                            if (hasSetsCriteria) {
                                if (this.evaluateCriteriaList(counts[v], activeRules.evalCriteria.sets, activeOverallTarget)) {
                                    setGroups[v] = counts[v];
                                }
                            } else if (this.checkCondition(counts[v], activeRules.setsOp, activeRules.setsVal)) {
                                    setGroups[v] = counts[v];
                            }
                        });

                        filteredPool = filteredPool.filter(v => setGroups[v] !== undefined);
                    }

                    // Aggregate set groups across all dice groups
                    Object.entries(setGroups).forEach(([v, c]) => {
                        allSetGroups[v] = (allSetGroups[v] || 0) + c;
                    });
                    totalRerolls += groupRerolls;
                    totalExplosions += groupExplosions;
                    
                    if (activeRules.targetMode === 'count') {
                        sum = filteredPool.length;
                    } else {
                        sum = filteredPool.reduce((a, b) => a + b, 0);
                    }
                    
                    // Build formula string
                    let f = `${chip.count}d${chip.sides}`;
                    if (activeModifier === 'ADV') f += 'kh1';
                    if (activeModifier === 'DIS') f += 'kl1';
                    if (activeRules.rerollOp && activeRules.rerollVal !== null) f += `r${activeRules.rerollOp.replace('=', '')}${activeRules.rerollVal}`;
                    if (activeRules.explodeOp && activeRules.explodeVal !== null) f += `e${activeRules.explodeOp.replace('=', '')}${activeRules.explodeVal}`;
                    if (activeRules.targetMode === 'count' || activeRules.targetMode === 'sum') {
                        if (activeRules.targetOp && activeRules.targetVal !== null && activeRules.targetVal !== '') {
                            if (activeRules.targetMode === 'count') f += 'c';
                            let valStr = activeRules.targetVal;
                            if (activeRules.targetMode === 'sum') {
                                if (valStr === 'overall') valStr = 'TARGET';
                                else if (valStr === 'varX') valStr = 'VARX';
                            }
                            f += `${activeRules.targetOp.replace('=', '')}${valStr}`;
                        }
                    }
                    if (activeRules.setsOp && activeRules.setsVal !== null) f += `set${activeRules.setsOp.replace('=', '')}${activeRules.setsVal}`;
                    f = f.replace(/>=/g, '≥').replace(/<=/g, '≤');

                    let highlightedRaw = rawRolls.map(dieStr => {
                        const parts = dieStr.split('->');
                        const lastPart = parts[parts.length - 1];
                        const val = parseInt(lastPart.split('!')[0]);
                        
                        if (activeRules.setsOp && activeRules.setsVal !== null) {
                            if (setGroups[val] !== undefined) {
                                return `<span class="set-match" data-val="${val}">${dieStr}</span>`;
                            } else {
                                return `<span class="set-dim">${dieStr}</span>`;
                            }
                        }
                        return dieStr;
                    });

                    breakdownRows.push({
                        formula: f,
                        rolls: highlightedRaw.join(', '),
                        subtotal: sum
                    });

                    tokens.push({ type: 'num', value: sum });
                } else if (chip.chipType === 'modifier' || chip.chipType === 'number') {
                    let base = 0;
                    let baseStr = "";
                    if (chip.type === 'variable') {
                        const resolved = this.resolveVariable(chip.value);
                        base = resolved !== null ? resolved : 0;
                        baseStr = `${chip.value} (${resolved !== null ? resolved : 0})`;
                    } else {
                        base = Number(chip.value) || 0;
                        baseStr = `${base}`;
                    }

                    let mult = 1;
                    let multStr = "";
                    if (chip.multiplierType === 'variable') {
                        const resolved = this.resolveVariable(chip.multiplierValue);
                        mult = resolved !== null ? resolved : 1;
                        multStr = ` * ${chip.multiplierValue} (${mult})`;
                    } else if (chip.multiplierType === 'literal') {
                        mult = Number(chip.multiplierValue);
                        if (isNaN(mult)) mult = 1;
                        multStr = ` * ${mult}`;
                    }

                    let div = 1;
                    let divStr = "";
                    if (chip.divisorType === 'variable') {
                        const resolved = this.resolveVariable(chip.divisorValue);
                        div = resolved !== null ? resolved : 1;
                        divStr = ` / ${chip.divisorValue} (${div})`;
                    } else if (chip.divisorType === 'literal') {
                        div = Number(chip.divisorValue);
                        if (isNaN(div) || div === 0) div = 1;
                        divStr = ` / ${div}`;
                    }

                    let termVal = (base * mult) / div;
                    let formulaStr = baseStr;
                    if (multStr || divStr) {
                        formulaStr = `(${baseStr}${multStr}${divStr})`;
                    }

                    let roundStr = "";
                    if (chip.roundMode === 'up') {
                        termVal = Math.ceil(termVal);
                        roundStr = " (round up)";
                    } else if (chip.roundMode === 'down') {
                        termVal = Math.floor(termVal);
                        roundStr = " (round down)";
                    } else if (chip.roundMode === 'round') {
                        termVal = Math.round(termVal);
                        roundStr = " (round)";
                    }

                    const op = chip.operator === '-' ? '-' : '+';
                    const signedVal = op === '-' ? -termVal : termVal;

                    let breakdownFormulaName = `${op} ${chip.type === 'variable' ? chip.value : Math.abs(Number(chip.value))}${chip.multiplierType && chip.multiplierType !== 'none' ? ' * ' + chip.multiplierValue : ''}${chip.divisorType && chip.divisorType !== 'none' ? ' / ' + chip.divisorValue : ''}${roundStr}`;
                    let breakdownSubtotal = `${op === '-' ? '-' : '+'}${termVal}`;
                    
                    if ((!chip.multiplierType || chip.multiplierType === 'none') && (!chip.divisorType || chip.divisorType === 'none')) {
                        if (chip.type === 'variable') {
                            breakdownFormulaName = chip.value;
                            breakdownSubtotal = `${signedVal >= 0 ? '+' : ''}${signedVal}`;
                        } else if (chip.type === 'literal') {
                            breakdownFormulaName = 'Flat';
                            breakdownSubtotal = `${signedVal >= 0 ? '+' : ''}${signedVal}`;
                        }
                    }
                    
                    breakdownRows.push({
                        formula: breakdownFormulaName,
                        rolls: '',
                        subtotal: breakdownSubtotal
                    });

                    tokens.push({ type: 'num', value: signedVal });
                } else if (chip.chipType === 'operator') {
                    tokens.push({
                        type: 'op',
                        value: chip.operator,
                        roundMode: chip.roundMode || 'none'
                    });
                }
            });

            // Insert implicit '+' operators between adjacent values/parentheses
            let processedTokens = [];
            for (let i = 0; i < tokens.length; i++) {
                if (i > 0) {
                    const prev = tokens[i - 1];
                    const curr = tokens[i];
                    const prevIsVal = prev.type === 'num' || (prev.type === 'op' && prev.value === ')');
                    const currIsVal = curr.type === 'num' || (curr.type === 'op' && curr.value === '(');
                    if (prevIsVal && currIsVal) {
                        processedTokens.push({ type: 'op', value: '+', roundMode: 'none' });
                    }
                }
                processedTokens.push(tokens[i]);
            }
            tokens = processedTokens;

            // Parse RPN using Shunting-yard algorithm
            const rpn = [];
            const opStack = [];
            const precedence = {
                '+': 1,
                '-': 1,
                '*': 2,
                '/': 2
            };

            tokens.forEach(tok => {
                if (tok.type === 'num') {
                    rpn.push(tok.value);
                } else if (tok.type === 'op') {
                    if (tok.value === '(') {
                        opStack.push(tok);
                    } else if (tok.value === ')') {
                        while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
                            rpn.push(opStack.pop());
                        }
                        opStack.pop(); // Remove '('
                    } else {
                        while (opStack.length > 0 &&
                               opStack[opStack.length - 1].value !== '(' &&
                               precedence[opStack[opStack.length - 1].value] >= precedence[tok.value]) {
                            rpn.push(opStack.pop());
                        }
                        opStack.push(tok);
                    }
                }
            });

            while (opStack.length > 0) {
                rpn.push(opStack.pop());
            }

            // Evaluate RPN
            const valStack = [];
            rpn.forEach(node => {
                if (typeof node === 'number') {
                    valStack.push(node);
                } else {
                    const b = valStack.pop() ?? 0;
                    const a = valStack.pop() ?? 0;
                    let res = 0;
                    if (node.value === '+') {
                        res = a + b;
                    } else if (node.value === '-') {
                        res = a - b;
                    } else if (node.value === '*') {
                        res = a * b;
                    } else if (node.value === '/') {
                        res = b === 0 ? 0 : a / b;
                        if (node.roundMode === 'up') {
                            res = Math.ceil(res);
                        } else if (node.roundMode === 'down') {
                            res = Math.floor(res);
                        }
                    }
                    valStack.push(res);
                }
            });

            total = valStack.length > 0 ? valStack.pop() : 0;
        }

        // Compute heroClass
        let heroClass = null;
        if (hasCritHit) heroClass = 'crit-hit';
        else if (hasCritFail) heroClass = 'crit-fail';

        // Compute label and badges
        let labels = this._computeLabel(total, activeRules, allSetGroups, hasCritHit, hasCritFail, activeOverallTarget);
        let badges = this._computeBadges(activeRules, allSetGroups, hasCritHit, hasCritFail, totalRerolls, totalExplosions, labels);

        // Flat description for history log
        let flatDescription = breakdownRows.map(r => {
            let clean = r.rolls.replace(/<[^>]*>/g, '');
            return clean ? `${r.formula} [${clean}] → ${r.subtotal}` : `${r.formula} → ${r.subtotal}`;
        }).join(' | ');

        return {
            total,
            heroClass,
            labels,
            label: labels.length > 0 ? labels[0] : null, // Backwards compatibility
            badges,
            breakdown: breakdownRows,
            targetMode: activeRules.targetMode,
            flatDescription
        };
    }

    // --- Display Zone Helpers ---

    _getSetName(count) {
        if (count === 2) return 'Pair';
        if (count === 3) return 'Triple';
        if (count === 4) return 'Quad';
        return `${count}-of-a-Kind`;
    }

    _getDisplayOp(op) {
        if (!op) return "";
        return op.replace(/>=/g, '≥').replace(/<=/g, '≤').replace(/==/g, '=').replace(/=/g, '=');
    }

    _computeLabel(total, rules, setGroups, hasCritHit, hasCritFail, overallTarget) {
        let labels = [];

        // Priority 1: List mode (usually no labels)
        if (rules.targetMode === 'list') {
            return [];
        }

        const criteriaList = rules.evalCriteria;

        // Priority 2: Primary (Sum/Count) - Add this first so it's the top line
        if (rules.targetMode === 'count') {
            const hasCriteria = criteriaList && Array.isArray(criteriaList.count) && criteriaList.count.length > 0;
            const viewOnly = criteriaList && criteriaList.count && criteriaList.count.viewOnly;
            
            let condStr = "";
            if (hasCriteria) {
                condStr = criteriaList.count.map(c => {
                    let valDisplay = c.numVal;
                    if (c.mode === 'VAR') {
                        if (c.varVal === 'target') valDisplay = 'Target';
                        else valDisplay = c.varVal;
                    }
                    return `${this._getDisplayOp(c.op)}${valDisplay}`;
                }).join(` ${criteriaList.count[0].gate || 'AND'} `);
            } else {
                condStr = `${this._getDisplayOp(rules.targetOp) || '≥'}${rules.targetVal !== null ? rules.targetVal : '0'}`;
            }

            if (viewOnly) {
                labels.push({ text: `${total} DICE ${condStr}`, color: 'slate' });
            } else {
                if (overallTarget !== null) {
                    const isSuccess = total >= overallTarget;
                    labels.push({ text: `${total} DICE ${condStr}, Target ≥ ${overallTarget} ➔ ${isSuccess ? 'SUCCESS' : 'FAIL'}`, color: isSuccess ? 'emerald' : 'rose' });
                } else {
                    labels.push({ text: `${total} DICE ${condStr}`, color: 'slate' });
                }
            }
        } else if (rules.targetMode === 'sum') {
            const hasCriteria = criteriaList && Array.isArray(criteriaList.sum) && criteriaList.sum.length > 0;
            const viewOnly = criteriaList && criteriaList.sum && criteriaList.sum.viewOnly;

            if (viewOnly) {
                labels.push({ text: `SUM: ${total}`, color: 'slate' });
            } else if (hasCriteria) {
                const isSuccess = this.evaluateCriteriaList(total, criteriaList.sum, overallTarget);
                let desc = criteriaList.sum.map(c => {
                    let valDisplay = c.numVal;
                    if (c.mode === 'VAR') {
                        if (c.varVal === 'target') {
                            valDisplay = overallTarget !== null ? overallTarget : 'Target';
                        } else {
                            const resolved = this.resolveVariable(c.varVal);
                            valDisplay = resolved !== null ? `${c.varVal}(${resolved})` : c.varVal;
                        }
                    }
                    return `${this._getDisplayOp(c.op)} ${valDisplay}`;
                }).join(` ${criteriaList.sum[0].gate || 'AND'} `);

                labels.push({ text: `${total} ${desc} ➔ ${isSuccess ? 'SUCCESS' : 'FAIL'}`, color: isSuccess ? 'emerald' : 'rose' });
            } else if (rules.targetOp && rules.targetVal !== null && rules.targetVal !== '') {
                let actualTarget = 0;
                let displayTargetStr = rules.targetVal;
                if (rules.targetVal === 'overall') {
                    actualTarget = overallTarget !== null ? overallTarget : 0;
                    displayTargetStr = actualTarget;
                } else {
                    const resolved = this.resolveVariable(rules.targetVal);
                    if (resolved !== null) {
                        actualTarget = resolved;
                        displayTargetStr = `${rules.targetVal} (${resolved})`;
                    } else {
                        actualTarget = Number(rules.targetVal);
                        displayTargetStr = rules.targetVal;
                    }
                }
                const isSuccess = this.checkCondition(total, rules.targetOp, actualTarget);
                labels.push({ text: `${total} ${this._getDisplayOp(rules.targetOp)} ${displayTargetStr} ➔ ${isSuccess ? 'SUCCESS' : 'FAIL'}`, color: isSuccess ? 'emerald' : 'rose' });
            } else if (overallTarget !== null && rules.targetOp !== "") {
                const isSuccess = total >= overallTarget;
                labels.push({ text: `${total} ≥ ${overallTarget} ➔ ${isSuccess ? 'SUCCESS' : 'FAIL'}`, color: isSuccess ? 'emerald' : 'rose' });
            }
        }

        // Priority 3: Sets
        const hasSetsCriteria = criteriaList && Array.isArray(criteriaList.sets) && criteriaList.sets.length > 0;
        const setsActive = hasSetsCriteria || (rules.setsOp && rules.setsVal !== null);
        
        if (setsActive) {
            const setEntries = Object.entries(setGroups);
            const viewOnly = criteriaList && criteriaList.sets && criteriaList.sets.viewOnly;
            
            let condStr = "";
            if (hasSetsCriteria) {
                condStr = criteriaList.sets.map(c => {
                    let valDisplay = c.numVal;
                    if (c.mode === 'VAR') {
                        if (c.varVal === 'target') valDisplay = 'Target';
                        else valDisplay = c.varVal;
                    }
                    return `${this._getDisplayOp(c.op)}${valDisplay}`;
                }).join(` ${criteriaList.sets[0].gate || 'AND'} `);
            } else {
                condStr = `${this._getDisplayOp(rules.setsOp)}${rules.setsVal}`;
            }

            if (setEntries.length === 0) {
                if (viewOnly) {
                    labels.push({ text: `0 DICE SETS (${condStr})`, color: 'slate' });
                } else {
                    labels.push({ text: `0 DICE SETS ${condStr} ➔ FAIL`, color: 'rose' });
                }
            } else {
                const details = setEntries.map(([val, count]) => `(${count} x ${val}'s)`).join(', ');
                const matchingDiceCount = setEntries.reduce((sum, [_, count]) => sum + count, 0);
                if (viewOnly) {
                    labels.push({ text: `${matchingDiceCount} DICE SETS: ${details}`, color: 'sky' });
                } else {
                    labels.push({ text: `${matchingDiceCount} DICE SETS ${condStr} ➔ ${details}`, color: 'sky' });
                }
            }
        }

        // Priority 4: Crits
        if (hasCritHit) labels.push({ text: 'NATURAL 20', color: 'emerald' });
        if (hasCritFail) labels.push({ text: 'NATURAL 1', color: 'rose' });

        return labels;
    }

    _computeBadges(rules, setGroups, hasCritHit, hasCritFail, totalRerolls, totalExplosions, labels) {
        let badges = [];

        // Sets badge (when labels aren't showing detailed set info)
        const setsActive = rules.setsOp && rules.setsVal !== null;
        const labelIsSetInfo = labels.some(l => l.text.includes('DICE SETS'));
        if (setsActive && !labelIsSetInfo) {
            const setEntries = Object.entries(setGroups);
            if (setEntries.length > 0) {
                const setTexts = setEntries.map(([v, c]) => `${c}×${v}`);
                badges.push({ icon: '🎲', text: `Sets: ${setTexts.join(', ')}`, color: 'sky' });
            }
        }

        // Crit badges (when labels aren't showing NAT 20/1)
        if (hasCritHit && !labels.some(l => l.text === 'NATURAL 20')) {
            badges.push({ icon: '⚡', text: 'NAT 20', color: 'emerald' });
        }
        if (hasCritFail && !labels.some(l => l.text === 'NATURAL 1')) {
            badges.push({ icon: '💀', text: 'NAT 1', color: 'rose' });
        }

        // Explosions
        if (totalExplosions > 0) {
            badges.push({ icon: '💥', text: `${totalExplosions} Explosion${totalExplosions > 1 ? 's' : ''}`, color: 'amber' });
        }

        // Rerolls
        if (totalRerolls > 0) {
            badges.push({ icon: '🔄', text: `${totalRerolls} Reroll${totalRerolls > 1 ? 's' : ''}`, color: 'slate' });
        }

        return badges;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DiceEngine;
} else {
    window.DiceEngine = DiceEngine;
}
