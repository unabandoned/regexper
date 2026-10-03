import parser from '@unabandoned/regexper-parser'
import { SVG, getWindow } from '@svgdotjs/svg.js'
import { style } from './style'
import { Metadata } from './types'
import { RootNode } from './root'
import { Options, State } from './state'
import { getExtensions } from './extensions'

/**
 * svg.js only has a window in a browser, or in a Node process that has called
 * its `registerWindow` (with svgdom, say). Asking for it up front turns a later
 * `null` dereference deep inside rendering into one sentence that says what is
 * missing.
 */
function requireWindow() {
  const win = getWindow()
  if (!win) {
    throw new Error(
      'No window is registered with @svgdotjs/svg.js. In a browser this is ' +
        'automatic; outside one, call registerWindow() first.',
    )
  }
  return win
}

export async function render(
  regex: string | RegExp,
  container: SVGSVGElement | SVGGElement,
  options: Options = {},
) {
  const win = requireWindow()
  const state = new State(options)
  const extensions = getExtensions()
  const regexString = typeof regex === 'string' ? regex : regex.toString()
  const tree = parser.parse(regexString, { types: extensions }) as Metadata
  const root = new RootNode(tree, state)
  const svg = SVG(container)

  svg.node.removeAttribute('xmlns:svgjs')
  svg
    .defs()
    .style()
    .add(win.document.createTextNode(style) as any)

  await root.render(svg.group())
  const bbox = root.bbox()
  root.translate(10 - bbox.x, 10 - bbox.y)
  svg.size(bbox.width + 20, bbox.height + 20)
  return root
}

export async function generateSVG(
  regex: string | RegExp,
  options: Options = {},
): Promise<SVGSVGElement> {
  const win = requireWindow()
  const svg = win.document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  await render(regex, svg, options)
  return svg
}
