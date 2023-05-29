import * as path from 'path'
import { load } from './helper'
import { ObjectProcessor } from '../src'
import { Model, InMemory, Printer, Image } from 'escpos-buffer'
import { ImageManager } from 'escpos-buffer-image'

describe('print coupon from template', () => {
  it('advance lines', async () => {
    const template = ['First Line', '', '', 'Last Line']
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_advance_lines', connection.buffer()),
    )
  })

  it('text lines coupon', async () => {
    const template = ['Line 1', 'Line 2']
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_text_lines', connection.buffer()),
    )
  })

  it('whitespace character', async () => {
    const template = [
      { whitespace: '-', items: ' Line 1 ', align: 'center' },
      { whitespace: '-', items: ' Line 2', align: 'right' },
      { whitespace: '-', items: 'Line 1 ', align: 'left' },
      { whitespace: '=' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_whitespace', connection.buffer()),
    )
  })

  it('print text with word wrap', async () => {
    const template = [
      {
        items:
          'Suspendisse finibus ligula interdum, finibus augue vel, condimentum felis.',
        style: 'bold',
      },
      {
        items:
          'Suspendisse.finibus-ligula_interdum,finibus-augue_vel,condimentum-felis.',
        align: 'left',
      },
      {
        items: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        align: 'center',
        width: '2x',
      },
      {
        items: 'Lorem-ipsum-dolorSitAmet,consectetur-adipiscing-elit.',
        align: 'center',
        height: '2x',
      },
      {
        items:
          'Suspendisse finibus ligula interdum, finibus augue vel, condimentum felis.',
        align: 'right',
      },
      {
        items:
          'Suspendisse.finibus-ligula_interdum,finibus-augue_vel,condimentum-felis.',
        align: 'right',
      },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_word_wrap', connection.buffer()),
    )
  })

  it('stylized text inline', async () => {
    const template = [
      { items: 'Bold Text', style: 'bold' },
      { items: 'Italic Text', style: 'italic' },
      { items: 'Underline Text', style: 'underline' },
      { items: 'Condensed Text', style: 'condensed' },
      { items: 'All Styles', style: 'bold+italic+underline+condensed+unknow' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_stylized', connection.buffer()),
    )
  })

  it('stylized text', async () => {
    const template = [
      { items: 'Bold Text', style: 'bold' },
      { items: 'Italic Text', style: 'italic' },
      { items: 'Underline Text', style: 'underline' },
      { items: 'Condensed Text', style: 'condensed' },
      { items: 'All Styles', style: 'all' },
    ]
    const data = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      condensed: 'condensed',
      all: 'bold+italic+underline+condensed+unknow',
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_stylized', connection.buffer()),
    )
  })

  it('uppercase text', async () => {
    const template = [{ items: 'UpperCase Text' }]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template, {
      uppercase: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_uppercase', connection.buffer()),
    )
  })

  it('without accents text', async () => {
    const template = [{ items: 'Ficção Científica' }]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template, {
      removeAccents: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_removed_accents', connection.buffer()),
    )
  })

  it('without accents and uppercase text', async () => {
    const template = [{ items: 'Ficção Científica' }]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template, {
      removeAccents: true,
      uppercase: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_removed_accents_uppercase', connection.buffer()),
    )
  })

  it('text size', async () => {
    const template = [
      { items: 'Double Width', width: '2x' },
      { items: 'Double Height', height: '2x' },
      { items: 'Double Width and Height', width: '2x', height: '2x' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_text_size', connection.buffer()),
    )
  })

  it('print qrcode', async () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'left' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_qrcode', connection.buffer()),
    )
  })

  it('print qrcode align right', async () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'right' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_qrcode_right', connection.buffer()),
    )
  })

  it('print qrcode align center', async () => {
    const template = [
      { whitespace: '_' },
      { type: 'qrcode', data: 'text from qrcode', align: 'center' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_qrcode_center', connection.buffer()),
    )
  })
})

