[![TypeScript version][ts-badge]][typescript-37]
[![Node.js version][nodejs-badge]][nodejs]
[![MIT][license-badge]][LICENSE]
[![Build Status][travis-badge]][travis-ci]

# ESC/POS Template Processing Library

Library to process json template for thermal printers coupons.

## Install

Run command bellow on your project folder

```sh
yarn add escpos-template
```
or
```sh
npm install escpos-template
```

## Basic example
```js
const { Printer, Model, InMemory, Image } = require('escpos-buffer')
const { ObjectProcessor } = require('escpos-template')
const path = require('path')

const connection = new InMemory()
const printer = new Printer(new Model('MP-4200 TH'), connection)

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

// to print, run command bellow on terminal
//> node examples/basic.js | lp -d MyCupsPrinterName
```

## Available scripts

+ `clean` - remove coverage data, Jest cache and transpiled files,
+ `build` - transpile TypeScript to ES6,
+ `build:watch` - interactive watch mode to automatically transpile source files,
+ `lint` - lint source files and tests,
+ `test` - run tests,
+ `test:watch` - interactive watch mode to automatically re-run tests
+ `test:debug` - run tests debugging

## License
Licensed under the MIT. See the [LICENSE](https://github.com/grandchef/escpos-template/blob/master/LICENSE) file for details.

[ts-badge]: https://img.shields.io/badge/TypeScript-3.7-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%2010-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v10.x/docs/api/
[travis-badge]: https://travis-ci.org/grandchef/escpos-template.svg?branch=master
[travis-ci]: https://travis-ci.org/grandchef/escpos-template
[typescript]: https://www.typescriptlang.org/
[typescript-37]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: https://github.com/grandchef/escpos-template/blob/master/LICENSE
