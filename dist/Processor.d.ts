import { Printer } from 'escpos-buffer';
export declare abstract class Processor {
    private printer;
    protected template: any[];
    constructor(printer: Printer, template: any[]);
    protected abstract setCursor(list: string, position: number): number;
    protected abstract isAvailable(resource: string): boolean;
    protected abstract resolve(resource: string): any;
    private styles;
    private writeln;
    private split;
    private line;
    private statement;
    print(): void;
}
