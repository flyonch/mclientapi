const { Pool } = require('pg');
const Pg = require("pg");

const pool = new Pool({
  user: process.env.USERDB,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORTDB,
});

const query = (text, params) => {
  return pool.query(text, params);
};

const connect = () => {
  return pool.connect()
}

module.exports = {
  query,
  pool,
  connect,
};


