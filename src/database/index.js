const {Pool} = require('pg');
const {database} = require('../config/options.json');

const pool = new Pool({
	user: database.user,
	host: database.host,
	database: database.db,
	password: database.password,
	port: database.port
});

module.exports = {
	query: (text, params) => pool.query(text, params)
};