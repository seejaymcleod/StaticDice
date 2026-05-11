const fs = require('fs');
const path = '/Users/seejaymac/Documents/GitHub/StaticDice/DiceRoller.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Add ID and update duration
content = content.replace(/<main\s+class="p-4 rounded-2xl flex flex-col items-center justify-start pt-8 min-h-\[160px\] relative overflow-hidden shrink-0 result-shimmer pointer-events-auto transition-all duration-400 ease-\[cubic-bezier\(0\.34,1\.56,0\.64,1\)\]"/, 
    '<main id="result-main" class="p-4 rounded-2xl flex flex-col items-center justify-start pt-8 min-h-[160px] relative overflow-hidden shrink-0 result-shimmer pointer-events-auto transition-all duration-600 ease-[cubic-bezier(0.34,1.56,0.64,1)]"');

// 2. Update showResult
content = content.replace(/function showResult\(res\) \{[\s\S]*?breakdown\.innerHTML = '';\s+\}\s+\}/, `function showResult(res) {
            const main = document.getElementById('result-main');
            const oldHeight = main.offsetHeight;
            main.style.height = oldHeight + 'px';

            const hero = document.getElementById('result-hero');
            const label = document.getElementById('result-label');
            const badges = document.getElementById('result-badges');
            const breakdown = document.getElementById('result-breakdown');

            // HERO zone
            hero.classList.remove('is-rolling');
            hero.className = hero.className.split(' ').filter(c => !c.startsWith('crit-')).join(' ');
            hero.innerText = res.total;
            if (res.heroClass) {
                hero.classList.add(res.heroClass);
                if (res.heroClass === 'crit-hit') vibrate([40, 80, 40]);
                else if (res.heroClass === 'crit-fail') vibrate(60);
                else vibrate(25);
            } else {
                vibrate(25);
            }

            // LABEL zone
            if (res.labels && res.labels.length > 0) {
                label.innerHTML = res.labels.map(l =>
                    \`<div class="label-\${l.color}">\${l.text}</div>\`
                ).join('');
                label.className = \`text-[11px] font-black uppercase tracking-widest mt-1 space-y-1 transition-all duration-300 flex flex-col items-center\`;
                label.classList.remove('hidden');
            } else {
                label.classList.add('hidden');
                label.innerHTML = '';
            }

            // BADGES zone
            if (res.badges && res.badges.length > 0) {
                badges.innerHTML = res.badges.map(b =>
                    \`<span class="result-badge badge-\${b.color}">\${b.icon} \${b.text}</span>\`
                ).join('');
                badges.classList.remove('hidden');
            } else {
                badges.classList.add('hidden');
                badges.innerHTML = '';
            }

            // BREAKDOWN zone
            if (res.breakdown && res.breakdown.length > 0) {
                breakdown.innerHTML = res.breakdown.map(row => {
                    if (!row.rolls) {
                        return \`<div class="breakdown-row">
                            <span class="breakdown-formula">\${row.formula}</span>
                            <span class="breakdown-rolls text-slate-500">→</span>
                            <span class="breakdown-subtotal">\${row.subtotal}</span>
                        </div>\`;
                    }
                    return \`<div class="breakdown-row">
                        <span class="breakdown-formula">\${row.formula}</span>
                        <span class="breakdown-rolls">[\${row.rolls}]</span>
                        <span class="breakdown-subtotal"><span class="text-slate-500 mr-1">→</span>\${row.subtotal}</span>
                    </div>\`;
                }).join('');
            } else {
                breakdown.innerHTML = '';
            }

            // Animate height change with overshoot bounce
            requestAnimationFrame(() => {
                main.style.transition = 'none';
                main.style.height = 'auto';
                const newHeight = main.offsetHeight;
                main.style.height = oldHeight + 'px';
                main.offsetHeight; // reflow
                main.style.transition = '';
                main.style.height = newHeight + 'px';
            });
        }`);

// 3. Update resetDisplayToIdle
content = content.replace(/function resetDisplayToIdle\(\) \{[\s\S]*?READY<\/span>';\s+\}/, `function resetDisplayToIdle() {
            const main = document.getElementById('result-main');
            const oldHeight = main.offsetHeight;
            main.style.height = oldHeight + 'px';

            const hero = document.getElementById('result-hero');
            hero.innerText = '0';
            hero.classList.remove('is-rolling');
            hero.className = hero.className.split(' ').filter(c => !c.startsWith('crit-')).join(' ');
            
            const label = document.getElementById('result-label');
            label.classList.add('hidden');
            label.innerHTML = '';
            
            document.getElementById('result-badges').classList.add('hidden');
            document.getElementById('result-badges').innerHTML = '';
            document.getElementById('result-breakdown').innerHTML = '<span class="text-[11px] text-slate-300 tracking-wide">READY</span>';

            // Animate height back to idle
            requestAnimationFrame(() => {
                main.style.transition = 'none';
                main.style.height = 'auto';
                const newHeight = main.offsetHeight;
                main.style.height = oldHeight + 'px';
                main.offsetHeight; // reflow
                main.style.transition = '';
                main.style.height = newHeight + 'px';
            });
        }`);

fs.writeFileSync(path, content);
console.log('Update complete');
