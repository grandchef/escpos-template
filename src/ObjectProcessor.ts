import { Processor } from './Processor'
import { Printer } from 'escpos-buffer'

export class ObjectProcessor extends Processor {
  source: object
  private positions: Map<string, number>
  private lists: Map<string, any[]>

  constructor (source: object, printer: Printer, template: any[]) {
    super(printer, template)
    this.source = source
    this.positions = new Map<string, number>()
    this.lists = new Map<string, any[]>()
  }

  protected query(obj: object, path: string): any {
    let normalized = path.replace(/\[(\w*)\]/g, '.$1') // convert indexes to properties
    normalized = normalized.replace(/^\./, '')         // strip a leading dot
    const keys = normalized.split('.')
    let subpath = ''
    let current: any = obj
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i]
      if (Array.isArray(current)) {
        const array = current
        const position = (key == '' || isNaN(Number(key))) ? this.positions.get(subpath) || 0 : Number(key)
        subpath += '.' + key
        current = current[position]
        switch (key) {
          case 'index':
            return '' + position
          case 'number':
            return '' + (position + 1)
          case 'count':
            return '' + array.length
          case 'first':
            return position == 0
          case 'last':
            return position == array.length - 1
          case '!first':
            return position > 0
          case '!last':
            return position < array.length - 1
        }
      } else if (key in current) {
        subpath += (subpath ? '.' : '') + key
        current = current[key]
      } else {
        return undefined
      }
    }
    return current
  }

  protected setCursor(list: string, position: number): number {
    let normalized = list.replace(/\[(\w*)\]/g, '.$1') // convert indexes to properties
    normalized = normalized.replace(/^\./, '')         // strip a leading dot
    this.positions.set(normalized, position)
    let result = this.lists.get(normalized)
    if (result === undefined) {
      result = this.query(this.source, normalized) || []
      this.lists.set(normalized, result)
    }
    for (const key of this.lists.keys()) {
      if (key.startsWith(normalized) && key != normalized) {
        this.lists.delete(key)
      }
    }
    return result.length
  }

  protected isAvailable(resource: string): boolean {
    const result = this.query(this.source, resource)
    return result && result !== undefined && (!Array.isArray(result) || result.length > 0)
  }

  protected resolve(resource: string): any {
    const result = this.query(this.source, resource)
    return result === undefined ? resource : result
  }
}
