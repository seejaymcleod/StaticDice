// components/DiceWidget.js

class DiceWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['name', 'formula', 'color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const name = this.getAttribute('name') || 'Unnamed Widget';
        const formula = this.getAttribute('formula') || '';
        const color = this.getAttribute('color') || 'transparent';

        this.shadowRoot.innerHTML = `
            <style>
                .widget-card {
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(0, 212, 255, 0.25);
                    border-radius: 0.75rem;
                    padding: 0.5rem;
                    color: white;
                    font-family: sans-serif;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    position: relative;
                }
                .accent-bar {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background-color: ${color};
                    border-top-left-radius: 0.75rem;
                    border-bottom-left-radius: 0.75rem;
                }
                .title { font-weight: bold; text-transform: uppercase; }
                .formula { font-size: 0.75em; opacity: 0.8; font-family: monospace; }
            </style>
            <div class="widget-card" onclick="this.dispatchEvent(new CustomEvent('roll-requested', { bubbles: true, composed: true }))">
                <div class="accent-bar"></div>
                <div style="margin-left: 10px;">
                    <div class="title">${name}</div>
                    <div class="formula">${formula}</div>
                </div>
            </div>
        `;
    }
}

customElements.define('dice-widget', DiceWidget);
