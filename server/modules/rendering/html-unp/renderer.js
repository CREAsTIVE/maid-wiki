/* global WIKI */

module.exports = {
  /** @param {import('cheerio')} $  */
  async init($, config) {
    // 1. Replace direct-child <p> tags with their inner HTML
    $('unp > p').replaceWith(function() {
      return $(this).html()
    })

    // 2. Remove the <unp> wrapper, keeping all its children
    $('unp').replaceWith(function() {
      return $(this).html()
    })
  }
}
