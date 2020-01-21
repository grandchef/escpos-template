import { load } from './helper'
import { ObjectProcessor } from '../src'
import { Model, InMemory, Printer, Image } from 'escpos-buffer'

describe('print coupon from template', () => {
  it('advance lines', () => {
    const template = [
      'First Line',
      '',
      '',
      'Last Line',
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_advance_lines', connection.buffer()))
  })

  it('text lines coupon', () => {
    const template = [
      'Line 1',
      'Line 2',
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_text_lines', connection.buffer()))
  })

  it('whitespace character', () => {
    const template = [
      { whitespace: '-', items: ' Line 1 ', align: 'center' },
      { whitespace: '-', items: ' Line 2', align: 'right' },
      { whitespace: '-', items: 'Line 1 ', align: 'left' },
      { whitespace: '=' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_whitespace', connection.buffer()))
  })

  it('stylized text', () => {
    const template = [
      { items: 'Bold Text', style: 'bold' },
      { items: 'Italic Text', style: 'italic' },
      { items: 'Underline Text', style: 'underline' },
      { items: 'Condensed Text', style: 'condensed' },
      { items: 'All Styles', style: 'bold+italic+underline+condensed+unknow' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_stylized', connection.buffer()))
  })

  it('text size', () => {
    const template = [
      { items: 'Double Width', width: '2x' },
      { items: 'Double Height', height: '2x' },
      { items: 'Double Width and Height', width: '2x', height: '2x' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_text_size', connection.buffer()))
  })

  it('print qrcode', () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'left' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_qrcode', connection.buffer()))
  })

  it('print qrcode align right', () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'right' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_qrcode_right', connection.buffer()))
  })

  it('print qrcode align center', () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'center' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_qrcode_center', connection.buffer()))
  })
})

describe('print coupon from object data source', () => {
  it('print text from object path', () => {
    const template = [
      { items: 'company.title', align: 'center' },
      'company.address',
    ]
    const data = {
      company: {
        title: 'Company Name',
        address: 'Street Adress, 100, District, City - Country'
      }
    }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_text_object_path', connection.buffer()))
  })

  it('print available resource', () => {
    const template = [
      { items: 'company.title', align: 'center' },
      { items: 'company.address', required: 'company.address' },
      { items: 'company.phone', required: 'product.phone' },
      { items: 'List Title', align: 'center', required: 'product.list' },
      { items: { items: 'Footer', align: 'center', required: 'product.list' } },
    ]
    const data = {
      company: {
        title: 'Company Name',
        address: 'Street Adress, 100, District, City - Country'
      },
      product: {
        list: []
      }
    }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_available_resource', connection.buffer()))
  })

  it('print unavailable', () => {
    const template = [
      { items: 'company.title', list: 'unknow.list' },
    ]
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({}, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_unavailable_resource', connection.buffer()))
  })

  it('print text list', () => {
    const template = [
      { items: [ '┌', { whitespace: '─', align: 'right', items: '┐' } ] },
      { items: [
        '│', ' CODE', ' DESCRIPTION', { items: [' PRICE', ' │'], align: 'right' }
      ]},
      { items: [ '├', { whitespace: '─', align: 'right', items: '┤' } ] },
      { list: 'items', items: [
        'items[].code', ' ', 'items[].description', { items: [' ', 'items[].price'], align: 'right' }
      ], left: '│ ', right: ' │'},
      { items: [ '└', { whitespace: '─', align: 'right', items: '┘' } ] },
    ]
    const data = {
      items: [
        {
          code: '0001',
          description: 'Soda 2l',
          price: '$ 5',
        },
        {
          code: '0002',
          description: 'Ultra Thin 20000mAh Portable External Battery Charger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
        {
          code: '0003',
          description: 'Strawberry Juice 300ml',
          price: '$ 5',
        }
      ]
    }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    printer.columns = 48
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_object_list', connection.buffer()))
  })

  it('print sublist', () => {
    const template = [
      { items: [
        'Sublist ',
        'list.number',
        ': [ ',
        { list: 'list[].sublist', items: [
          { required: 'list[].sublist.!first', items: ', ' },
          'list..sublist[]'
        ] },
        ' ]'
      ], list: 'list' },
      { items: [
        { items: 'single.0', required: 'single.first' },
        { items: 'single.index', required: 'single.!last' },
        { items: 'single.count', required: 'single.last' }
      ], list: 'single'}
    ]
    const data = {
      list: [
        { sublist: ['1', '2', '3']},
        { sublist: ['4', '5', '6']},
        { sublist: ['7', '8', '9']},
      ],
      single: ['first element', 'middle element', 'last element']
    }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_sublist', connection.buffer()))
  })

  it('print image', () => {
    const template = [
      { whitespace: '_' },
      { type: 'image', data: 'image' },
      { whitespace: '-' },
    ]
    const image = new Image(load('sample.png'))
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor({ image }, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_image', connection.buffer()))
  })
})

describe('print coupon formatted', () => {
  it('format using sprintf', () => {
    const template = [
      { format: '%4s', items: '1/2' },
      { format: '%06d', items: 'code' },
    ]
    const data = { code: 123 }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_sprintf', connection.buffer()))
  })

  it('format using custom function', () => {
    const template = [
      { format: '$ ', items: '3.60' },
      { format: 'QTD: ', items: ['quantity', 'g'] },
    ]
    const data = {
      quantity: 30,
      format (format: string, param: any) {
        return format + `${param}`
      }
    }
    const connection = new InMemory()
    const printer = new Printer(new Model('MP-4200 TH'), connection)
    const coupon = new ObjectProcessor(data, printer, template)
    coupon.print()
    expect(connection.buffer()).toStrictEqual(load('mp-4200_th_custom_format', connection.buffer()))
  })
})
