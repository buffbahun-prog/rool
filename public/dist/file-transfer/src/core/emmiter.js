export class TypedEmitter {
    constructor() {
        this.listeners = {};
    }
    on(event, fn) {
        var _a;
        ((_a = this.listeners)[event] || (_a[event] = [])).push(fn);
    }
    off(event, fn) {
        this.listeners[event] = this.listeners[event]?.filter(f => f !== fn);
    }
    emit(event, payload) {
        this.listeners[event]?.forEach(fn => fn(payload));
    }
}
