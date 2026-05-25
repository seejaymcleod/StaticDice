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

    test('backspaceQueue removes modifiers before dice', () => {
        engine.changeQueue(20, 1);
        engine.applyModifier('ADV');
        engine.adjustFlatMod(5);

        expect(engine.activeModifier).toBe('ADV');
        expect(engine.flatMod).toBe(5);

        engine.backspaceQueue(); // removes modifier
        expect(engine.activeModifier).toBeNull();
        expect(engine.flatMod).toBe(5);

        engine.backspaceQueue(); // removes flat mod
        expect(engine.flatMod).toBe(0);

        engine.backspaceQueue(); // removes last die group
        expect(engine.rollingQueue.length).toBe(0);
    });

    test('clearQueue resets all state', () => {
        engine.changeQueue(20, 1);
        engine.applyModifier('DIS');
        engine.adjustFlatMod(2);
        engine.updateRules({ rerollOp: "<=", rerollVal: 2 });

        engine.clearQueue();

        expect(engine.rollingQueue.length).toBe(0);
        expect(engine.activeModifier).toBeNull();
        expect(engine.flatMod).toBe(0);
        expect(engine.rollRules.rerollOp).toBe("");
    });

    test('adjustFlatMod updates the flat modifier correctly', () => {
        engine.adjustFlatMod(2);
        expect(engine.flatMod).toBe(2);
        engine.adjustFlatMod(-1);
        expect(engine.flatMod).toBe(1);
    });

    test('applyModifier toggles correctly', () => {
        engine.changeQueue(20, 1);
        
        engine.applyModifier('ADV');
        expect(engine.activeModifier).toBe('ADV');
        expect(engine.modifierLevel).toBe(1);

        engine.applyModifier('ADV'); // Stack it
        expect(engine.activeModifier).toBe('ADV');
        expect(engine.modifierLevel).toBe(2);

        engine.applyModifier('DIS'); // Clicking opposite modifier clears it
        expect(engine.activeModifier).toBeNull();
        expect(engine.modifierLevel).toBe(0);

        engine.applyModifier('DIS'); // Clicking again applies it
        expect(engine.activeModifier).toBe('DIS');
        expect(engine.modifierLevel).toBe(1);
        
        engine.applyModifier('ADV'); // Clicking opposite clears
        expect(engine.activeModifier).toBeNull();
        expect(engine.modifierLevel).toBe(0);
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
                formula: 'Flat Mod',
                rolls: '',
                subtotal: 'STR (+2)'
            });
        });

        test('complex modifier chips calculation', () => {
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
            
            // Add a +2 successes chip
            engine.flatMod = 2;

            const result = engine.calculateRoll();
            // Only 8 is >= 5, so 1 success. Plus 2 from modifier = 3.
            expect(result.total).toBe(3);
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
            expect(engine.queue.map(c => c.chipType)).toEqual(['dice', 'operator', 'dice']);
            expect(engine.queue[1].operator).toBe('+');
        });
    });
});
