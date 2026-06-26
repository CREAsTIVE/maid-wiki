module.exports = {
  init (md, conf) {
    md.use(chtmlBlockPlugin)
  }
}

/*
So this plugin basicly parses html by its own (instead default html parser), BUT

1) elements should have "md" tag at the end (<element ... md>)
2) open and closing tags should be on separate lines, i. e.:
```
<element md>
CONTENT
</element>

<!-- WILL NOT WORK: -->
<element md> CONTENT </element>

3) All content of elements is parsed by markdown properly
  (and usually putted into <p> tags, what should be fixed through styles)
```

*/
function chtmlBlockPlugin(md) {
  md.block.ruler.before('html_block', 'chtmlblock', chtmlBlockProcessor)
}

// That shit is so broken i commented everything for it to make sens for me
// God i hate markdown-it parsing system

/**
 * @param {import("markdown-it/lib/rules_block/state_block")} state
 * @param {number} startline
 * @param {number} endline
 * @param {boolean} silent
 */
function chtmlBlockProcessor(state, startline, endline, silent) {
  let initPos = state.bMarks[startline] + state.tShift[startline]
  let pos = initPos
  let max = state.eMarks[startline]

  /** @type {string} */
  let src = state.src

  /** @param {string} inp */
  function ensure(inp) {
    let res = src.startsWith(inp, pos)
    console.log(`DEBUG: ensure(${inp}) {${src.substring(pos, pos + 5).replace('\n', '\\n')}...} -> ${res}`)
    if (res) {
      pos += inp.length
    }
    return res
  }

  // 1) Read "<"
  if (!ensure('<')) { return false }

  pos = state.skipSpaces(pos)

  // 2) Read any sequence of letter and other shit
  let key = ''
  {
    let ch = src.charAt(pos)
    while ('qwertyuiopasdfghjklzxcvbnm_-'.indexOf(ch) !== -1) {
      key += ch
      ch = src.charAt(++pos)
    }
  }

  pos = state.skipSpaces(pos)

  // 3) Tags (i m too lazy for that, no one will use it anyway)

  // 4) Read "md\s*>"
  // actually instead of checking it at the end
  // i should properly parse properties and check and other bs, but whatever

  if (!ensure('md')) { return false }
  pos = state.skipSpaces(pos)
  if (!ensure('>')) { return false }
  pos = state.skipSpaces(pos)

  // Check if we didnt get out of current line
  // OR
  // didnt get to the end of the line (what means there more user content what is bad)
  // (cause this shitty markdown-it parser is shit what the fuck is that)
  if (pos !== max) { return false }

  if (silent) { return true } // Exit if just validating

  let closeToken = `</${key}>`

  let nextline = startline + 1
  while (src.substring(state.bMarks[nextline], state.eMarks[nextline]).trim() !== closeToken && nextline <= endline) {
    nextline += 1
  }
  console.log(`startline: ${startline}, nextline: ${nextline}`)

  const tokenI = state.push('c_html_block_open', key, 1)
  tokenI.markup = `<${key} md>`
  tokenI.map = [startline, state.line]

  // Weird shit to serialize children blocks
  let oldMax = state.lineMax
  state.lineMax = nextline - 1
  state.line = startline + 1

  state.md.block.tokenize(state, startline + 1, nextline) // Tokenize everything inside that block

  // Restore some state
  state.lineMax = oldMax

  const tokenC = state.push('c_html_block_close', key, -1)
  tokenC.markup = closeToken

  state.line = nextline + 1

  return true
}
