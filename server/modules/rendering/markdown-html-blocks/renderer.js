module.exports = {
  init (md, conf) {
    md.use((md) => {
      // console.log('LOADING PLUGIN')
      md.block.ruler.before('htmlblock', 'chtmlblock', htmlBlockProcessor)
      // console.log(md.block.ruler)
    })
  }
}

/*
::foldable :title="any text"
  ::foldable-title
    Actual title with **other markdown syntax**
  Foldable contitle
  Works while tabulated
::
*/

/**
 * @param {import("markdown-it/lib/rules_block/state_block")} state
 * @param {number} startline
 * @param {number} endline
 * @param {boolean} silent
 */
function htmlBlockProcessor(state, startline, endline, silent) {
  let initPos = state.bMarks[startline] + state.tShift[startline]
  // console.log(`initPos: ${initPos}, startline: ${startline}`)
  let pos = initPos
  // let max = state.eMarks[startline]

  /** @type {string} */
  let src = state.src
  if (!src.startsWith('::', pos)) { return false }
  let level = 0
  {
    let ch = src.charAt(pos)
    while (ch === ':') {
      level += 1
      ch = src.charAt(++pos)
    }
  }
  initPos = pos

  if (level < 2) { return false }

  if (silent) { return true }

  // console.log(`DEBUG:: PRE ${JSON.stringify(state.tokens, null, 4)}\n`)

  {
    let ch = src.charAt(pos)
    while ('qwertyuiopasdfghjklzxcvbnm_-'.indexOf(ch) !== -1) {
      ch = src.charAt(++pos)
    }
  }

  let key = src.substring(initPos, pos)

  pos = state.skipSpaces(pos)

  let nextline = startline + 1
  // console.log(`start: ${startline}, nextline: ${nextline}`)
  while (!src.startsWith(`${':'.repeat(level)}${key}`, state.bMarks[nextline] + state.tShift[nextline]) && nextline <= endline) {
    nextline += 1
    // console.log(`move by one, nextline: ${nextline}`)
  }
  // console.log(`bmarks: ${state.bMarks}, nextline bmark: ${state.bMarks[nextline]}`)
  // console.log(`NEXT LINE: ${nextline}, content: "${src.substring(state.bMarks[nextline], state.eMarks[nextline])}"`)

  const tokenI = state.push('c_html_block_open', key, 1)
  tokenI.markup = `${':'.repeat(level)}${key}`
  tokenI.map = [startline, state.line]

  let oldMax = state.lineMax
  state.lineMax = nextline - 1
  state.line = startline + 1

  // console.log(`DEBUG:: ${startline + 1}, ${nextline}`)

  state.md.block.tokenize(state, startline + 1, nextline) // Tokenize everything inside that block

  state.lineMax = oldMax

  const tokenC = state.push('c_html_block_close', key, -1)
  tokenC.markup = `${':'.repeat(level)}${key}`

  state.line = nextline + 1

  // console.log(`DEBUG:: PST ${JSON.stringify(state.tokens, null, 4)}\n\n`)

  return true
}
