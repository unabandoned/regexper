import { Repeat } from './repeat'

/**
 * The parse node this mixin ends up on. canopy copies the matching entry of its
 * `types` option onto each node it builds, so `this` inside `specific()` is the
 * `a{m,n}` node from the grammar — not the object literal below. The labels are
 * the ones regexp.peg gives that rule:
 *
 *     repeat_spec <- ( "{" min:[0-9]+ "," max:[0-9]+ "}"
 *                    / "{" min:[0-9]+ ",}"
 *                    / "{" exact:[0-9]+ "}" ) <RepeatSpec>
 */
interface RepeatSpecNode extends Repeat {
  readonly text: string
  readonly min?: { text: string }
  readonly max?: { text: string }
  readonly exact?: { text: string }
}

/**
 * RepeatSpec nodes are used for `a{m,n}` regular expression syntax. It is not
 * rendered directly; it just indicates how many times the Repeat node loops.
 */
export const RepeatSpec: Repeat = {
  specific(this: RepeatSpecNode) {
    const min = this.min ? +this.min.text : this.exact ? +this.exact.text : 0
    const max = this.max ? +this.max.text : this.exact ? +this.exact.text : -1

    // Report invalid repeat when the minimum is larger than the maximum.
    if (min > max && max !== -1) {
      throw new Error(`Numbers out of order: ${this.text}`)
    }

    return {
      min,
      max,
    }
  },
}
