"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escpos_buffer_1 = require("escpos-buffer");
const sprintf_js_1 = require("sprintf-js");
class Processor {
    constructor(printer, template) {
        this.printer = printer;
        this.template = template;
    }
    styles(stmt, columns) {
        let style = 0;
        if (stmt['width'] == '2x') {
            columns = Math.trunc(columns / 2);
            style |= escpos_buffer_1.Style.DoubleWidth;
        }
        if (stmt['height'] == '2x') {
            style |= escpos_buffer_1.Style.DoubleHeight;
        }
        if ('style' in stmt) {
            const styles = this.resolve(stmt['style']).split('+');
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
        return { columns, style };
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
    line(statement, columns, style, width) {
        let left = statement['left'] || '';
        let right = statement['right'] || '';
        let text = '';
        columns -= left.length + right.length;
        width -= left.length + right.length;
        if ('items' in statement) {
            text = this.statement(statement['items'], columns, style, width);
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
            text = sprintf_js_1.sprintf(statement['format'], text);
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
        if (whitespace != ' ' || right) {
            const remaining = (width + columns - text.length % width) % width;
            text += whitespace.repeat(Math.max(0, text.length > 0 ? remaining : width));
        }
        return this.split(left, text, right, width);
    }
    statement(statement, columns, style, width) {
        if (typeof statement === 'string') {
            return this.resolve(statement);
        }
        if (Array.isArray(statement)) {
            return statement.reduce((text, stmt) => {
                const result = this.statement(stmt, columns, style, width);
                if (result === undefined) {
                    return text;
                }
                text = (text || '') + `${result}`;
                if (text.length > columns) {
                    columns = width - text.length % width;
                }
                else {
                    columns -= `${result}`.length;
                }
                return text;
            }, undefined);
        }
        if ('required' in statement && !this.isAvailable(statement['required'])) {
            return undefined;
        }
        let text = undefined;
        const count = 'list' in statement ? this.setCursor(statement['list'], 0) : 1;
        for (let i = 0; i < count; i++) {
            if ('row' in statement) {
                const { columns, style } = this.styles(statement, this.printer.columns);
                const line = this.line(statement, columns, style, columns);
                this.writeln(line === undefined ? line : line + '', style, columns);
            }
            else {
                const line = this.line(statement, columns, style, width);
                if (line !== undefined) {
                    text = (text || '') + line + '';
                }
            }
            if ('list' in statement) {
                this.setCursor(statement['list'], i + 1);
            }
        }
        return text;
    }
    print() {
        this.template.forEach((line) => {
            const stmt = typeof line === 'object' ? Object.assign(Object.assign({}, line), { row: true }) : { row: true, items: line };
            this.statement(stmt, this.printer.columns, 0, this.printer.columns);
        });
    }
}
exports.Processor = Processor;
//# sourceMappingURL=Processor.js.map