const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(bodyParser.json());

//Указание пути
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});
//Создание базы данных и таблиц objects и lines
const db = new sqlite3.Database('database.sqlite3');
db.run(`CREATE TABLE IF NOT EXISTS objects (
  id TEXT PRIMARY KEY,
  linkedtp TEXT,
  type TEXT,
  lat REAL,
  lng REAL
)`);
db.run(`CREATE TABLE IF NOT EXISTS lines (
  id INTEGER PRIMARY KEY,
  from_id TEXT,
  to_id TEXT,
  linkedtp TEXT,
  type TEXT,
  start_lat REAL,
  start_lng REAL,
  end_lat REAL,
  end_lng REAL
)`);
db.run(`CREATE TABLE IF NOT EXISTS poles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pole_number TEXT,
  pole_type TEXT CHECK(pole_type IN ('дерево+ж/б', 'железобетон', 'сталь сварная', 'круг конический', 'восьмигранная коническая')),
  pole_date DATE,
  pole_condition TEXT CHECK(pole_condition IN ('отличное', 'хорошее', 'удовлетворительное', 'требуется покраска', 'нет крышки', 'плохое', 'отсутствует')),
  cronshtain INTEGER CHECK(cronshtain IN ('1', '2', '3', '4')),
  light_type TEXT CHECK(light_type IN ('РКУ 250', 'РКУ 400', 'LED 100', 'LED 150')),
  light_condition TEXT CHECK(light_condition IN ('отличное', 'хорошее', 'удовлетворительное', 'разбитое', 'нет крышки', 'плохое', 'отсутствует')),
  wire_type TEXT CHECK(wire_type IN ('Кабель', 'СИП', 'Воздушная линия', 'Провод')),
  joint_suspension TEXT,
  joint_advertisement TEXT,
  camera_sergek INTEGER,
  notes TEXT
)`);
let objects = [];


//Метод GET запроса для отображения объектов на карте
app.get('/objects', (req, res) => {
  db.all('SELECT * FROM objects', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка получения информации об объектах с БД');
    } else {
      res.json(rows.map(row => ({
        id: row.id,
        linkedtp: row.linkedtp,
        type: row.type,
        lat: row.lat,
        lng: row.lng
      })));
    }
  });
});

//Метод POST запроса для добавления объекта в БД
app.post('/objects', (req, res) => {
  const { id, linkedtp, type, lat, lng } = req.body;
  const stmt = db.prepare('INSERT INTO objects (id, linkedtp, type, lat, lng) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, linkedtp, type, lat, lng, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка добавления в БД');
    } else {
      console.log(`Объект ${id} добавлен в БД`);
      res.sendStatus(200);
    }
    stmt.finalize();
  });
});

//Метод DELETE запроса для удаления объекта
app.delete('/objects/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM objects WHERE id = ?', id, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка удаления объекта из БД');
    } else {
      console.log(`объект ${id} успешно удален из БД`);
      // Также удаления связанных с объектом линий
      db.run('DELETE FROM lines WHERE from_id = ? OR to_id = ?', [id, id], (err) => {
        if (err) {
          console.error(err.message);
        }
      });
      res.sendStatus(200);
    }
  });
});


//Метод GET для отображения всех линий
app.get('/lines', (req, res) => {
  db.all('SELECT * FROM lines', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка получения информации из БД');
    } else {
      res.json(rows.map(row => ({
        id: row.id,
        from_id: row.from_id,
        to_id: row.to_id,
        linkedtp: row.linkedtp,
        type: row.type,
        start_lat: row.start_lat,
        start_lng: row.start_lng,
        end_lat: row.end_lat,
        end_lng: row.end_lng
      })));
    }
  });
});

//Метод POST запроса для создания линии
app.post('/lines', (req, res) => {
  const { from_id, to_id, linkedtp, type, start_lat, start_lng, end_lat, end_lng} = req.body;
  const query = `INSERT INTO lines (from_id, to_id, linkedtp, type, start_lat, start_lng, end_lat, end_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [from_id, to_id, linkedtp, type, start_lat, start_lng, end_lat, end_lng], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Ошибка добавления линии в БД');
    } else {
      const lineId = this.lastID;
      console.log(`Линия ${lineId} добавлена успешно`);
      res.status(200).send({ lineId });
    }
  });
});

// Метод DELETE запроса для удаления линии
app.delete('/lines/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM lines WHERE id = ?', id, (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(`Ошибка удаления линии ${id} из БД`);
    } else {
      console.log(`Линия ${id} успешно удалена из БД`);
      res.sendStatus(200);
    }
  });
});

//Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
