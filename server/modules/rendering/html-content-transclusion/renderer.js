/* global WIKI */

module.exports = {
  /** @param {import('cheerio')} $
   * @param {string[]} pageCSSInjections
    */
  async init($, config, pageCSSInjections) {
    const includes = $('include').toArray()

    // Yes, i know that getPage already caches everything i need
    // And its probably enough, BUT
    // I mainly do that to prevent duplication of style injections
    let pageCache = {}

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
            <property name="param3">Third parameter</property>
          </include>
        results in:
          properties.param2 = "<bold>bold text</bold>, image: <img src='/utils/someimg.png'/>"
      */
      const $e = $(e)
      $e.children().each((i, child) => {
        // child is a DOM element (nodeType 1)
        let tag = child.tagName
        const innerHtml = $(child).html()

        if (tag === 'property' && child.attribs.name) {
          tag = child.attribs.name
        }

        if (innerHtml !== null) {
          properties[tag] = innerHtml
        }
      })

      // Skip if essential parameters are missing
      if (!path || !locale) continue

      // Fetch the target page
      let pageData

      if (path in pageCache) {
        pageData = pageCache[path]
      } else {
        pageData = {
          page: await WIKI.models.pages.getPage({
            path: path,
            locale: locale
          }),
          init: false
        }

        pageCache[path] = pageData
      }

      let page = pageData.page

      let isSource = 'source' in e.attribs && e.attribs.source !== 'false'

      if (!(page && (page.render || isSource))) continue

      // Initialize only one time and only if its renderer used atleast once
      if (!isSource && !pageData.init) {
        pageCSSInjections.push(page.renderStyleInjection)

        pageData.init = true
      }

      let content = isSource ? page.content : page.render

      for (const [key, value] of Object.entries(properties)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), () => value)
      }

      $e.replaceWith(content)
    }
  }
}
