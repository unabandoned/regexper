# regexper

Turn a regular expression into a railroad diagram.

> A maintained fork of [bubkoo/regexper](https://github.com/bubkoo/regexper),
> whose two published packages have sat at 1.0.0 since July 2022. Published here as
> [`@unabandoned/regexper-parser`](https://www.npmjs.com/package/@unabandoned/regexper-parser)
> and
> [`@unabandoned/regexper-render`](https://www.npmjs.com/package/@unabandoned/regexper-render);
> the API is unchanged from upstream.

| package | what it does |
| --- | --- |
| [`@unabandoned/regexper-parser`](packages/parser) | reads a regular expression into an AST, from a PEG grammar compiled by canopy |
| [`@unabandoned/regexper-render`](packages/render) | draws that AST as an SVG railroad diagram |

## Install

```sh
npm i @unabandoned/regexper-render @svgdotjs/svg.js
```

`@svgdotjs/svg.js` is a peer dependency, so the consumer chooses its version.

## Use

```js
import { generateSVG } from '@unabandoned/regexper-render'

const svg = await generateSVG('/^ab+(c|d)[0-9]{2,3}$/gi')
document.body.append(svg)
```

`render(regex, container, options)` draws into an `<svg>` or `<g>` you already
have, and returns the root node of the diagram.

Outside a browser, give svg.js a DOM first:

```js
import { createSVGWindow } from 'svgdom'
import { registerWindow } from '@svgdotjs/svg.js'

const win = createSVGWindow()
registerWindow(win, win.document)
```

## Develop

```sh
npm install   # one npm workspace, both packages
npm run build # canopy compiles the grammar, tsc emits es/ and lib/
npm test
```

Everything either package publishes is generated, so `npm test` depends on
`npm run build` having run.

## License

MIT, as upstream. See [LICENSE](LICENSE).
