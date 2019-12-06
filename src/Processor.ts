import { Printer, Align, Style } from 'escpos-buffer'

export abstract class Processor {
  private printer: Printer
  protected template: any[]

  constructor (printer: Printer, template: any[]) {
    this.printer = printer
    this.template = template
  }

  /**
   * Set current list item processing
   *
   * @param list list to chose
   * @param position position to select
   *
   * @return count of rows from list
   */
  protected abstract setCursor (list: string, position: number): number

  /**
   * Check if resource exists and is available
   *
   * @param resource resource to check if available
   */
  protected abstract isAvailable(resource: string): boolean

  /**
   * Resolve resource from data source
   *
   * @param resource resource to resolve
   *
   * @return resource resolved
   */
  protected abstract resolve(resource: string): any

  private writeln(text: string, style: number, columns: number): void {
    if (text === undefined) {
      return
    }
    const len = text.length
    let index = 0
    while (index < len) {
      const copy_len = Math.min(columns, len - index)
      const copy = text.substr(index, copy_len)
      this.printer.writeln(copy, style)
      index += copy_len
    }
    if (len == 0) {
      this.printer.feed()
    }
  }

  private split(left: string, text: string, right: string, width: number): string {
    const count = Math.trunc(text.length / width) + ((text.length % width) > 0 ? 1 : 0)
    let lines = ''
    for (let i = 0; i < count; i++) {
      const line = text.substr(i * width, Math.min(width, text.length - i * width))
      lines += left + line + right
    }
    return lines
  }

  private line(statement: object, columns: number, style: number, width: number, level: number): string {
    let left = statement['left'] || ''
    let right = statement['right'] || ''
    let text = ''
    columns -= left.length + right.length
    width -= left.length + right.length
    if ('items' in statement) {
      text = this.statement(statement['items'], columns, style, width, level)
      if (text === undefined) {
        return undefined
      }
    }
    if (statement['type'] == 'qrcode' || statement['type'] == 'image') {
      let reset = false
      if ('align' in statement) {
        reset = true
        if (statement['align'] == 'center') {
          this.printer.alignment = Align.Center
        } else if (statement['align'] == 'right') {
          this.printer.alignment = Align.Right
        } else {
          reset = false
        }
      }
      // write text left or right of qrcode or image
      if (statement['type'] == 'qrcode') {
        this.printer.qrcode(this.resolve(statement['data']))
      } else {
        this.printer.draw(this.resolve(statement['data']))
      }
      if (reset) {
        this.printer.alignment = Align.Left
      }
      return undefined
    }
    let whitespace = ' '
    if ('whitespace' in statement) {
      whitespace = statement['whitespace']
    }
    if ('align' in statement) {
      let spacing = 0
      const remaining = (width + columns - text.length % width) % width
      if (statement['align'] == 'center') {
        spacing = Math.trunc(remaining / 2)
      } else if (statement['align'] == 'right') {
        spacing = remaining
      }
      text = whitespace.repeat(Math.max(0, spacing)) + text
    }
    if (whitespace != ' ') {
      const remaining = (width + columns - text.length % width) % width
      text += whitespace.repeat(Math.max(0, text.length > 0 ? remaining : width))
    }
    return this.split(left, text, right, width)
  }

  /**
   * Print coupon
   */
  private statement(statement: any, columns: number, style: number, width: number, level: number): string {
    if (typeof statement === 'string') {
      return this.resolve(statement)
    }
    if (Array.isArray(statement)) {
      let text = ''
      statement.forEach((stmt: any) => {
        const result = this.statement(stmt, columns, style, width, level)
        if (result === undefined) {
          return
        }
        text += result
        if (text.length > columns) {
          // calculate free new lines spacing
          columns = width - text.length % width
        } else {
          // same line space remaining
          columns -= result.length
        }
      })
      return text
    }
    if ('required' in statement && !this.isAvailable(statement['required'])) {
      return undefined
    }
    if (!('list' in statement)) {
      return this.line(statement, columns, style, width, level)
    }
    let text = undefined
    const count = this.setCursor(statement['list'], 0)
    for (let i = 0; i < count; i++) {
      const line = this.line(statement, columns, style, width, level + 1)
      if (level > 0) {
        text = (text || '') + line
      } else {
        this.writeln(line, style, width)
      }
      this.setCursor(statement['list'], i + 1)
    }
    return text
  }

  /**
   * Print coupon
   */
  print() {
    this.template.forEach((stmt: any) => {
      let style = 0
      let columns = this.printer.columns
      if (typeof stmt === 'object') {
        if (stmt['width'] == '2x') {
          columns = Math.trunc(columns / 2)
          style |= Style.DoubleWidth
        }
        if (stmt['height'] == '2x') {
          style |= Style.DoubleHeight
        }
        if ('style' in stmt) {
          const styles = stmt['style'].split('+')
          styles.forEach((name: string) => {
            if (name == 'bold') {
              style |= Style.Bold
            } else if (name == 'italic') {
              style |= Style.Italic
            } else if (name == 'underline') {
              style |= Style.Underline
            } else if (name == 'condensed') {
              style |= Style.Condensed
              columns = Math.trunc(columns * 4 / 3)
            }
          })
        }
      }
      const text = this.statement(stmt, columns, style, columns, 0)
      this.writeln(text, style, columns)
    })
  }
}
