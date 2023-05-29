const { Printer, Model, InMemory, Image } = require('escpos-buffer')
const { ImageManager } = require('escpos-buffer-image')
const { ObjectProcessor } = require('../')
const path = require('path')

;(async () => {
  const connection = new InMemory()
  const printer = await Printer.CONNECT(new Model('MP-4200 TH'), connection)

  const template = [
    { items: 'coupon.title', align: 'center', style: 'bold+', width: '2x' },
    '',
    { items: 'Qrcode', align: 'right' },
    {
      type: 'qrcode',
      data: 'https://github.com/grandchef/escpos-template',
      align: 'right',
    },
    '',
    { items: 'picture.title', align: 'center', height: '2x' },
    { type: 'image', data: 'picture.image', align: 'center' },
    { whitespace: '=' },
  ]

  const imageManager = new ImageManager()
  const imageData = await imageManager.loadImage(
    path.join(__dirname, 'sample.png'),
  )
  const image = new Image(imageData)

  const data = {
    coupon: {
      title: 'Coupon Title',
    },
    picture: {
      title: 'Picture Title',
      image,
    },
  }

  const coupon = new ObjectProcessor(data, printer, template)
  await coupon.print()

  await printer.feed(2)
  await printer.buzzer()
  await printer.cutter()
  process.stdout.write(connection.buffer())
})()

//> node examples/basic.js | lp -d MyCupsPrinterName
