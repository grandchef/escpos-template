import { Printer, Align, Style } from 'escpos-buffer'
import { sprintf } from 'sprintf-js'

export abstract class Processor {
  private printer: Printer
  protected template: any[]

  constructor(printer: Printer, template: any[]) {
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
  protected abstract setCursor(list: string, position: number): number

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

  private styles(stmt: object, columns: number) {
    let style: number = 0
    if (stmt['width'] == '2x') {
      columns = Math.trunc(columns / 2)
      style |= Style.DoubleWidth
    }
    if (stmt['height'] == '2x') {
      style |= Style.DoubleHeight
    }
    if ('style' in stmt) {
      const styles = this.resolve(stmt['style']).split('+')
      styles.forEach((name: string) => {
        if (name == 'bold') {
          style |= Style.Bold
        } else if (name == 'italic') {
          style |= Style.Italic
        } else if (name == 'underline') {
          style |= Style.Underline
        } else if (name == 'condensed') {
          style |= Style.Condensed
          columns = Math.trunc((columns * 4) / 3)
        }
      })
    }
    return { columns, style }
  }

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

  private split(
    left: string,
    text: string,
    right: string,
    width: number,
  ): string {
    const count =
      Math.trunc(text.length / width) + (text.length % width > 0 ? 1 : 0)
    let lines = ''
    for (let i = 0; i < count; i++) {
      const line = text.substr(
        i * width,
        Math.min(width, text.length - i * width),
      )
      lines += left + line + right
    }
    return lines
  }

  private wordBreak(
    sentence: string,
    limit: number,
  ): { wordEnd: number; nextWord: number } {
    let wordEnd = Math.min(limit - 1, sentence.length - 1)
    let nextWord = wordEnd + 1
    // acha o começo da palavra que quebrou alinha
    if (sentence.length > limit) {
      while (sentence[nextWord] != ' ' && nextWord > 0) {
        nextWord--
      }
      wordEnd = nextWord
    }
    // remove os espaços do final
    while (wordEnd > 0 && sentence.length > limit && sentence[wordEnd] == ' ') {
      wordEnd--
    }
    // a palavra inteira é maior que a linha
    if (wordEnd == 0) {
      wordEnd = limit - 1
      nextWord = wordEnd + 1
    }
    // remove os espaços da próxima palavra
    while (nextWord < sentence.length && sentence[nextWord] == ' ') {
      nextWord++
    }
    return { wordEnd, nextWord }
  }

  private wordWrap(text: string, columns: number, width: number): string[] {
    let i = 0
    let lines = []
    while (i < text.length) {
      const currentColumns = lines.length == 0 ? columns : width
      const { wordEnd, nextWord } = this.wordBreak(
        text.substr(i),
        currentColumns,
      )
      lines.push(text.substr(i, wordEnd + 1))
      i += nextWord
    }
    return lines
  }

  private wordWrapJoin(
    text: string,
    columns: number,
    width: number,
    whitespace: string,
    align: string,
  ): string {
    const rawLines = this.wordWrap(text, columns, width)
    let lines = ''
    for (let i = 0; i < rawLines.length; i++) {
      const currentColumns = i == 0 ? columns : width
      const line = rawLines[i]
      const remaining = currentColumns - line.length
      let spacing = 0
      if (align == 'center') {
        spacing = Math.trunc(remaining / 2)
      } else if (align == 'right') {
        spacing = remaining
      }
      lines += whitespace.repeat(Math.max(0, spacing)) + line
      if (align == 'center') {
        lines += whitespace.repeat(Math.max(0, remaining - spacing))
      }
    }
    if (whitespace != ' ' || align == 'right') {
      const currentColumns = lines.length > 1 ? width : columns
      const remaining = currentColumns - lines.length
      lines += whitespace.repeat(
        Math.max(0, lines.length > 0 ? remaining : currentColumns),
      )
    }
    return lines
  }

  private line(
    statement: object,
    columns: number,
    style: number,
    width: number,
  ): string {
    let left = statement['left'] || ''
    let right = statement['right'] || ''
    let text = ''
    columns -= left.length + right.length
    width -= left.length + right.length
    if ('items' in statement) {
      text = this.statement(statement['items'], columns, style, width)
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
    if ('format' in statement) {
      text = sprintf(statement['format'], text)
    }
    text = text + ''
    let whitespace = ' '
    let align = 'left'
    if ('whitespace' in statement) {
      whitespace = statement['whitespace']
    }
    if ('align' in statement) {
      align = statement['align']
    }
    text = this.wordWrapJoin(text, columns, width, whitespace, align)
    return this.split(left, text, right, width)
  }

  /**
   * Print coupon
   */
  private statement(
    statement: any,
    columns: number,
    style: number,
    width: number,
  ): string {
    if (typeof statement === 'string') {
      return this.resolve(statement)
    }
    if (Array.isArray(statement)) {
      return statement.reduce((text: string, stmt: any) => {
        const result = this.statement(stmt, columns, style, width)
        if (result === undefined) {
          return text
        }
        text = (text || '') + `${result}`
        if (text.length > columns) {
          // calculate free new lines spacing
          const { wordEnd } = this.wordBreak(text, width)
          columns = wordEnd + 1
        } else {
          // same line space remaining
          columns -= `${result}`.length
        }
        return text
      }, undefined)
    }
    if ('required' in statement && !this.isAvailable(statement['required'])) {
      return undefined
    }
    let text = undefined
    const count = 'list' in statement ? this.setCursor(statement['list'], 0) : 1
    for (let i = 0; i < count; i++) {
      if ('row' in statement) {
        const { columns, style } = this.styles(statement, this.printer.columns)
        const line = this.line(statement, columns, style, columns)
        this.writeln(line === undefined ? line : line + '', style, columns)
      } else {
        const line = this.line(statement, columns, style, width)
        if (line !== undefined) {
          text = (text || '') + line + ''
        }
      }
      if ('list' in statement) {
        this.setCursor(statement['list'], i + 1)
      }
    }
    return text
  }

  /**
   * Print coupon
   */
  print() {
    this.template.forEach((line: any) => {
      const stmt =
        typeof line === 'object'
          ? { ...line, row: true }
          : { row: true, items: line }
      this.statement(stmt, this.printer.columns, 0, this.printer.columns)
    })
  }
}
