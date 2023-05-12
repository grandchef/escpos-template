import { Printer, Align, Style } from 'escpos-buffer'
import { sprintf } from 'sprintf-js'
import { remove as removeDiacritics } from 'diacritics'

export interface Options {
  uppercase?: boolean
  removeAccents?: boolean
}

export abstract class Processor {
  private printer: Printer
  protected template: any[]
  private options: Options

  constructor(printer: Printer, template: any[], options?: Options) {
    this.printer = printer
    this.template = template
    this.options = options
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

  private styles(stmt: { width: string, height: string, style: string }, columns: number) {
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

  private toUpperCase(text: string): string {
    return text.toUpperCase()
  }

  private removeAccents(text: string): string {
    return removeDiacritics(text)
  }

  private applyOptions(text: string): string {
    if (text === undefined) {
      return text
    }
    if (this.options && this.options.uppercase) {
      text = this.toUpperCase(text)
    }
    if (this.options && this.options.removeAccents) {
      text = this.removeAccents(text)
    }
    return text
  }

  private async writeln(text: string, style: number, columns: number): Promise<void> {
    if (text === undefined) {
      return
    }
    const len = text.length
    let index = 0
    while (index < len) {
      const copy_len = Math.min(columns, len - index)
      const copy = text.substr(index, copy_len)
      await this.printer.writeln(copy, style)
      index += copy_len
    }
    if (len == 0) {
      await this.printer.feed()
    }
  }

  private split(
    left: string,
    text: string,
    right: string,
    width: number,
    whitespace: string,
  ): string {
    const count =
      Math.trunc(text.length / width) + (text.length % width > 0 ? 1 : 0)
    let lines = ''
    for (let i = 0; i < count; i++) {
      const line = text.substr(
        i * width,
        Math.min(width, text.length - i * width),
      )
      const spacing = right.length > 0 ? width - line.length : 0
      lines += left + line
      lines += whitespace.repeat(spacing) + right
    }
    return lines
  }

  private wordBreak(
    sentence: string,
    limit: number,
    breakChar: string,
  ): { wordEnd: number; nextWord: number } {
    let wordEnd = Math.min(limit - 1, sentence.length - 1)
    let nextWord = wordEnd + 1
    // acha o começo da palavra que quebrou alinha
    if (sentence.length > limit) {
      while (sentence[nextWord] != breakChar && nextWord > 0) {
        nextWord--
      }
      wordEnd = nextWord
    }
    // remove os espaços do final
    while (
      wordEnd > 0 &&
      sentence.length > limit &&
      sentence[wordEnd] == breakChar
    ) {
      wordEnd--
    }
    // a palavra inteira é maior que a linha
    if (wordEnd == 0) {
      wordEnd = -1
      nextWord = wordEnd + 1
    }
    // remove os espaços da próxima palavra
    while (nextWord < sentence.length && sentence[nextWord] == breakChar) {
      nextWord++
    }
    return { wordEnd, nextWord }
  }

  private wordWrap(
    text: string,
    columns: number,
    width: number,
    breakChar: string,
  ): string[] {
    let i = 0
    let lines = []
    while (i < text.length) {
      const currentColumns = lines.length == 0 ? columns : width
      const remainingText = text.substr(i)
      const { wordEnd, nextWord } = this.wordBreak(
        remainingText,
        currentColumns,
        breakChar,
      )
      const lengthToCopy =
        wordEnd < 0
          ? currentColumns < width && remainingText.length > currentColumns
            ? 0
            : width
          : wordEnd + 1
      lines.push(text.substr(i, lengthToCopy))
      i += Math.max(nextWord, lengthToCopy)
    }
    return lines
  }

  private wordWrapJoin(
    text: string,
    columns: number,
    width: number,
    whitespace: string,
    align: string,
    breakChar: string = ' ',
  ): string {
    const rawLines = this.wordWrap(text, columns, width, breakChar)
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
      // adiciona espaços na direita antes da última linha
      if (i < rawLines.length - 1) {
        lines += whitespace.repeat(Math.max(0, remaining - spacing))
      }
    }
    return lines
  }

  private async line(
    statement: object,
    columns: number,
    style: number,
    width: number,
  ): Promise<string> {
    let left = statement['left'] || ''
    let right = statement['right'] || ''
    let text = ''
    columns -= left.length + right.length
    width -= left.length + right.length
    if ('items' in statement) {
      text = await this.statement(statement['items'], columns, style, width)
      if (text === undefined) {
        return undefined
      }
    }
    if (statement['type'] == 'qrcode' || statement['type'] == 'image') {
      let reset = false
      if ('align' in statement) {
        reset = true
        if (statement['align'] == 'center') {
          await this.printer.setAlignment(Align.Center)
        } else if (statement['align'] == 'right') {
          await this.printer.setAlignment(Align.Right)
        } else {
          reset = false
        }
      }
      // write text left or right of qrcode or image
      if (statement['type'] == 'qrcode') {
        await this.printer.qrcode(this.resolve(statement['data']))
      } else {
        await this.printer.draw(this.resolve(statement['data']))
      }
      if (reset) {
        await this.printer.setAlignment(Align.Left)
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
      whitespace = statement['whitespace'] as string
    }
    if ('align' in statement) {
      align = statement['align'] as string
    }
    if (align != 'left') {
      const breakChar = !('wrap' in statement) || statement['wrap'] ? ' ' : ''
      text = this.wordWrapJoin(
        text,
        columns,
        width,
        whitespace,
        align,
        breakChar,
      )
    }
    if (whitespace != ' ') {
      const remaining = columns - (text.length % columns)
      const spacing = text.length > 0 ? remaining % columns : columns
      text += whitespace.repeat(spacing)
    }
    return this.split(left, text, right, width, whitespace)
  }

  /**
   * Print coupon
   */
  private async statement(
    statement: any,
    columns: number,
    style: number,
    width: number,
  ): Promise<string> {
    if (typeof statement === 'string') {
      return this.applyOptions(this.resolve(statement))
    }
    if (Array.isArray(statement)) {
      const initialColumns = columns
      return statement.reduce(async (text: string, stmt: any) => {
        const result = await this.statement(stmt, columns, style, width)
        if (result === undefined) {
          return text
        }
        text = (text || '') + `${result}`
        if (text.length > width) {
          // Calculate free new lines spacing
          if (
            typeof stmt === 'object' &&
            'align' in stmt &&
            stmt['align'] != 'left'
          ) {
            columns = width - (text.length % width)
          } else {
            text = this.wordWrapJoin(text, initialColumns, width, ' ', 'left')
            columns = width - (text.length % width)
          }
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
        const line = await this.line(statement, columns, style, columns)
        await this.writeln(line === undefined ? line : line + '', style, columns)
      } else {
        const line = await this.line(statement, columns, style, width)
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
  async print() {
    await Promise.all(this.template.map(async (line: any) => {
      const stmt =
        typeof line === 'object'
          ? { ...line, row: true }
          : { row: true, items: line }
      await this.statement(stmt, this.printer.columns, 0, this.printer.columns)
    }))
  }
}
