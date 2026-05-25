const fs = require('fs');
const { JSDOM } = require('jsdom');

const engineCode = fs.readFileSync('DiceEngine.js', 'utf8');
let html = fs.readFileSync('DiceRoller.html', 'utf8');

// Inline the script directly
html = html.replace('<script src="DiceEngine.js"></script>', `<script>${engineCode}</script>`);

const dom = new JSDOM(html, {
    url: "http://localhost/", // Allow localStorage
    runScripts: "dangerously"
});

const { window } = dom;
const { document } = window;

window.addEventListener('load', () => {
    try {
        console.log('Directly invoking openNodeEditor("eval")...');
        window.openNodeEditor('eval');
        const editor = document.getElementById('inline-node-editor');
        console.log('Editor classList after direct call:', editor.classList.toString());
    } catch (err) {
        console.error('Error during direct execution:', err.message, err.stack);
    }
});
