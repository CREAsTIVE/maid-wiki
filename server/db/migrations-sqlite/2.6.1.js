exports.up = knex => {
  return knex.schema.table('pages', table => {
    table.text('renderStyleInjection')
  })
}

exports.down = knex => {
  return knex.schema.table('pages', table => {
    table.dropColumn('renderStyleInjection')
  })
}
