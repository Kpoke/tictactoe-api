import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("username", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.integer("points").defaultTo(0).notNullable();
    table.timestamps(true, true);
    
    // Index for faster leaderboard queries
    table.index("points");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("users");
}
