
exports.up = function (knex, Promise) {
  return knex.schema
    .createTable('users', table => {
      table.increments('id').notNullable().primary();
      table.string('username').notNullable().unique();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    })
    .createTable('identities', table => {
      table.string('id').primary();
      table
        .integer('userId')
        .unsigned()
        .references('id')
        .inTable('users');
      table.string('origin').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    })
    .createTable('torrents', table => {
      table.increments('id').notNullable().primary();
      table.string('name').notNullable().unique();
      table.string('infoHash').notNullable().unique();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    })
    .createTable('usersTorrents', table => {
      table
        .integer('userId')
        .unsigned()
        .references('id')
        .inTable('users');
      table
        .integer('torrentId')
        .unsigned()
        .references('id')
        .inTable('torrents');
    })
};

exports.down = function (knex, Promise) {
  return knex.schema
    .dropTable('usersTorrents')
    .dropTable('identities')
    .dropTable('torrents')
    .dropTable('users')
};
