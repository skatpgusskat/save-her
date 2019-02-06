
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('torrents', table => {
      table.increments('id').notNullable().primary();
      table.string('infoHash').notNullable().unique();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    })
    .createTable('files', table => {
      table.increments('id').notNullable().primary();
      table
      .integer('torrentId')
      .unsigned()
      .references('id')
      .inTable('torrents');
      table.string('name').notNullable();
      table.string('filePath').notNullable().unique();
      table.string('s3Key').notNullable().unique();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('files')
    .dropTableIfExists('torrents');
};