describe('print coupon from object data source', () => {
  it('print text from object path', async () => {
    const template = [
      { items: 'company.title', align: 'center' },
      'company.address',
    ]
    const data = {
      company: {
        title: 'Company Name',
        address: 'Street Adress, 100, District, City - Country',
      },
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_text_object_path', connection.buffer()),
    )
  })

  it('print available resource', async () => {
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
        address: 'Street Adress, 100, District, City - Country',
      },
      product: {
        list: [],
      },
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_available_resource', connection.buffer()),
    )
  })

  it('print unavailable', async () => {
    const template = [{ items: 'company.title', list: 'unknow.list' }]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_unavailable_resource', connection.buffer()),
    )
  })

  it('print text list', async () => {
    const template = [
      { items: ['┌', { whitespace: '─', align: 'right', items: '┐' }] },
      {
        items: [
          '│',
          ' CODE',
          ' DESCRIPTION',
          { items: [' PRICE', ' │'], align: 'right' },
        ],
      },
      { items: ['├', { whitespace: '─', align: 'right', items: '┤' }] },
      {
        list: 'items',
        items: [
          'items[].code',
          ' ',
          'items[].description',
          { items: [' ', 'items[].price'], align: 'right', wrap: false },
        ],
        left: '│ ',
        right: ' │',
      },
      { items: ['└', { whitespace: '─', align: 'right', items: '┘' }] },
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
          description:
            'Ultra Thin 20000mAh Portable External Battery Charger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
        {
          code: '0003',
          description: 'Strawberry Juice 300ml',
          price: '$ 5',
        },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    await printer.setColumns(48)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_object_list', connection.buffer()),
    )
  })

  it('print multiline list', async () => {
    const template = [
      { items: ['┌', { whitespace: '─', align: 'right', items: '┐' }] },
      {
        items: [
          '│',
          ' CODE',
          ' DESCRIPTION',
          { items: [' PRICE', ' │'], align: 'right' },
        ],
      },
      { items: ['├', { whitespace: '─', align: 'right', items: '┤' }] },
      {
        list: 'items',
        items: [
          {
            row: true,
            style: 'bold',
            items: [
              'items[].code',
              ' ',
              'items[].description',
              { items: [' ', 'items[].price'], align: 'right', wrap: false },
            ],
            left: '│ ',
            right: ' │',
          },
          {
            left: '│ ',
            items: 'items[].observation',
            right: ' │',
            row: true,
            style: 'italic',
            height: '2x',
            align: 'center',
            required: 'items[].observation',
          },
        ],
      },
      { items: ['└', { whitespace: '─', align: 'right', items: '┘' }] },
    ]
    const data = {
      items: [
        {
          code: '0001',
          description: 'Soda 2l',
          observation:
            'Simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the ' +
            "industry's standard dummy text ever since the 1500s",
          price: '$ 5',
        },
        {
          code: '0002',
          description:
            'Ultra Thin 20000mAh Portable External Battery Charger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
        {
          code: '0003',
          description: 'Strawberry Juice 300ml',
          observation:
            'There are many variations of passages of Lorem Ipsum available, but the majority have ' +
            'suffered alteration in some form, by injected humour',
          price: '$ 5',
        },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_multiline_list', connection.buffer()),
    )
  })

  it('print multiline list uppercase', async () => {
    const template = [
      { items: ['┌', { whitespace: '─', align: 'right', items: '┐' }] },
      {
        items: [
          '│',
          ' CODE',
          ' DESCRIPTION',
          { items: [' PRICE', ' │'], align: 'right' },
        ],
      },
      { items: ['├', { whitespace: '─', align: 'right', items: '┤' }] },
      {
        list: 'items',
        items: [
          {
            row: true,
            style: 'bold',
            items: [
              'items[].code',
              ' ',
              'items[].description',
              { items: [' ', 'items[].price'], align: 'right', wrap: false },
            ],
            left: '│ ',
            right: ' │',
          },
          {
            left: '│ ',
            items: 'items[].observation',
            right: ' │',
            row: true,
            style: 'italic',
            height: '2x',
            align: 'center',
            required: 'items[].observation',
          },
        ],
      },
      { items: ['└', { whitespace: '─', align: 'right', items: '┘' }] },
    ]
    const data = {
      items: [
        {
          code: '0001',
          description: 'Soda 2l',
          observation:
            'Simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the ' +
            "industry's standard dummy text ever since the 1500s",
          price: '$ 5',
        },
        {
          code: '0002',
          description:
            'Ultra Thin 20000mAh Portable External Battery Charger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template, {
      uppercase: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_multiline_list_uppercase', connection.buffer()),
    )
  })

  it('print multiline list without accents', async () => {
    const template = [
      { items: ['┌', { whitespace: '─', align: 'right', items: '┐' }] },
      {
        items: [
          '│',
          ' CODE',
          ' DESCRIPTION',
          { items: [' PRICE', ' │'], align: 'right' },
        ],
      },
      { items: ['├', { whitespace: '─', align: 'right', items: '┤' }] },
      {
        list: 'items',
        items: [
          {
            row: true,
            style: 'bold',
            items: [
              'items[].code',
              ' ',
              'items[].description',
              { items: [' ', 'items[].price'], align: 'right', wrap: false },
            ],
            left: '│ ',
            right: ' │',
          },
          {
            left: '│ ',
            items: 'items[].observation',
            right: ' │',
            row: true,
            style: 'italic',
            height: '2x',
            align: 'center',
            required: 'items[].observation',
          },
        ],
      },
      { items: ['└', { whitespace: '─', align: 'right', items: '┘' }] },
    ]
    const data = {
      items: [
        {
          code: '0001',
          description: 'Sóda 2l',
          observation:
            'Simply dúmmy text of the printing and typesetting industry. Lorem Ipsum has been the ' +
            "industry's stândard dûmmy text ever sinçe the 1500s",
          price: '$ 5',
        },
        {
          code: '0002',
          description:
            'Ultra Thin 20000mAh Portable External Battery Çharger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template, {
      removeAccents: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_multiline_list_removed_accents', connection.buffer()),
    )
  })

  it('print multiline list without accents and uppercase', async () => {
    const template = [
      { items: ['┌', { whitespace: '─', align: 'right', items: '┐' }] },
      {
        items: [
          '│',
          ' CODE',
          ' DESCRIPTION',
          { items: [' PRICE', ' │'], align: 'right' },
        ],
      },
      { items: ['├', { whitespace: '─', align: 'right', items: '┤' }] },
      {
        list: 'items',
        items: [
          {
            row: true,
            style: 'bold',
            items: [
              'items[].code',
              ' ',
              'items[].description',
              { items: [' ', 'items[].price'], align: 'right', wrap: false },
            ],
            left: '│ ',
            right: ' │',
          },
          {
            left: '│ ',
            items: 'items[].observation',
            right: ' │',
            row: true,
            style: 'italic',
            height: '2x',
            align: 'center',
            required: 'items[].observation',
          },
        ],
      },
      { items: ['└', { whitespace: '─', align: 'right', items: '┘' }] },
    ]
    const data = {
      items: [
        {
          code: '0001',
          description: 'Sóda 2l',
          observation:
            'Simply dúmmy text of the printing and typesetting industry. Lorem Ipsum has been the ' +
            "industry's stândard dûmmy text ever sinçe the 1500s",
          price: '$ 5',
        },
        {
          code: '0002',
          description:
            'Ultra Thin 20000mAh Portable External Battery Çharger Power Bank for Cell Phone',
          price: '$ 10.89',
        },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template, {
      removeAccents: true,
      uppercase: true,
    })
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load(
        'mp-4200_th_multiline_list_removed_accents_uppercase',
        connection.buffer(),
      ),
    )
  })

  it('print sublist', async () => {
    const template = [
      {
        items: [
          'Sublist ',
          'list.number',
          ': [ ',
          {
            list: 'list[].sublist',
            items: [
              { required: 'list[].sublist.!first', items: ', ' },
              'list..sublist[]',
            ],
          },
          ' ]',
        ],
        list: 'list',
      },
      {
        items: [
          { items: 'single.0', required: 'single.first' },
          { items: 'single.index', required: 'single.!last' },
          { items: 'single.count', required: 'single.last' },
        ],
        list: 'single',
      },
    ]
    const data = {
      list: [
        { sublist: ['1', '2', '3'] },
        { sublist: ['4', '5', '6'] },
        { sublist: ['7', '8', '9'] },
      ],
      single: ['first element', 'middle element', 'last element'],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_sublist', connection.buffer()),
    )
  })

  it('print optional lines', async () => {
    const template = [
      {
        items: [
          {
            list: 'list[].sublist',
            items: [{ required: 'list.!first', items: 'list[].sublist[]' }],
          },
        ],
        list: 'list',
      },
    ]
    const data = {
      list: [
        { sublist: [1, 2, 3] },
        { sublist: [4, 5, 6] },
        { sublist: [7, 8, 9] },
      ],
    }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_optional_lines', connection.buffer()),
    )
  })

  it('print image', async () => {
    const template = [
      { whitespace: '_' },
      { type: 'image', data: 'image' },
      { whitespace: '-' },
    ]
    const connection = new InMemory()
    const imageManager = new ImageManager()
    const imageData = await imageManager.loadImage(
      path.join(__dirname, 'resources/sample.png'),
    )
    const image = new Image(imageData)
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({ image }, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_image', connection.buffer()),
    )
  })

  it('print align right with whitespace', async () => {
    const template = [
      {
        items: [
          'Total ',
          {
            whitespace: '.',
            align: 'right',
            wrap: false,
            items: [' ', '$ 5.68'],
          },
        ],
      },
      {
        width: '2x',
        items: [
          'Paid ',
          {
            whitespace: '.',
            align: 'right',
            wrap: false,
            items: [' ', '$ 2.68'],
          },
        ],
      },
    ]
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor({}, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_align_right', connection.buffer()),
    )
  })
})

describe('print coupon formatted', () => {
  it('format using sprintf', async () => {
    const template = [
      { format: '%4s', items: '1/2' },
      { format: '%06d', items: 'code' },
    ]
    const data = { code: 123 }
    const connection = new InMemory()
    const model = new Model('MP-4200 TH')
    const printer = await Printer.CONNECT(model, connection)
    const coupon = new ObjectProcessor(data, printer, template)
    await coupon.print()
    expect(connection.buffer()).toStrictEqual(
      load('mp-4200_th_sprintf', connection.buffer()),
    )
  })
})
