const express = require('express');
const db = require('../database');

const app = express();
const port = 8080;

app.use(express.json());

app.get('/api/v1/poi', (req, res) => {
  const sql = 'select * from poi';
  const params = [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({'error':err.message});
      return;
    }

    res.json({ 'poi': rows });
  });
});

app.get('/api/v1/history', (req, res) => {
  const sql = 'select * from history';
  const params = [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({'error':err.message});
      return;
    }

    res.json({ 'history': rows });
  });
});

app.post('/api/v1/history', (req, res) => {
  const insert = 'INSERT INTO history (ids, distance, duration) VALUES (?,?,?)';
  db.run(insert, [req.body.ids, req.body.distance, req.body.duration]);
  res.json({ 'result': 'ok' });
});

app.use(express.static('dist/ui'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
