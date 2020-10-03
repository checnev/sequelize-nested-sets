module.exports = {
  username: process.env.DB_TEST_USER || 'root',
  password: process.env.DB_TEST_PASSWORD || null,
  database: process.env.DB_TEST_DATABASE || 'ns_test',
  host: process.env.DB_TEST_HOST || '127.0.0.1',
  port: process.env.DB_TEST_PORT || 3306,
  pool: {
    max: process.env.DB_TEST_POOL_MAX || 5,
  },
  dialect: process.env.DB_TEST_DIALECT || 'mysql',
  logging: false,
};
