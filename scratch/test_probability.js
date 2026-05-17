
const DiceEngine = require('../DiceEngine.js');

// Replicate the math logic for testing
function checkCondition(val, op, target) {
    if (!op || target === null || isNaN(target)) return false;
    if (op === '>=') return val >= target;
    if (op === '<=') return val <= target;
    if (op === '>') return val > target;
    if (op === '<') return val < target;
    if (op === '=') return val === target;
    return false;
}

function getDiePMF(sides, modType, modLvl, rules) {
    let pmf = {};
    const rollsToTake = 1 + (modType ? modLvl : 0);
    for (let v = 1; v <= sides; v++) {
        if (modType === 'ADV') {
            pmf[v] = (Math.pow(v, rollsToTake) - Math.pow(v - 1, rollsToTake)) / Math.pow(sides, rollsToTake);
        } else if (modType === 'DIS') {
            pmf[v] = (Math.pow(sides - v + 1, rollsToTake) - Math.pow(sides - v, rollsToTake)) / Math.pow(sides, rollsToTake);
        } else {
            pmf[v] = 1 / sides;
        }
    }

    const rerollOp = rules.rerollOp;
    const rerollVal = rules.rerollVal;
    if (rerollOp && rerollVal !== null) {
        let rerollFaces = [];
        for (let v = 1; v <= sides; v++) {
            if (checkCondition(v, rerollOp, rerollVal)) rerollFaces.push(v);
        }
        if (rerollFaces.length > 0 && rerollFaces.length < sides) {
            let rerollMass = rerollFaces.reduce((sum, f) => sum + pmf[f], 0);
            let keepMass = 1 - rerollMass;
            rerollFaces.forEach(f => pmf[f] = 0);
            for (let v in pmf) if (pmf[v] > 0) pmf[v] /= keepMass;
        }
    }

    const explodeOp = rules.explodeOp;
    const explodeVal = rules.explodeVal;
    if (explodeOp && explodeVal !== null) {
        let explodeFaces = [];
        for (let v = 1; v <= sides; v++) {
            if (checkCondition(v, explodeOp, explodeVal)) explodeFaces.push(v);
        }
        if (explodeFaces.length > 0 && explodeFaces.length < sides) {
            let newPmf = {};
            let explodeMass = explodeFaces.reduce((sum, f) => sum + pmf[f], 0);
            let nonExplodePmf = { ...pmf };
            explodeFaces.forEach(f => nonExplodePmf[f] = 0);
            for (let k = 0; k <= 10; k++) {
                let p_k = Math.pow(explodeMass, k);
                if (p_k < 1e-7) break;
                for (let v in nonExplodePmf) {
                    if (nonExplodePmf[v] === 0) continue;
                    let finalVal = parseInt(v) + (k * sides);
                    newPmf[finalVal] = (newPmf[finalVal] || 0) + (nonExplodePmf[v] * p_k);
                }
            }
            pmf = newPmf;
        }
    }
    return pmf;
}

function convolve(d1, d2) {
    let res = {};
    for (let v1 in d1) {
        for (let v2 in d2) {
            const s = parseInt(v1) + parseInt(v2);
            res[s] = (res[s] || 0) + d1[v1] * d2[v2];
        }
    }
    return res;
}

function getTheoreticalDistribution(queue, mod, modifierType, modifierLevel, rules = {}) {
    if (rules.targetMode === 'count') {
        let finalDist = { 0: 1 };
        queue.forEach(group => {
            const pmf = getDiePMF(group.sides, modifierType, modifierLevel, rules);
            let pSuccess = 0;
            for (let v in pmf) if (checkCondition(parseInt(v), rules.targetOp, rules.targetVal)) pSuccess += pmf[v];
            for (let i = 0; i < group.count; i++) {
                let nextDist = {};
                for (let successes in finalDist) {
                    let s = parseInt(successes);
                    nextDist[s] = (nextDist[s] || 0) + finalDist[s] * (1 - pSuccess);
                    nextDist[s + 1] = (nextDist[s + 1] || 0) + finalDist[s] * pSuccess;
                }
                finalDist = nextDist;
            }
        });
        return finalDist;
    }
    let finalDist = { 0: 1 };
    queue.forEach(group => {
        const pmf = getDiePMF(group.sides, modifierType, modifierLevel, rules);
        for (let i = 0; i < group.count; i++) finalDist = convolve(finalDist, pmf);
    });
    let shiftedDist = {};
    for (let v in finalDist) shiftedDist[parseInt(v) + mod] = finalDist[v];
    return shiftedDist;
}

// TEST SUITE
function assertApprox(val, expected, msg) {
    if (Math.abs(val - expected) > 0.001) {
        console.error(`FAIL: ${msg} | Expected ${expected}, got ${val}`);
        process.exit(1);
    } else {
        console.log(`PASS: ${msg}`);
    }
}

console.log("Running Probability Unit Tests...");

// Case 1: 1d6
let d6 = getTheoreticalDistribution([{ sides: 6, count: 1 }], 0, null, 0, { targetMode: 'sum' });
assertApprox(d6[1], 1 / 6, "1d6 - Probability of 1");
assertApprox(d6[6], 1 / 6, "1d6 - Probability of 6");

// Case 2: 2d6
let d2d6 = getTheoreticalDistribution([{ sides: 6, count: 2 }], 0, null, 0, { targetMode: 'sum' });
assertApprox(d2d6[7], 6 / 36, "2d6 - Probability of 7");
assertApprox(d2d6[2], 1 / 36, "2d6 - Probability of 2");

// Case 3: 1d20 ADV
let d20adv = getTheoreticalDistribution([{ sides: 20, count: 1 }], 0, 'ADV', 1, { targetMode: 'sum' });
assertApprox(d20adv[1], 1 / 400, "1d20 ADV - Probability of 1");
assertApprox(d20adv[20], 39 / 400, "1d20 ADV - Probability of 20");

// Case 4: 1d6 Reroll 1s
let d6rr1 = getTheoreticalDistribution([{ sides: 6, count: 1 }], 0, null, 0, { rerollOp: '=', rerollVal: 1, targetMode: 'sum' });
assertApprox(d6rr1[1] || 0, 0, "1d6 RR=1 - Probability of 1 should be 0");
assertApprox(d6rr1[2], 0.2, "1d6 RR=1 - Probability of 2 should be 20%");

// Case 5: 1d6 Explode 6s
let d6ex6 = getTheoreticalDistribution([{ sides: 6, count: 1 }], 0, null, 0, { explodeOp: '=', explodeVal: 6, targetMode: 'sum' });
assertApprox(d6ex6[6] || 0, 0, "1d6 EX=6 - Probability of exactly 6 should be 0");
assertApprox(d6ex6[7], 1 / 36, "1d6 EX=6 - Probability of 7 (6+1)");

// Case 6: 2d6 Count >= 4
let d2d6count = getTheoreticalDistribution([{ sides: 6, count: 2 }], 0, null, 0, { targetMode: 'count', targetOp: '>=', targetVal: 4 });
assertApprox(d2d6count[0], 0.25, "2d6 Count >= 4 - Probability of 0 successes (0.5 * 0.5)");
assertApprox(d2d6count[1], 0.5, "2d6 Count >= 4 - Probability of 1 success (2 * 0.5 * 0.5)");
assertApprox(d2d6count[2], 0.25, "2d6 Count >= 4 - Probability of 2 successes (0.5 * 0.5)");

console.log("\nALL PROBABILITY TESTS PASSED!");
