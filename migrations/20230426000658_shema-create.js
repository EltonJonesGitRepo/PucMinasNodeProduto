/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("produtos", function (table) {
      table.increments("id").primary();
      table.string("descricao",128);
      table.decimal("valor");
      table.string("marca",128);
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists("produtos");
};
