// EventBus.js
// A lightweight Publish/Subscribe event system for decoupling modules.

const EventBus = {
    events: {},
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    },
    
    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    },
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
};

window.EventBus = EventBus;
