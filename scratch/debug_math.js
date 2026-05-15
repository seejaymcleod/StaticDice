
const engine = {
    checkCondition: (val, op, target) => {
        switch (op) {
            case '>': return val > target;
            case '>=':
            case '≥': return val >= target;
            case '<': return val < target;
            case '<=':
            case '≤': return val <= target;
            case '==':
            case '=': return val == target;
            default: return true;
        }
    }
};

function getTheoreticalDistribution(queue, mod, modifierType, modifierLevel, rules = {}) {
    const isCount = rules.targetMode === 'count';
    const isSum = rules.targetMode === 'sum';
    const hasSets = rules.setsOp && rules.setsVal !== null;
    const explodeOp = rules.explodeOp;
    const explodeVal = rules.explodeVal;
    const hasExplodes = explodeOp && explodeVal !== null;

    const convolve = (d1, d2) => {
        let res = {};
        for (let v1 in d1) {
            let p1 = d1[v1];
            for (let v2 in d2) {
                const s = parseInt(v1) + parseInt(v2);
                res[s] = (res[s] || 0) + p1 * d2[v2];
            }
        }
        return res;
    };

    const facts = [1];
    for (let i = 1; i <= 200; i++) facts[i] = facts[i - 1] * i;
    const nCr = (n, r) => (n < r || r < 0) ? 0 : facts[n] / (facts[r] * facts[n - r]);

    const getGroupDistribution = (group) => {
        const sides = group.sides;
        const N = group.count;

        let p_adv = {};
        let p_norm = {};
        const rollsToTake = 1 + (modifierType ? modifierLevel : 0);
        for (let v = 1; v <= sides; v++) {
            p_norm[v] = 1 / sides;
            p_adv[v] = 1 / sides;
        }

        const isExp = (v) => hasExplodes && engine.checkCondition(v, explodeOp, explodeVal);
        const E_adv = Object.keys(p_adv).reduce((s, v) => s + (isExp(v) ? p_adv[v] : 0), 0);
        const E_norm = Object.keys(p_norm).reduce((s, v) => s + (isExp(v) ? p_norm[v] : 0), 0);
        const P_stop_norm = 1 - E_norm;

        let successVals = [];
        for (let v = 1; v <= sides; v++) {
            if (engine.checkCondition(v, rules.targetOp, rules.targetVal)) successVals.push(v);
        }

        let group_pmf = { 0: 1 };
        
        let stop_scores = { 0: { 0: 1 } };
        let p_rem_s = 1.0;
        let all_stop_vals = [...new Set([...Object.keys(p_adv), ...Object.keys(p_norm)])].map(Number).filter(v => !isExp(v)).sort((a,b)=>a-b);
        for (let v of all_stop_vals) {
            let p_v_stop = (p_adv[v] || 0) + E_adv * ((p_norm[v] || 0) / P_stop_norm);
            let p_ratio = Math.min(1.0, p_v_stop / p_rem_s);
            let isSucc = successVals.includes(v);
            
            let next = {};
            for (let used = 0; used <= N; used++) {
                if (!stop_scores[used]) continue;
                let rem = N - used;
                for (let k = 0; k <= rem; k++) {
                    let p_k = nCr(rem, k) * Math.pow(p_ratio, k) * Math.pow(1 - p_ratio, rem - k);
                    if (p_k < 1e-15) continue;
                    let score = (isSucc && engine.checkCondition(k, rules.setsOp, rules.setsVal)) ? (isCount ? k : k * v) : 0;
                    if (!hasSets) score = isSucc ? (isCount ? k : k * v) : 0;
                    
                    for (let s in stop_scores[used]) {
                        let n_s = parseInt(s) + score;
                        let n_u = used + k;
                        if (!next[n_u]) next[n_u] = {};
                        next[n_u][n_s] = (next[n_u][n_s] || 0) + stop_scores[used][s] * p_k;
                    }
                }
            }
            stop_scores = next;
            p_rem_s -= p_v_stop;
        }
        group_pmf = stop_scores[N] || { 0: 1 };

        for (let v of successVals) {
            if (!isExp(v)) continue;
            let p_v_adv = p_adv[v] || 0;
            let p_v_norm = p_norm[v] || 0;
            let p_geom = P_stop_norm / (P_stop_norm + p_v_norm);
            
            let die_v_pmf = {};
            for (let k = 0; k <= 12; k++) {
                let p_k = Math.pow(1-p_geom, k) * p_geom;
                die_v_pmf[1 + k] = (die_v_pmf[1 + k] || 0) + p_v_adv * p_k;
            }
            let E_other = E_adv - p_v_adv;
            for (let k = 0; k <= 12; k++) {
                let p_k = Math.pow(1-p_geom, k) * p_geom;
                die_v_pmf[k] = (die_v_pmf[k] || 0) + E_other * p_k;
            }
            die_v_pmf[0] = (die_v_pmf[0] || 0) + (1 - E_adv);
            
            let total_v_pmf = { 0: 1 };
            for (let i = 0; i < N; i++) {
                let next = {};
                for (let s1 in total_v_pmf) for (let s2 in die_v_pmf) {
                    let s = parseInt(s1) + parseInt(s2);
                    if (s <= 30) next[s] = (next[s] || 0) + total_v_pmf[s1] * die_v_pmf[s2];
                }
                total_v_pmf = next;
            }
            
            let score_pmf = {};
            for (let k in total_v_pmf) {
                let count = parseInt(k);
                let score = (engine.checkCondition(count, rules.setsOp, rules.setsVal)) ? (isCount ? count : count * v) : 0;
                if (!hasSets) score = isCount ? count : count * v;
                score_pmf[score] = (score_pmf[score] || 0) + total_v_pmf[k];
            }
            group_pmf = convolve(group_pmf, score_pmf);
        }
        return group_pmf;
    };

    let finalDist = { 0: 1 };
    queue.forEach(group => {
        finalDist = convolve(finalDist, getGroupDistribution(group));
    });

    return finalDist;
}

const queue = [
    { count: 7, sides: 6 },
    { count: 3, sides: 8 },
    { count: 1, sides: 100 }
];
const rules = {
    targetMode: 'count',
    targetOp: '>=',
    targetVal: 2,
    explodeOp: '=',
    explodeVal: 2,
    setsOp: '=',
    setsVal: 1
};

const result = getTheoreticalDistribution(queue, 0, null, 0, rules);
console.log(JSON.stringify(result, null, 2));
