
const check = (val, op, target) => {
    if (!op || target === null || isNaN(Number(target))) return false;
    const v = Number(val), t = Number(target);
    if (op === '>=') return v >= t; if (op === '<=') return v <= t;
    if (op === '>') return v > t;   if (op === '<') return v < t;
    if (op === '=' || op === '==') return v === t; return false;
};

const mergeSorted = (a, b) => {
    let i = 0, j = 0;
    const res = [];
    while (i < a.length && j < b.length) {
        if (a[i] < b[j]) {
            res.push(a[i]);
            i++;
        } else {
            res.push(b[j]);
            j++;
        }
    }
    while (i < a.length) { res.push(a[i]); i++; }
    while (j < b.length) { res.push(b[j]); j++; }
    return res;
};

function getSlotVecPMF(sides, modifierType, modifierLevel, rules) {
    const rollsToTake = 1 + (modifierType ? modifierLevel : 0);
    let p_first = {}, p_norm = {};
    for (let v = 1; v <= sides; v++) {
        p_norm[v] = 1 / sides;
        if (modifierType === 'ADV') {
            p_first[v] = (Math.pow(v, rollsToTake) - Math.pow(v - 1, rollsToTake)) / Math.pow(sides, rollsToTake);
        } else if (modifierType === 'DIS') {
            p_first[v] = (Math.pow(sides - v + 1, rollsToTake) - Math.pow(sides - v, rollsToTake)) / Math.pow(sides, rollsToTake);
        } else {
            p_first[v] = 1 / sides;
        }
    }
    const isRR  = (v) => rules.rerollOp  && rules.rerollVal  !== null && check(v, rules.rerollOp,  rules.rerollVal);
    const isExp = (v) => rules.explodeOp && rules.explodeVal !== null && check(v, rules.explodeOp, rules.explodeVal);

    // Apply rerolls
    let p_kept = {};
    const rrFaces = [];
    for (let v = 1; v <= sides; v++) if (isRR(v)) rrFaces.push(v);
    if (rrFaces.length > 0 && rrFaces.length < sides) {
        const pRf = rrFaces.reduce((s, f) => s + (p_first[f] || 0), 0);
        const pRn = rrFaces.reduce((s, f) => s + (p_norm[f]  || 0), 0);
        let g = 0; for (let i = 0; i <= 8; i++) g += Math.pow(pRn, i);
        for (let v = 1; v <= sides; v++) {
            p_kept[v] = isRR(v)
                ? pRf * Math.pow(pRn, 9) * p_norm[v]
                : p_first[v] + pRf * p_norm[v] * g;
        }
    } else { p_kept = { ...p_first }; }

    // BFS over explosion chains
    let slotPMF = {};
    let bfsQ = [];
    for (let v = 1; v <= sides; v++) {
        const p = p_kept[v] || 0;
        if (p <= 0) continue;
        const vec = [v];
        if (isExp(v)) {
            bfsQ.push({ vec, prob: p, depth: 1 });
        } else {
            const key = vec.join(',');
            slotPMF[key] = (slotPMF[key] || 0) + p;
        }
    }
    while (bfsQ.length > 0) {
        const curr = bfsQ.shift();
        for (let v = 1; v <= sides; v++) {
            const np = curr.prob * p_norm[v];
            if (np < 1e-14) continue;
            // merge sorted to keep slot vec sorted
            const nv = mergeSorted(curr.vec, [v]);
            if (isExp(v) && curr.depth < 10) {
                bfsQ.push({ vec: nv, prob: np, depth: curr.depth + 1 });
            } else {
                const key = nv.join(',');
                slotPMF[key] = (slotPMF[key] || 0) + np;
            }
        }
    }
    return slotPMF;
}

function convolveVecPMFs(pmf1, pmf2) {
    const res = {};
    for (let k1 in pmf1) {
        const v1 = k1 ? k1.split(',').map(Number) : [];
        const p1 = pmf1[k1];
        for (let k2 in pmf2) {
            const v2 = k2 ? k2.split(',').map(Number) : [];
            const merged = mergeSorted(v1, v2);
            const key = merged.join(',');
            const p = p1 * pmf2[k2];
            if (p > 1e-20) res[key] = (res[key] || 0) + p;
        }
    }
    return res;
}

function runSets(queue, mod, modifierType, modifierLevel, rules) {
    const isSum = rules.targetMode === 'sum', isCount = rules.targetMode === 'count';
    const MAX_SETS_STATES = 30000;
    let poolPMF = { '': 1 }, aborted = false;
    for (const group of queue) {
        const sp = getSlotVecPMF(group.sides, modifierType, modifierLevel, rules);
        const ss = Object.keys(sp).length;
        for (let i = 0; i < group.count; i++) {
            if (Object.keys(poolPMF).length * ss > MAX_SETS_STATES * 4) {
                aborted = true;
                break;
            }
            poolPMF = convolveVecPMFs(poolPMF, sp);
            if (Object.keys(poolPMF).length > MAX_SETS_STATES) {
                aborted = true;
                break;
            }
        }
        if (aborted) break;
    }
    if (aborted) return { aborted: true };

    const isSucc = (v) => rules.targetOp && rules.targetVal !== null && check(v, rules.targetOp, rules.targetVal);
    let finalDist = {};
    for (let key in poolPMF) {
        const prob = poolPMF[key];
        if (prob < 1e-20) continue;
        const arr = key ? key.split(',').map(Number) : [];
        let score = 0;
        let i = 0;
        while (i < arr.length) {
            let j = i;
            while (j < arr.length && arr[j] === arr[i]) j++;
            const cnt = j - i;
            const faceNum = arr[i];
            if (check(cnt, rules.setsOp, rules.setsVal)) {
                if (isCount) {
                    if (!rules.targetOp || isSucc(faceNum)) score += cnt;
                } else {
                    score += faceNum * cnt;
                }
            }
            i = j;
        }
        finalDist[score] = (finalDist[score] || 0) + prob;
    }
    if (Object.keys(finalDist).length === 0) finalDist = { 0: 1 };
    return { aborted: false, dist: finalDist };
}

const DiceEngine = require('../DiceEngine.js');
async function simulate(queueItems, rules, modifier, modLevel, N=100000) {
    const engine = new DiceEngine();
    queueItems.forEach(({sides,count})=>engine.changeQueue(sides,count));
    engine.updateRules(rules);
    if(modifier) engine.applyModifier(modifier);
    let sum=0;for(let i=0;i<N;i++){const r=engine.calculateRoll();sum+=Number(r.total);}
    return sum/N;
}

(async () => {
    console.log('=== LOTS: 7d6+3d8+1d100 RR=1 EX=2 SET=1 ===');
    const lotsQ=[{count:7,sides:6},{count:3,sides:8},{count:1,sides:100}];
    const lotsR={targetMode:'count',rerollOp:'=',rerollVal:1,explodeOp:'=',explodeVal:2,setsOp:'=',setsVal:1};
    const t0=Date.now();
    const lr=runSets(lotsQ,0,null,0,lotsR);
    console.log(`Math done in ${Date.now()-t0}ms, aborted=${lr.aborted}`);
    if(!lr.aborted) {
        console.log('Math mean:', Object.entries(lr.dist).reduce((s,[v,p])=>s+Number(v)*p,0).toFixed(4));
    }
    const ls=await simulate(lotsQ,lotsR,null,0);
    console.log('Sim mean:', ls.toFixed(4));
})();
