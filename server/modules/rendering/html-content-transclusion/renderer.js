/* global WIKI */

module.exports = {
  /** @param {import('cheerio')} $
   * @param {string[]} pageCSSInjections
    */
  async init($, config, pageCSSInjections) {
    const includes = $('include').toArray()
    for (const e of includes) {
      let path = e.attribs.path
      let locale = e.attribs.locale ?? config.defaultLocale

      /** @type {{[name: string]: string}} */
      let properties = { ...e.attribs }

      /*
        Add inner HTML of direct child elements as properties.
        Example:
          <include path='/utils/some-element' param1='PAGE N'>
            <param2>
              <bold>bold text</bold>, image: <img src='/utils/someimg.png'/>
            </param2>
          </include>
        results in:
          properties.param2 = "<bold>bold text</bold>, image: <img src='/utils/someimg.png'/>"
      */
      const $e = $(e)
      $e.children().each((i, child) => {
        // child is a DOM element (nodeType 1)
        const tag = child.tagName
        const innerHtml = $(child).html()
        if (innerHtml !== null) {
          properties[tag] = innerHtml
        }
      })

      // Skip if essential parameters are missing
      if (!path || !locale) continue

      // Fetch the target page
      let page = await WIKI.models.pages.getPage({
        path: path,
        locale: locale
      })

      if (!page || !page.render) continue

      let content = page.render

      for (const [key, value] of Object.entries(properties)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), () => value)
      }

      $e.replaceWith(content)

      pageCSSInjections.push(page.renderStyleInjection)
    }
  }
}
