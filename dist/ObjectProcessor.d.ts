import { Processor } from './Processor';
import { Printer } from 'escpos-buffer';
export declare class ObjectProcessor extends Processor {
    source: object;
    private positions;
    private lists;
    constructor(source: object, printer: Printer, template: any[]);
    protected query(obj: object, path: string): any;
    protected setCursor(list: string, position: number): number;
    protected isAvailable(resource: string): boolean;
    protected resolve(resource: string): any;
}
