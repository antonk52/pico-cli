# Pico-cli

Typescript first and zero dependency CLI framework

## Install

```
npm install pico-cli
```

## Usage

```js
import {PicoCli} from 'pico-cli'

PicoCli.create({
    name: 'my-cli',
    description: 'My cli is used to do X and Y',
    options: {
        // TODO: document options
    },
})
// you can chain adding commands to your cli
.addCommand('foo', {
    handler: (args) => {},
    description: 'use foo to do X'
    aliases: ['f'] // A.K.A. shortcuts
})
.addCommand('bar', {
    handler: (args) => {},
    description: 'use bar to do Y',
    aliases: ['b'],
})
// to run the cli
.run(
    // optionally provide arguments
    process.argv.slice(2)
);
```

## API

### `PicoCli.create`

`Function` creates a CLI instance. Accepts a name and a specification.

### `PicoCli.commaSeparatedString`

TODO

### `PicoCli.flagHandler`

TODO

### `PicoCli.Error`

TODO

## TODO

- [ ] commands of commands
- [ ] options to not print help on error
- [ ] handle merged single letter options
