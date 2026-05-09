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
            countThreshOp: "", countThreshVal: null,
            setsOp: "", setsVal: null
        };
        this.savedQueues = [];
        this.rng = this.defaultRng;
        this.overallTarget = null;
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
        if (this.overallTarget !== null) {
            this.overallTarget = null;
        } else if (this.activeModifier) {
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
        this.rollingQueue = [];
        this.activeModifier = null;
        this.modifierLevel = 0;
        this.flatMod = 0;
        
        this.rollRules = {
            rerollOp: "", rerollVal: null,
            explodeOp: "", explodeVal: null,
            targetMode: "sum", targetOp: "", targetVal: null,
            countThreshOp: "", countThreshVal: null,
            setsOp: "", setsVal: null
        };
        
        this.overallTarget = null;
    }

    updateRules(rules) {
        this.rollRules = { ...this.rollRules, ...rules };
    }

    checkCondition(val, op, target) {
        if (!op || target === null || isNaN(target)) return false;
        if (op === '>=') return val >= target;
        if (op === '<=') return val <= target;
        if (op === '>') return val > target;
        if (op === '<') return val < target;
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

        const isListMode = this.rollRules.targetMode === 'list';
        let total = isListMode ? [] : 0;
        let breakdownRows = [];
        let hasCritHit = false;
        let hasCritFail = false;
        let allSetGroups = {};
        let totalRerolls = 0;
        let totalExplosions = 0;

        activeQueue.forEach(group => {
            let pool = [];
            let rawRolls = [];
            let groupRerolls = 0;
            let groupExplosions = 0;
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
                groupRerolls += rerollCount;

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
                groupExplosions += explodeCount;

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
            
            // 1. Apply Target Condition (Only for COUNT mode)
            if (this.rollRules.targetOp && this.rollRules.targetMode === 'count') {
                filteredPool = pool.filter(v => this.checkCondition(v, this.rollRules.targetOp, this.rollRules.targetVal));
            }

            // 2. Apply Sets Condition
            let setGroups = {};
            if (this.rollRules.setsOp && this.rollRules.setsVal !== null) {
                const counts = {};
                filteredPool.forEach(v => counts[v] = (counts[v] || 0) + 1);
                
                Object.keys(counts).forEach(v => {
                    if (this.checkCondition(counts[v], this.rollRules.setsOp, this.rollRules.setsVal)) {
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
            
            if (this.rollRules.targetMode === 'count') {
                sum = filteredPool.length;
            } else if (this.rollRules.targetMode === 'list') {
                // Sort each die type individually
                filteredPool.sort((a, b) => a - b);
                sum = filteredPool.join(', ');
            } else {
                sum = filteredPool.reduce((a, b) => a + b, 0);
            }
            
            // Build formula string
            let f = `${group.count}d${group.sides}`;
            if (this.activeModifier === 'ADV') f += 'kh1';
            if (this.activeModifier === 'DIS') f += 'kl1';
            if (this.rollRules.rerollOp && this.rollRules.rerollVal !== null) f += `r${this.rollRules.rerollOp.replace('=', '')}${this.rollRules.rerollVal}`;
            if (this.rollRules.explodeOp && this.rollRules.explodeVal !== null) f += `e${this.rollRules.explodeOp.replace('=', '')}${this.rollRules.explodeVal}`;
            if (this.rollRules.targetMode === 'count' || this.rollRules.targetMode === 'sum') {
                if (this.rollRules.targetOp && this.rollRules.targetVal !== null && this.rollRules.targetVal !== '') {
                    if (this.rollRules.targetMode === 'count') f += 'c';
                    let valStr = this.rollRules.targetVal;
                    if (this.rollRules.targetMode === 'sum') {
                        if (valStr === 'overall') valStr = 'TGT';
                        else if (valStr === 'varX') valStr = 'VARX';
                    }
                    f += `${this.rollRules.targetOp.replace('=', '')}${valStr}`;
                }
            }
            if (this.rollRules.setsOp && this.rollRules.setsVal !== null) f += `set${this.rollRules.setsOp.replace('=', '')}${this.rollRules.setsVal}`;
            f = f.replace(/>=/g, '≥').replace(/<=/g, '≤');

            // Highlight sets in the roll log
            let highlightedRaw = rawRolls.map(dieStr => {
                const parts = dieStr.split('->');
                const lastPart = parts[parts.length - 1];
                const val = parseInt(lastPart.split('!')[0]);
                
                if (this.rollRules.setsOp && this.rollRules.setsVal !== null) {
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
            
            if (isListMode) {
                if (sum) total.push(sum);
            } else {
                total += sum;
            }
        });

        if (isListMode) {
            total = total.join(', ') || '0';
        }

        if (this.rollRules.targetMode !== 'count' && !isListMode) {
            total += activeFlat;
            if (activeFlat !== 0) {
                breakdownRows.push({
                    formula: 'Flat Mod',
                    rolls: '',
                    subtotal: `${activeFlat > 0 ? '+' : ''}${activeFlat}`
                });
            }
        }

        // Compute heroClass
        let heroClass = null;
        if (hasCritHit) heroClass = 'crit-hit';
        else if (hasCritFail) heroClass = 'crit-fail';

        // Compute label and badges
        const setsActive = this.rollRules.setsOp && this.rollRules.setsVal !== null;
        let label = this._computeLabel(total, this.rollRules, allSetGroups, hasCritHit, hasCritFail);
        let badges = this._computeBadges(this.rollRules, allSetGroups, hasCritHit, hasCritFail, totalRerolls, totalExplosions, label);

        // Flat description for history log
        let flatDescription = breakdownRows.map(r => {
            let clean = r.rolls.replace(/<[^>]*>/g, '');
            return clean ? `${r.formula} [${clean}] → ${r.subtotal}` : `${r.formula} → ${r.subtotal}`;
        }).join(' | ');

        return {
            total,
            heroClass,
            label,
            badges,
            breakdown: breakdownRows,
            targetMode: this.rollRules.targetMode,
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

    _computeLabel(total, rules, setGroups, hasCritHit, hasCritFail) {
        // Priority 1: List mode
        if (rules.targetMode === 'list') {
            return null;
        }

        // Priority 2: Sets
        const setsActive = rules.setsOp && rules.setsVal !== null;
        if (setsActive) {
            const setEntries = Object.entries(setGroups);
            const op = this._getDisplayOp(rules.setsOp);
            
            if (setEntries.length === 0) {
                return { text: `0 DICE SETS ${op} ${rules.setsVal} ➔ FAIL`, color: 'rose' };
            }
            
            // Generate details: (Count x Value's)
            const details = setEntries.map(([val, count]) => `(${count} x ${val}'s)`).join(', ');
            const matchingDiceCount = setEntries.reduce((sum, [_, count]) => sum + count, 0);
            
            return { text: `${matchingDiceCount} DICE SETS ${op} ${rules.setsVal} ➔ ${details}`, color: 'sky' };
        }

        // Priority 3: Count Mode logic
        if (rules.targetMode === 'count') {
            const hasThresh = rules.countThreshOp && rules.countThreshVal !== null;
            if (hasThresh) {
                let actualThresh = rules.countThreshVal;
                let displayThreshStr = rules.countThreshVal;
                if (rules.countThreshVal === 'overall') {
                    actualThresh = this.overallTarget !== null ? this.overallTarget : 0;
                    displayThreshStr = actualThresh;
                } else if (rules.countThreshVal === 'varX') {
                    actualThresh = 0;
                    displayThreshStr = 'VARIABLE X';
                }
                const isSuccess = this.checkCondition(total, rules.countThreshOp, actualThresh);
                const status = isSuccess ? 'SUCCESS' : 'FAIL';
                const color = isSuccess ? 'emerald' : 'rose';
                const threshOpDisplay = this._getDisplayOp(rules.countThreshOp);
                const dieOpDisplay = this._getDisplayOp(rules.targetOp) || '≥';
                const dieVal = (rules.targetVal !== null && rules.targetVal !== '') ? rules.targetVal : '0';
                
                return { text: `${total} ${dieOpDisplay} ${dieVal}, Target ${threshOpDisplay} ${displayThreshStr} ➔ ${status}`, color: color };
            } else {
                // "Any" case: Hide success/fail and target label
                const dieOpDisplay = this._getDisplayOp(rules.targetOp) || '≥';
                const dieVal = (rules.targetVal !== null && rules.targetVal !== '') ? rules.targetVal : '0';
                return { text: `${total} DICE ${dieOpDisplay} ${dieVal}`, color: 'slate' };
            }
        }

        // Priority 4: Advanced Target (Sum mode)
        if (rules.targetMode === 'sum' && rules.targetOp && rules.targetVal !== null && rules.targetVal !== '') {
            let actualTarget = 0;
            let displayTargetStr = rules.targetVal;
            if (rules.targetVal === 'overall') {
                actualTarget = this.overallTarget !== null ? this.overallTarget : 0;
                displayTargetStr = actualTarget;
            } else if (rules.targetVal === 'varX') {
                actualTarget = 0;
                displayTargetStr = 'VARIABLE X';
            }
            
            const isSuccess = this.checkCondition(total, rules.targetOp, actualTarget);
            const status = isSuccess ? 'SUCCESS' : 'FAIL';
            const color = isSuccess ? 'emerald' : 'rose';
            const opDisplay = this._getDisplayOp(rules.targetOp);
            return { text: `${total} ${opDisplay} ${displayTargetStr} ➔ ${status}`, color: color };
        }

        // Priority 5: Overall Target (Sum mode only)
        // Skip if targetOp is explicitly empty (Any)
        if (this.overallTarget !== null && rules.targetMode === 'sum' && rules.targetOp !== "") {
            const isSuccess = total >= this.overallTarget;
            const status = isSuccess ? 'SUCCESS' : 'FAIL';
            const color = isSuccess ? 'emerald' : 'rose';
            return { text: `${total} ≥ ${this.overallTarget} ➔ ${status}`, color: color };
        }

        // Priority 6: Crits
        if (hasCritHit) return { text: 'NATURAL 20', color: 'emerald' };
        if (hasCritFail) return { text: 'NATURAL 1', color: 'rose' };

        return null;
    }

    _computeBadges(rules, setGroups, hasCritHit, hasCritFail, totalRerolls, totalExplosions, label) {
        let badges = [];

        // Sets badge (when label is showing something else, e.g. count mode)
        const setsActive = rules.setsOp && rules.setsVal !== null;
        const labelIsSetInfo = label && label.text.includes('DICE SETS');
        if (setsActive && !labelIsSetInfo) {
            const setEntries = Object.entries(setGroups);
            if (setEntries.length > 0) {
                const setTexts = setEntries.map(([v, c]) => `${c}×${v}`);
                badges.push({ icon: '🎲', text: `Sets: ${setTexts.join(', ')}`, color: 'sky' });
            }
        }

        // Crit badges (when label is showing something else)
        if (hasCritHit && (!label || label.text !== 'NATURAL 20')) {
            badges.push({ icon: '⚡', text: 'NAT 20', color: 'emerald' });
        }
        if (hasCritFail && (!label || label.text !== 'NATURAL 1')) {
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
