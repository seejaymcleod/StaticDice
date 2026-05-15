const fs = require('fs');

const rules = {
    targetMode: 'sum', targetOp: '', targetVal: null,
    rerollOp: '>=', rerollVal: 5,
    explodeOp: '>=', explodeVal: 5,
    setsOp: '>=', setsVal: 2
};

const queue = [{count: 11, sides: 6, id: 1}];
const modifierType = 'ADV';
const modifierLevel = 1;
const mod = 4;

function check(val, op, target) {
    if (!op || target === null || isNaN(target)) return true; 
    if (op === '>=') return val >= target;
    if (op === '<=') return val <= target;
    if (op === '>') return val > target;
    if (op === '<') return val < target;
    if (op === '=') return val === target;
    return true;
}

const isRR = (v) => rules.rerollOp && rules.rerollVal !== null && check(v, rules.rerollOp, rules.rerollVal);

const sides = 6;
let p_adv = {};
let p_norm = {};
const rollsToTake = 2; // ADV

for (let v = 1; v <= sides; v++) {
    p_norm[v] = 1 / sides;
    p_adv[v] = (Math.pow(v, rollsToTake) - Math.pow(v - 1, rollsToTake)) / Math.pow(sides, rollsToTake);
}

let rrFaces = [];
for (let v = 1; v <= sides; v++) if (isRR(v)) rrFaces.push(v);

if (rrFaces.length > 0 && rrFaces.length < sides) {
    let mass_adv = rrFaces.reduce((s, f) => s + (p_adv[f] || 0), 0);
    let mass_norm = rrFaces.reduce((s, f) => s + (p_norm[f] || 0), 0);
    
    for (let v = 1; v <= sides; v++) {
        if (isRR(v)) {
            p_adv[v] = 0;
            p_norm[v] = 0;
        } else {
            p_adv[v] = p_adv[v] + mass_adv * (p_norm[v] / (1 - mass_norm));
            p_norm[v] = p_norm[v] + mass_norm * (p_norm[v] / (1 - mass_norm));
        }
    }
}

console.log("Fixed p_adv:", p_adv);
console.log("Fixed p_norm:", p_norm);
