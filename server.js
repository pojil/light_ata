const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();

// прописаия адреса к БД
app.use(express.static(__dirname + '/public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

//подключение к БД и создание таблицы если таковой еще нет
const db = new sqlite3.Database('database.sqlite3');
db.run(`CREATE TABLE IF NOT EXISTS objects (
  id INTEGER PRIMARY KEY,
  type TEXT,
  lat REAL,
  lng REAL
)`);

let objects = [];

// парсим JSON-запросы
app.use(bodyParser.json());

//метод для отпрвки уже имеющихся данных клиенту
app.get('/objects', (req, res) => {
  db.all('SELECT * FROM objects', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка получения данных из Базы Данных');
    } else {
      res.json(rows.map(row => ({
        id: row.id,
        type: row.type,
        lat: row.lat,
        lng: row.lng
      })));
    }
  });
});

//метод для добавления полученных от клиента данных в БД
app.post('/objects', (req, res) => {
  const {id, type, lat, lng } = req.body;
  const stmt = db.prepare('INSERT INTO objects (id, type, lat, lng) VALUES (?, ?, ?, ?)');
  stmt.run(id, type, lat, lng, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка добавления в Базу Данных');
    } else {
      console.log(`Объект добавлен в Базу Данных с ID ${id}`);
      res.sendStatus(200);
    }
    stmt.finalize();
  });
});

// удаление объекта
app.delete('/objects/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM objects WHERE id = ?', id, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка удаления объекта из Базы Данных');
    } else {
      console.log(`Объект ${id} удален из Базы Данных`);
      res.sendStatus(200);
    }
  });
});



//запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
