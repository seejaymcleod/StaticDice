const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const workspaceDir = path.resolve(__dirname, '..');

const engineCode = fs.readFileSync(path.resolve(workspaceDir, 'DiceEngine.js'), 'utf8');
const archCode = fs.readFileSync(path.resolve(workspaceDir, 'DataArchitecture.js'), 'utf8');
const templatesCode = fs.readFileSync(path.resolve(workspaceDir, 'Assets/TemplatesData.js'), 'utf8');
const parserRegistryCode = fs.readFileSync(path.resolve(workspaceDir, 'Parsers/ParserRegistry.js'), 'utf8');
const shadowdarkParserCode = fs.readFileSync(path.resolve(workspaceDir, 'Parsers/ShadowdarkParser.js'), 'utf8');
let html = fs.readFileSync(path.resolve(workspaceDir, 'DiceRoller.html'), 'utf8');

html = html.replace('<script src="Assets/TemplatesData.js"></script>', `<script>${templatesCode}</script>`);
html = html.replace('<script src="DataArchitecture.js"></script>', `<script>${archCode}</script>`);
html = html.replace('<script src="DiceEngine.js"></script>', `<script>${engineCode}</script>`);
html = html.replace('<script src="Parsers/ParserRegistry.js"></script>', `<script>${parserRegistryCode}</script>`);
html = html.replace('<script src="Parsers/ShadowdarkParser.js"></script>', `<script>${shadowdarkParserCode}</script>`);

const virtualConsole = new VirtualConsole();
virtualConsole.on("log", console.log);
virtualConsole.on("info", console.info);
virtualConsole.on("warn", console.warn);
virtualConsole.on("error", console.error);
virtualConsole.on("jsdomError", (err) => {
    console.error("JSDOM Error details:", err.message, err.stack);
});

const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable",
    virtualConsole
});
