import Knex from 'knex';
import { Model } from 'objection';
import knexFile from '../knexfile';

// Initialize knex.
export const knex = Knex(knexFile[process.env.NODE_ENV]);

Model.knex(knex);

export async function initializeDatabase() {
  await knex.migrate.latest();
  console.log('up finished');
}
