const { Printer, Model, InMemory, Image } = require('escpos-buffer')
const { ObjectProcessor } = require('../')
const path = require('path')

const model = new Model('MP-4200 TH')
const connection = new InMemory()
const printer = new Printer(model, connection)

const template = [
  { items: 'coupon.title', align: 'center', style: 'bold+', width: '2x' },
  '',
  { items: 'Qrcode', align: 'right' },
  { type: 'qrcode', data: 'https://github.com/grandchef/escpos-template', align: 'right' },
  '',
  { items: 'picture.title', align: 'center', height: '2x' },
  { type: 'image', data: 'picture.image', align: 'center' },
  { whitespace: '=' }
]

const image = new Image(path.join(__dirname, 'sample.png'))

const data = {
  coupon: {
    title: 'Coupon Title'
  },
  picture: {
    title: 'Picture Title',
    image
  }
}

const coupon = new ObjectProcessor(data, printer, template)
coupon.print()

printer.feed(2)
printer.buzzer()
printer.cutter()
process.stdout.write(connection.buffer())

//> node examples/basic.js | lp -d MyCupsPrinterName
