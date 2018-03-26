const express = require('express');
const router = express.Router();
const database = require('../database');

router.get('/', (req, res) => res.send('Server API working'));

router.post('/registrationUser', async (req, res) => {
	const {userId} = req.body;
	const {rows} = await database.query(
		'INSERT INTO users (user_id) VALUES ($1) RETURNING id',
		[userId]
	);

	res.json({id: rows[0].id});
});

router.post('/checkUser', async (req, res) => {
	const {userId} = req.body;
	const {rows} = await database.query('SELECT id FROM users WHERE user_id = $1', [userId]);

	if (rows.length < 1) {
		res.json({status: false});
	} else {
		res.json({status: true});
	}
});

router.post('/getIndex', async (req, res) => {
	const {userId} = req.body;
	const {rows} = await database.query(
		'SELECT index, is_done, variant FROM survey WHERE user_id = $1',
		[userId]
	);

	if (rows.length < 1) {
		res.json({
			index: 1,
			variant: 0
		});
	} else {
		const [{index, is_done, variant}] = rows;

		res.json({
			index,
			is_done,
			variant
		});
	}
});

router.post('/addIndex', async (req, res) => {
	const {userId} = req.body;
	const {rows} = await database.query('INSERT INTO survey (user_id) VALUES ($1) RETURNING id', [userId]);

	res.json({id: rows[0].id});
});

router.post('/updateIndex', async (req, res) => {
	const {userId, index} = req.body;
	const {rows} = await database.query(
		'UPDATE survey SET index = $1 WHERE user_id = $2 RETURNING index',
		[index, userId]
	);

	res.json({status: rows[0].index});
});

router.post('/doneSurvey', async (req, res) => {
	const {userId} = req.body;
	const {rows} = await database.query('UPDATE survey SET is_done = $1 WHERE user_id = $2 RETURNING id', [true, userId]);

	res.json({status: rows[0].id});
});

router.post('/addAnswer', async (req, res) => {
	const {userId, index, message, variant} = req.body;
	const {rows} = await database.query(
		'INSERT INTO answers (user_id, question_id, message, variant) VALUES ($1, $2, $3, $4) RETURNING id',
		[userId, index, message, variant]
	);

	res.json({index: rows[0].id});
});

router.post('/getQuestion', async (req, res) => {
	const {index, variant} = req.body;

	if (index === 1) {
		const {rows: [{title}]} = await database.query(
			'SELECT title FROM general WHERE id = $1',
			[index]
		);

		const {rows: [{variants}]} = await database.query(
			'SELECT variants FROM buttons WHERE question_id = $1',
			[index]
		);

		res.json({
			title,
			variants
		});
	} else {
		const {rows: question} = await database.query(`SELECT title FROM variant${variant} WHERE id = $1`, [index - 1]);

		if (question.length < 1) {
			res.json({title: 0});
		} else {
			res.json({title: question[0].title});
		}
	}
});

router.post('/changeVariant', async (req, res) => {
	const {userId, variant} = req.body;
	const {rows} = await database.query(
		'UPDATE survey SET variant = $1 WHERE user_id = $2 RETURNING id',
		[variant, userId]
	);

	res.json({status: rows[0].id});
});

router.post('/getAnswer', async (req, res) => {
	const {userId, variant} = req.body;
	const {rows: user} = await database.query('SELECT user_id FROM users WHERE is_admin = $1', [true]);
	const {rows: general} = await database.query(`
		SELECT title, message FROM answers INNER JOIN general ON (
		answers.question_id = general.id AND answers.user_id = $1 AND answers.variant = $2
		)`,
		[userId, 0]
	);

	const {rows: answer} = await database.query(
		`SELECT title, message
		FROM answers
		INNER JOIN variant${variant} ON (
		answers.question_id = variant${variant}.id AND answers.user_id = $1 AND
		answers.variant = $2
		)`,
		[userId, variant]
	);

	if (user.length < 1) {
		res.json({answer: 0});
	} else {
		res.json({
			users: user,
			answers: general.concat(answer)
		});
	}
});

module.exports = router;