const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
app.use(require("morgan")("dev"));
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);

const PORT = process.env.PORT || 3005;

app.get("/", async (req, res, next) => {
  res.send("home");
});

app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `SELECT * from notes ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
            INSERT INTO notes(ranking, txt)
            VALUES($1, $2)
            RETURNING *
        `;
    const response = await client.query(SQL, [req.body.ranking, req.body.txt]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
                    UPDATE notes
                    SET ranking = $1, txt = $2
                    WHERE id = $3;
                `;
    const response = await client.query(SQL, [
      req.body.ranking,
      req.body.txt,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
                    DELETE from notes WHERE id = $1;  
                `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
  await client.connect();
  let SQL = `
        DROP TABLE IF EXISTS notes;
CREATE TABLE notes(
id SERIAL PRIMARY KEY,
created_at TIMESTAMP DEFAULT now(),
updated_at TIMESTAMP DEFAULT now(),
ranking INTEGER DEFAULT 3 NOT NULL,
txt VARCHAR(255) NOT NULL
);
      `;
  // await client.query(SQL);
  SQL = `
        INSERT INTO notes(txt, ranking) VALUES('learn express', 5);
        INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4);
        INSERT INTO notes(txt, ranking) VALUES('create routes', 2);
      `;
  //await client.query(SQL);
  console.log("We just seeded out database");
};

init();
