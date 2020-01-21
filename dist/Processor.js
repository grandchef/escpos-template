"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escpos_buffer_1 = require("escpos-buffer");
const sprintf_js_1 = require("sprintf-js");
class Processor {
    constructor(printer, template) {
        this.printer = printer;
        this.template = template;
    }
    writeln(text, style, columns) {
        if (text === undefined) {
            return;
        }
        const len = text.length;
        let index = 0;
        while (index < len) {
            const copy_len = Math.min(columns, len - index);
            const copy = text.substr(index, copy_len);
            this.printer.writeln(copy, style);
            index += copy_len;
        }
        if (len == 0) {
            this.printer.feed();
        }
    }
    split(left, text, right, width) {
        const count = Math.trunc(text.length / width) + ((text.length % width) > 0 ? 1 : 0);
        let lines = '';
        for (let i = 0; i < count; i++) {
            const line = text.substr(i * width, Math.min(width, text.length - i * width));
            lines += left + line + right;
        }
        return lines;
    }
    line(statement, columns, style, width, level) {
        let left = statement['left'] || '';
        let right = statement['right'] || '';
        let text = '';
        columns -= left.length + right.length;
        width -= left.length + right.length;
        if ('items' in statement) {
            text = this.statement(statement['items'], columns, style, width, level);
            if (text === undefined) {
                return undefined;
            }
        }
        if (statement['type'] == 'qrcode' || statement['type'] == 'image') {
            let reset = false;
            if ('align' in statement) {
                reset = true;
                if (statement['align'] == 'center') {
                    this.printer.alignment = escpos_buffer_1.Align.Center;
                }
                else if (statement['align'] == 'right') {
                    this.printer.alignment = escpos_buffer_1.Align.Right;
                }
                else {
                    reset = false;
                }
            }
            if (statement['type'] == 'qrcode') {
                this.printer.qrcode(this.resolve(statement['data']));
            }
            else {
                this.printer.draw(this.resolve(statement['data']));
            }
            if (reset) {
                this.printer.alignment = escpos_buffer_1.Align.Left;
            }
            return undefined;
        }
        if ('format' in statement) {
            let format = this.resolve('format');
            if (typeof format !== 'function') {
                format = sprintf_js_1.sprintf;
            }
            text = format(statement['format'], text);
        }
        text = text + '';
        let whitespace = ' ';
        if ('whitespace' in statement) {
            whitespace = statement['whitespace'];
        }
        if ('align' in statement) {
            let spacing = 0;
            const remaining = (width + columns - text.length % width) % width;
            if (statement['align'] == 'center') {
                spacing = Math.trunc(remaining / 2);
            }
            else if (statement['align'] == 'right') {
                spacing = remaining;
            }
            text = whitespace.repeat(Math.max(0, spacing)) + text;
        }
        if (whitespace != ' ') {
            const remaining = (width + columns - text.length % width) % width;
            text += whitespace.repeat(Math.max(0, text.length > 0 ? remaining : width));
        }
        return this.split(left, text, right, width);
    }
    statement(statement, columns, style, width, level) {
        if (typeof statement === 'string') {
            return this.resolve(statement);
        }
        if (Array.isArray(statement)) {
            let text = '';
            statement.forEach((stmt) => {
                const result = this.statement(stmt, columns, style, width, level);
                if (result === undefined) {
                    return;
                }
                text += `${result}`;
                if (text.length > columns) {
                    columns = width - text.length % width;
                }
                else {
                    columns -= `${result}`.length;
                }
            });
            return text;
        }
        if ('required' in statement && !this.isAvailable(statement['required'])) {
            return undefined;
        }
        if (!('list' in statement)) {
            return this.line(statement, columns, style, width, level);
        }
        let text = undefined;
        const count = this.setCursor(statement['list'], 0);
        for (let i = 0; i < count; i++) {
            const line = this.line(statement, columns, style, width, level + 1);
            if (level > 0) {
                text = (text || '') + (line || '') + '';
            }
            else {
                this.writeln(line === undefined ? line : line + '', style, width);
            }
            this.setCursor(statement['list'], i + 1);
        }
        return text;
    }
    print() {
        this.template.forEach((stmt) => {
            let style = 0;
            let columns = this.printer.columns;
            if (typeof stmt === 'object') {
                if (stmt['width'] == '2x') {
                    columns = Math.trunc(columns / 2);
                    style |= escpos_buffer_1.Style.DoubleWidth;
                }
                if (stmt['height'] == '2x') {
                    style |= escpos_buffer_1.Style.DoubleHeight;
                }
                if ('style' in stmt) {
                    const styles = stmt['style'].split('+');
                    styles.forEach((name) => {
                        if (name == 'bold') {
                            style |= escpos_buffer_1.Style.Bold;
                        }
                        else if (name == 'italic') {
                            style |= escpos_buffer_1.Style.Italic;
                        }
                        else if (name == 'underline') {
                            style |= escpos_buffer_1.Style.Underline;
                        }
                        else if (name == 'condensed') {
                            style |= escpos_buffer_1.Style.Condensed;
                            columns = Math.trunc(columns * 4 / 3);
                        }
                    });
                }
            }
            const text = this.statement(stmt, columns, style, columns, 0);
            this.writeln(text === undefined ? text : text + '', style, columns);
        });
    }
}
exports.Processor = Processor;
//# sourceMappingURL=Processor.js.map