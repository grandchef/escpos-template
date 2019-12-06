"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Processor_1 = require("./Processor");
class ObjectProcessor extends Processor_1.Processor {
    constructor(source, printer, template) {
        super(printer, template);
        this.source = source;
        this.positions = new Map();
        this.lists = new Map();
    }
    query(obj, path) {
        let normalized = path.replace(/\[(\w*)\]/g, '.$1');
        normalized = normalized.replace(/^\./, '');
        const keys = normalized.split('.');
        let subpath = '';
        let current = obj;
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            if (Array.isArray(current)) {
                const array = current;
                const position = (key == '' || isNaN(Number(key))) ? this.positions.get(subpath) || 0 : Number(key);
                subpath += '.' + key;
                current = current[position];
                switch (key) {
                    case 'index':
                        return '' + position;
                    case 'number':
                        return '' + (position + 1);
                    case 'count':
                        return '' + array.length;
                    case 'first':
                        return position == 0;
                    case 'last':
                        return position == array.length - 1;
                    case '!first':
                        return position > 0;
                    case '!last':
                        return position < array.length - 1;
                }
            }
            else if (key in current) {
                subpath += (subpath ? '.' : '') + key;
                current = current[key];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    setCursor(list, position) {
        let normalized = list.replace(/\[(\w*)\]/g, '.$1');
        normalized = normalized.replace(/^\./, '');
        this.positions.set(normalized, position);
        let result = this.lists.get(normalized);
        if (result === undefined) {
            result = this.query(this.source, normalized) || [];
            this.lists.set(normalized, result);
        }
        for (const key of this.lists.keys()) {
            if (key.startsWith(normalized) && key != normalized) {
                this.lists.delete(key);
            }
        }
        return result.length;
    }
    isAvailable(resource) {
        const result = this.query(this.source, resource);
        return result && result !== undefined && (!Array.isArray(result) || result.length > 0);
    }
    resolve(resource) {
        const result = this.query(this.source, resource);
        return result === undefined ? resource : result;
    }
}
exports.ObjectProcessor = ObjectProcessor;
//# sourceMappingURL=ObjectProcessor.js.map