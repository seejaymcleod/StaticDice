const DiceEngine = require('../DiceEngine');

describe('DiceEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new DiceEngine();
        // Use a predictable RNG for testing (always returns the max value unless overridden)
        engine.setRng((sides) => sides);
    });

    test('changeQueue adds and removes dice correctly', () => {
        engine.changeQueue(20, 1);
        expect(engine.rollingQueue).toEqual([{ sides: 20, count: 1 }]);

        engine.changeQueue(20, 2);
        expect(engine.rollingQueue).toEqual([{ sides: 20, count: 3 }]);

        engine.changeQueue(20, -1);
        expect(engine.rollingQueue).toEqual([{ sides: 20, count: 2 }]);

        engine.changeQueue(20, -2);
        expect(engine.rollingQueue.length).toBe(0);
    });

    test('backspaceQueue removes nodes in reverse chronological order', () => {
        engine.changeQueue(20, 1);
        engine.applyModifier('ADV');
        engine.adjustFlatMod(5);

        // Queue is: [1d20, ADV, +5]
        expect(engine.queue.length).toBe(3);
        expect(engine.flatMod).toBe(5);

        engine.backspaceQueue(); // removes flat mod (+5)
        expect(engine.flatMod).toBe(0);
        expect(engine.queue.length).toBe(2);

        engine.backspaceQueue(); // removes ADV operator node
        expect(engine.queue.length).toBe(1);

        engine.backspaceQueue(); // removes last die group
        expect(engine.queue.length).toBe(0);
    });

    test('clearQueue resets all state', () => {
        engine.changeQueue(20, 1);
        engine.applyModifier('DIS');
        engine.adjustFlatMod(2);
        engine.updateRules({ rerollOp: "<=", rerollVal: 2 });

        engine.clearQueue();

        expect(engine.queue.length).toBe(0);
        expect(engine.flatMod).toBe(0);
        expect(engine.rollRules.rerollOp).toBe("");
    });

    test('adjustFlatMod updates the flat modifier correctly', () => {
        engine.adjustFlatMod(2);
        expect(engine.flatMod).toBe(2);
        engine.adjustFlatMod(-1);
        expect(engine.flatMod).toBe(1);
    });

    test('applyModifier appends and stacks ADV/DIS nodes correctly', () => {
        engine.changeQueue(20, 1);
        
        engine.applyModifier('ADV');
        expect(engine.queue[1]).toEqual({
            nodeType: 'operator',
            operator: 'ADV',
            modifierLevel: 1
        });

        engine.applyModifier('ADV'); // Stack it
        expect(engine.queue[1]).toEqual({
            nodeType: 'operator',
            operator: 'ADV',
            modifierLevel: 2
        });

        engine.applyModifier('DIS'); // Swaps to DIS
        expect(engine.queue[1]).toEqual({
            nodeType: 'operator',
            operator: 'DIS',
            modifierLevel: 1
        });
    });

    test('checkCondition correctly evaluates rules', () => {
        expect(engine.checkCondition(5, '>=', 4)).toBe(true);
        expect(engine.checkCondition(3, '>=', 4)).toBe(false);
        expect(engine.checkCondition(2, '<=', 2)).toBe(true);
        expect(engine.checkCondition(4, '<=', 2)).toBe(false);
        expect(engine.checkCondition(6, '=', 6)).toBe(true);
        expect(engine.checkCondition(6, '=', 5)).toBe(false);
    });

    describe('calculateRoll logic', () => {
        test('basic roll calculation', () => {
            engine.changeQueue(6, 2);
            engine.adjustFlatMod(3);
            const result = engine.calculateRoll();
            // RNG always returns sides (6), so 2d6 = 12, + 3 = 15
            expect(result.total).toBe(15);
        });

        test('advantage calculation', () => {
            let callCount = 0;
            // First roll 5, second roll 15
            engine.setRng((sides) => {
                callCount++;
                return callCount === 1 ? 5 : 15;
            });
            engine.changeQueue(20, 1);
            engine.applyModifier('ADV');
            
            const result = engine.calculateRoll();
            expect(result.total).toBe(15);
        });

        test('disadvantage calculation', () => {
            let callCount = 0;
            engine.setRng((sides) => {
                callCount++;
                return callCount === 1 ? 5 : 15;
            });
            engine.changeQueue(20, 1);
            engine.applyModifier('DIS');
            
            const result = engine.calculateRoll();
            expect(result.total).toBe(5);
        });

        test('reroll logic', () => {
            let callCount = 0;
            // Roll 1, reroll triggers, roll 2, reroll triggers, roll 8
            engine.setRng((sides) => {
                callCount++;
                if (callCount === 1) return 1;
                if (callCount === 2) return 2;
                return 8;
            });
            engine.updateRules({ rerollOp: "<=", rerollVal: 2 });
            engine.changeQueue(20, 1);

            const result = engine.calculateRoll();
            expect(result.total).toBe(8);
        });

        test('explode logic', () => {
            let callCount = 0;
            // Roll 10, explode, roll 10, explode, roll 4
            engine.setRng((sides) => {
                callCount++;
                if (callCount <= 2) return 10;
                return 4;
            });
            engine.updateRules({ explodeOp: "=", explodeVal: 10 });
            engine.changeQueue(10, 1);

            const result = engine.calculateRoll();
            // 10 + 10 + 4
            expect(result.total).toBe(24);
        });

        test('target mode (count successes)', () => {
            let callCount = 0;
            // Rolls: 4, 8, 2
            engine.setRng((sides) => {
                callCount++;
                if (callCount === 1) return 4;
                if (callCount === 2) return 8;
                return 2;
            });
            engine.updateRules({ targetMode: "count", targetOp: ">=", targetVal: 5 });
            engine.changeQueue(10, 3);

            const result = engine.calculateRoll();
            // Only 8 is >= 5, so 1 success
            expect(result.total).toBe(1);
        });

        test('sets scoring logic (singleton counts)', () => {
            let callCount = 0;
            // Rolls: 3, 3, 4, 5
            engine.setRng((sides) => {
                callCount++;
                const r = [3, 3, 4, 5];
                return r[callCount - 1];
            });
            engine.updateRules({ targetMode: "count", setsOp: "=", setsVal: 1 });
            engine.changeQueue(6, 4);

            const result = engine.calculateRoll();
            // 3s are paired (count 2), 4 and 5 are singletons (count 1).
            // So singletons are 4 and 5 (2 singletons).
            expect(result.total).toBe(2);
        });

        test('sets scoring logic (pairs counts)', () => {
            let callCount = 0;
            // Rolls: 3, 3, 4, 4
            engine.setRng((sides) => {
                callCount++;
                const r = [3, 3, 4, 4];
                return r[callCount - 1];
            });
            engine.updateRules({ targetMode: "count", setsOp: "=", setsVal: 2 });
            engine.changeQueue(6, 4);

            const result = engine.calculateRoll();
            // Both 3 and 4 are pairs (count 2). So 4 total dice are part of pairs.
            expect(result.total).toBe(4);
        });

        test('variable flat modifier resolution', () => {
            engine.changeQueue(20, 1);
            engine.setRng(() => 15);
            
            // Mock resolveVariable
            engine.resolveVariable = (name) => {
                if (name === 'STR') return 2;
                return null;
            };
            
            engine.flatMod = 'STR';
            engine.updateRules({ targetMode: 'sum' });
            
            const result = engine.calculateRoll();
            expect(result.total).toBe(17);
            expect(result.breakdown[1]).toEqual({
                formula: 'STR',
                rolls: '',
                subtotal: '+2'
            });
        });

        test('complex modifier nodes calculation', () => {
            engine.changeQueue(20, 1);
            engine.setRng(() => 10); // roll 10
            
            engine.resolveVariable = (name) => {
                if (name === 'LVL') return 5;
                if (name === 'STR') return 3;
                return null;
            };
            
            // Roll 10 + [STR * 2] - [LVL / 2 (round down)] + [4]
            // = 10 + [3 * 2] - [floor(5/2)] + 4
            // = 10 + 6 - 2 + 4 = 18
            engine.flatMod = [
                { type: 'variable', value: 'STR', operator: '+', multiplierType: 'literal', multiplierValue: 2, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { type: 'variable', value: 'LVL', operator: '-', multiplierType: 'none', multiplierValue: 1, divisorType: 'literal', divisorValue: 2, roundMode: 'down' },
                { type: 'literal', value: 4, operator: '+', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            
            const result = engine.calculateRoll();
            expect(result.total).toBe(18);
        });

        test('count successes mode with modifiers', () => {
            let callCount = 0;
            // Rolls: 4, 8, 2
            engine.setRng((sides) => {
                callCount++;
                if (callCount === 1) return 4;
                if (callCount === 2) return 8;
                return 2;
            });
            engine.updateRules({ targetMode: "count", targetOp: ">=", targetVal: 5 });
            engine.changeQueue(10, 3);
            
            // Add a +2 successes node
            engine.flatMod = 2;

            const result = engine.calculateRoll();
            // Only 8 is >= 5, so 1 success. Plus 2 from modifier = 3.
            expect(result.total).toBe(3);
        });

        test('local advantage on adjacent die only', () => {
            let rollSequence = [
                // 1d20 rolls (with ADV, so 2 rolls)
                5, 15,
                // 1d6 rolls (no ADV, so 1 roll)
                4
            ];
            let callCount = 0;
            engine.setRng((sides) => {
                const val = rollSequence[callCount];
                callCount++;
                return val;
            });

            // 1d20 ADV + 1d6
            engine.changeQueue(20, 1);
            engine.applyModifier('ADV');
            engine.queue.push({ nodeType: 'operator', operator: '+', roundMode: 'none' });
            engine.changeQueue(6, 1);

            const result = engine.calculateRoll();
            // 1d20 ADV kept 15. 1d6 kept 4. Total = 19.
            expect(result.total).toBe(19);
            expect(result.breakdown[0].formula).toBe('1d20kh1');
            expect(result.breakdown[1].formula).toBe('1d6');
        });

        test('parenthetical advantage on all dice inside group', () => {
            let rollSequence = [
                // 1d20 rolls (with ADV, so 2 rolls)
                5, 15,
                // 1d6 rolls (with ADV, so 2 rolls)
                2, 6
            ];
            let callCount = 0;
            engine.setRng((sides) => {
                const val = rollSequence[callCount];
                callCount++;
                return val;
            });

            // (1d20 + 1d6) ADV
            engine.queue.push({ nodeType: 'operator', operator: '(', roundMode: 'none' });
            engine.changeQueue(20, 1);
            engine.queue.push({ nodeType: 'operator', operator: '+', roundMode: 'none' });
            engine.changeQueue(6, 1);
            engine.queue.push({ nodeType: 'operator', operator: ')', roundMode: 'none' });
            engine.applyModifier('ADV');

            const result = engine.calculateRoll();
            // 1d20 ADV kept 15. 1d6 ADV kept 6. Total = 21.
            expect(result.total).toBe(21);
            expect(result.breakdown[0].formula).toBe('1d20kh1');
            expect(result.breakdown[1].formula).toBe('1d6kh1');
        });
    });

    describe('Arsenal Management', () => {
        test('save and load queue', () => {
            engine.changeQueue(8, 2);
            engine.adjustFlatMod(4);
            const saved = engine.saveQueue('My Loadout');

            expect(saved).not.toBeNull();
            expect(saved.includeAdvDis).toBe(false);
            expect(engine.savedQueues.length).toBe(1);

            engine.clearQueue();
            expect(engine.rollingQueue.length).toBe(0);

            engine.loadQueue(saved.id);
            expect(engine.rollingQueue).toEqual([{ sides: 8, count: 2 }]);
            expect(engine.flatMod).toBe(4);
        });

        test('delete queue', () => {
            engine.changeQueue(4, 1);
            const saved = engine.saveQueue('Test');
            expect(engine.savedQueues.length).toBe(1);

            engine.deleteQueue(saved.id);
            expect(engine.savedQueues.length).toBe(0);
        });

        test('update saved queue', () => {
            engine.changeQueue(6, 1);
            const saved = engine.saveQueue('Test');

            engine.changeQueue(6, 1); // Now 2d6
            engine.updateSavedQueue(saved.id);

            expect(engine.savedQueues[0].queue).toEqual([{ sides: 6, count: 2 }]);
        });
    });

    describe('Auto-operator insertion logic', () => {
        test('adds "+" when adding a new dice group next to another dice group', () => {
            engine.changeQueue(6, 1);
            engine.changeQueue(8, 1);
            expect(engine.queue.map(c => c.nodeType)).toEqual(['node', 'operator', 'node']);
            expect(engine.queue[1].operator).toBe('+');
        });
    });

    describe('isQueueValid verification', () => {
        test('empty queue is invalid', () => {
            expect(engine.isQueueValid()).toBe(false);
        });

        test('operand only is valid', () => {
            engine.changeQueue(6, 1);
            expect(engine.isQueueValid()).toBe(true);
        });

        test('trailing operator is invalid', () => {
            engine.changeQueue(6, 1);
            engine.queue.push({ nodeType: 'operator', operator: '+', roundMode: 'none' });
            expect(engine.isQueueValid()).toBe(false);
        });

        test('unbalanced parentheses are invalid', () => {
            engine.queue.push({ nodeType: 'operator', operator: '(', roundMode: 'none' });
            engine.changeQueue(6, 1);
            expect(engine.isQueueValid()).toBe(false);
        });

        test('balanced parentheses with operands are valid', () => {
            engine.queue.push({ nodeType: 'operator', operator: '(', roundMode: 'none' });
            engine.changeQueue(6, 1);
            engine.queue.push({ nodeType: 'operator', operator: ')', roundMode: 'none' });
            expect(engine.isQueueValid()).toBe(true);
        });

        test('empty parenthesis group is invalid', () => {
            engine.queue.push({ nodeType: 'operator', operator: '(', roundMode: 'none' });
            engine.queue.push({ nodeType: 'operator', operator: ')', roundMode: 'none' });
            expect(engine.isQueueValid()).toBe(false);
        });

        test('operator after open parenthesis is invalid', () => {
            engine.queue.push({ nodeType: 'operator', operator: '(', roundMode: 'none' });
            engine.queue.push({ nodeType: 'operator', operator: '+', roundMode: 'none' });
            engine.changeQueue(6, 1);
            engine.queue.push({ nodeType: 'operator', operator: ')', roundMode: 'none' });
            expect(engine.isQueueValid()).toBe(false);
        });
    });

    describe('PEDMAS mathematical evaluation rules', () => {
        test('evaluates standard operator precedence correctly', () => {
            // 2 + 3 * 4 = 14
            engine.queue = [
                { nodeType: 'number', value: 2, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '+', roundMode: 'none' },
                { nodeType: 'number', value: 3, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '*', roundMode: 'none' },
                { nodeType: 'number', value: 4, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            expect(engine.calculateRoll().total).toBe(14);
        });

        test('respects parentheses grouping', () => {
            // (2 + 3) * 4 = 20
            engine.queue = [
                { nodeType: 'operator', operator: '(', roundMode: 'none' },
                { nodeType: 'number', value: 2, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '+', roundMode: 'none' },
                { nodeType: 'number', value: 3, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: ')', roundMode: 'none' },
                { nodeType: 'operator', operator: '*', roundMode: 'none' },
                { nodeType: 'number', value: 4, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            expect(engine.calculateRoll().total).toBe(20);
        });

        test('handles custom division rounding modes', () => {
            // 5 / 2 (round down) = 2
            engine.queue = [
                { nodeType: 'number', value: 5, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '/', roundMode: 'down' },
                { nodeType: 'number', value: 2, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            expect(engine.calculateRoll().total).toBe(2);

            // 5 / 2 (round up) = 3
            engine.queue = [
                { nodeType: 'number', value: 5, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '/', roundMode: 'up' },
                { nodeType: 'number', value: 2, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            expect(engine.calculateRoll().total).toBe(3);
        });

        test('handles negative/subtraction operators and negative values correctly', () => {
            // 10 - (-5) = 15
            engine.queue = [
                { nodeType: 'number', value: 10, operator: '+', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' },
                { nodeType: 'operator', operator: '-', roundMode: 'none' },
                { nodeType: 'number', value: 5, operator: '-', type: 'literal', multiplierType: 'none', multiplierValue: 1, divisorType: 'none', divisorValue: 1, roundMode: 'none' }
            ];
            expect(engine.calculateRoll().total).toBe(15);
        });
    });
});
