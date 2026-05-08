class DiceEngine {
    constructor() {
        this.rollingQueue = [];
        this.activeModifier = null; // 'ADV', 'DIS', or null
        this.modifierLevel = 0;
        this.flatMod = 0;
        this.rollRules = {
            rerollOp: "", rerollVal: null,
            explodeOp: "", explodeVal: null,
            targetMode: "sum", targetOp: "", targetVal: null,
            setsOp: "", setsVal: null
        };
        this.savedQueues = [];
        this.rng = this.defaultRng;
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
        const index = this.rollingQueue.findIndex(q => q.sides === sides);
        if (index > -1) {
            this.rollingQueue[index].count += delta;
            if (this.rollingQueue[index].count <= 0) this.rollingQueue.splice(index, 1);
        } else if (delta > 0) {
            this.rollingQueue.push({ sides: sides, count: delta });
        }
    }

    backspaceQueue() {
        if (this.activeModifier) {
            this.activeModifier = null;
            this.modifierLevel = 0;
        } else if (this.flatMod !== 0) {
            this.flatMod = 0;
        } else if (this.rollingQueue.length > 0) {
            this.rollingQueue.pop();
        }
    }

    adjustFlatMod(val) {
        this.flatMod += val;
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
        this.rollingQueue = [];
        this.activeModifier = null;
        this.modifierLevel = 0;
        this.flatMod = 0;
        
        this.rollRules.rerollOp = "";
        this.rollRules.explodeOp = "";
        this.rollRules.targetOp = "";
        this.rollRules.setsOp = "";
    }

    updateRules(rules) {
        this.rollRules = { ...this.rollRules, ...rules };
    }

    checkCondition(val, op, target) {
        if (!op || target === null || isNaN(target)) return false;
        if (op === '>=') return val >= target;
        if (op === '<=') return val <= target;
        if (op === '=') return val === target;
        return false;
    }

    // ARSENAL LOGIC
    saveQueue(name, color = '#ef4444') {
        if (this.rollingQueue.length === 0 && this.flatMod === 0) return null;
        const newSaved = {
            id: Date.now(),
            name: name,
            color: color,
            queue: JSON.parse(JSON.stringify(this.rollingQueue)),
            modifier: this.activeModifier,
            modLevel: this.modifierLevel,
            flat: this.flatMod,
            rules: JSON.parse(JSON.stringify(this.rollRules))
        };
        this.savedQueues.push(newSaved);
        return newSaved;
    }

    loadQueue(id) {
        const item = this.savedQueues.find(q => q.id === id);
        if (!item) return;

        this.rollingQueue = JSON.parse(JSON.stringify(item.queue));
        this.activeModifier = item.modifier;
        this.modifierLevel = item.modLevel;
        this.flatMod = item.flat;
        this.rollRules = item.rules ? JSON.parse(JSON.stringify(item.rules)) : { rerollOp: "", rerollVal: null, explodeOp: "", explodeVal: null, targetMode: "sum", targetOp: "", targetVal: null, setsOp: "", setsVal: null };
        if (!this.rollRules.targetMode) this.rollRules.targetMode = "sum";
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

        item.queue = JSON.parse(JSON.stringify(this.rollingQueue));
        item.modifier = this.activeModifier;
        item.modLevel = this.modifierLevel;
        item.flat = this.flatMod;
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
    calculateRoll(forcedQueue = null, isInstant = false) {
        const activeQueue = forcedQueue || this.rollingQueue;
        const activeFlat = isInstant ? 0 : this.flatMod;

        if ((activeQueue.length === 0 && activeFlat === 0)) return null;

        let total = 0;
        let details = [];
        let hasCritHit = false;
        let hasCritFail = false;

        activeQueue.forEach(group => {
            let pool = [];
            let rawRolls = [];
            const rollsToTake = 1 + (this.activeModifier ? this.modifierLevel : 0);

            for (let i = 0; i < group.count; i++) {
                let dieRolls = [];
                for (let j = 0; j < rollsToTake; j++) dieRolls.push(this.rng(group.sides));

                let kept = dieRolls[0];
                if (this.activeModifier === 'ADV') kept = Math.max(...dieRolls);
                if (this.activeModifier === 'DIS') kept = Math.min(...dieRolls);

                let dieLog = "";
                if (dieRolls.length > 1) {
                    dieLog += `(${dieRolls.join(', ')})${this.activeModifier === 'ADV' ? 'kh1' : 'kl1'}->`;
                }
                dieLog += `${kept}`;

                // Reroll Logic
                let rerollCount = 0;
                while (this.checkCondition(kept, this.rollRules.rerollOp, this.rollRules.rerollVal) && rerollCount < 10) {
                    kept = this.rng(group.sides);
                    dieLog += `r->${kept}`;
                    rerollCount++;
                }

                let totalValueForThisDie = kept;

                // Explode Logic
                let explodeCount = 0;
                let currentExplodeDie = kept;
                while (this.checkCondition(currentExplodeDie, this.rollRules.explodeOp, this.rollRules.explodeVal) && explodeCount < 10) {
                    currentExplodeDie = this.rng(group.sides);
                    totalValueForThisDie += currentExplodeDie;
                    dieLog += `!->${currentExplodeDie}`;
                    explodeCount++;
                }

                if (this.rollRules.targetOp || this.rollRules.targetMode === 'count') {
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

                if (group.sides === 20 && !this.rollRules.targetOp && this.rollRules.targetMode === 'sum') {
                    if (totalValueForThisDie === 20) hasCritHit = true;
                    if (totalValueForThisDie === 1) hasCritFail = true;
                }
            }

            let sum = 0;
            let filteredPool = pool;
            
            // 1. Apply Target Condition
            if (this.rollRules.targetOp) {
                filteredPool = pool.filter(v => this.checkCondition(v, this.rollRules.targetOp, this.rollRules.targetVal));
            }

            // 2. Apply Sets Condition
            let setGroups = {};
            if (this.rollRules.setsOp && this.rollRules.setsVal !== null) {
                const counts = {};
                filteredPool.forEach(v => counts[v] = (counts[v] || 0) + 1);
                
                // Identify which values are part of a valid set
                Object.keys(counts).forEach(v => {
                    if (this.checkCondition(counts[v], this.rollRules.setsOp, this.rollRules.setsVal)) {
                        setGroups[v] = counts[v];
                    }
                });

                filteredPool = filteredPool.filter(v => setGroups[v] !== undefined);
            }
            
            if (this.rollRules.targetMode === 'count') {
                sum = filteredPool.length;
            } else {
                sum = filteredPool.reduce((a, b) => a + b, 0);
            }
            
            let f = `${group.count}d${group.sides}`;
            if (this.activeModifier === 'ADV') f += 'kh1';
            if (this.activeModifier === 'DIS') f += 'kl1';
            if (this.rollRules.rerollOp) f += `r${this.rollRules.rerollOp.replace('=', '')}${this.rollRules.rerollVal}`;
            if (this.rollRules.explodeOp) f += `e${this.rollRules.explodeOp.replace('=', '')}${this.rollRules.explodeVal}`;
            if (this.rollRules.targetMode === 'count') {
                f += 'c';
                if (this.rollRules.targetOp) f += `${this.rollRules.targetOp.replace('=', '')}${this.rollRules.targetVal}`;
            } else {
                if (this.rollRules.targetOp) f += `s${this.rollRules.targetOp.replace('=', '')}${this.rollRules.targetVal}`;
            }
            if (this.rollRules.setsOp) f += `set${this.rollRules.setsOp.replace('=', '')}${this.rollRules.setsVal}`;
            f = f.replace(/>=/g, '≥').replace(/<=/g, '≤');

            // Highlight sets in the roll log
            let highlightedRaw = rawRolls.map(dieStr => {
                // Extracts the final kept value from dieStr (e.g., "1r->5" -> 5)
                const parts = dieStr.split('->');
                const lastPart = parts[parts.length - 1];
                const val = parseInt(lastPart.split('!')[0]); // Handle explosion markers if any
                
                if (this.rollRules.setsOp && this.rollRules.setsVal !== null) {
                    if (setGroups[val] !== undefined) {
                        return `<span class="set-match" data-val="${val}">${dieStr}</span>`;
                    } else {
                        return `<span class="set-dim">${dieStr}</span>`;
                    }
                }
                return dieStr;
            });

            let setSummary = "";
            const setsFound = Object.keys(setGroups);
            if (setsFound.length > 0) {
                setSummary = ` <span class="text-[8px] text-sky-300/60 uppercase">Sets: ${setsFound.map(v => `${setGroups[v]}x[${v}]`).join(', ')}</span>`;
            }

            let groupLog = `<span><span class="text-sky-400 font-bold">${f}</span> [${highlightedRaw.join(', ')}] &rarr; <span class="text-white font-bold">${sum}</span>${this.rollRules.targetMode === 'count' ? ' ✓' : ''}${setSummary}</span>`;
            
            details.push(groupLog);
            total += sum;
        });

        if (this.rollRules.targetMode !== 'count') {
            total += activeFlat;
            if (activeFlat !== 0) details.push(`<span><span class="text-sky-400 font-bold">Flat Mod</span> &rarr; <span class="text-white font-bold">${activeFlat > 0 ? '+' : ''}${activeFlat}</span></span>`);
        }

        return {
            total,
            details: details.join(""),
            hasCritHit,
            hasCritFail,
            targetMode: this.rollRules.targetMode
        };
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DiceEngine;
} else {
    window.DiceEngine = DiceEngine;
}
