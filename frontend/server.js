const express = require("express");
const cors = require("cors");
const { db, initializeTables } = require("./db");

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Simple API Key Authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  // This is a very basic authentication. In production, use a more secure method
  if (apiKey === "school-management-secret-key") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }
};

// Data validation middleware
const validateTeacher = (req, res, next) => {
  const { firstName, lastName, subject, birthDate, position } = req.body;
  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "First name and last name are required" });
  }
  next();
};

const validateStudent = (req, res, next) => {
  const { firstName, lastName, birthDate, gender } = req.body;
  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "First name and last name are required" });
  }
  next();
};

const validateSection = (req, res, next) => {
  const { name, capacity, teacherId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Section name is required" });
  }
  next();
};

// Initialize database tables when server starts
initializeTables()
  .then(() => console.log("Database initialized"))
  .catch((err) => console.error("Database initialization error:", err));

// Routes for teachers
app.get("/api/teachers", apiKeyAuth, async (req, res) => {
  try {
    const sql = "SELECT * FROM teachers WHERE active = 1";
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/teachers/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = "SELECT * FROM teachers WHERE id = ? AND active = 1";
    db.get(sql, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Teacher not found" });
        return;
      }
      res.json(row);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/teachers", apiKeyAuth, validateTeacher, async (req, res) => {
  try {
    const { firstName, lastName, subject, birthDate, position } = req.body;
    const sql = `INSERT INTO teachers (first_name, last_name, subject, birth_date, position) 
                    VALUES (?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [firstName, lastName, subject, birthDate, position],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({
          id: this.lastID,
          firstName,
          lastName,
          subject,
          birthDate,
          position,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/teachers/:id", apiKeyAuth, validateTeacher, async (req, res) => {
  try {
    const { firstName, lastName, subject, birthDate, position } = req.body;
    const sql = `UPDATE teachers 
                    SET first_name = ?, last_name = ?, subject = ?, birth_date = ?, position = ?
                    WHERE id = ?`;

    db.run(
      sql,
      [firstName, lastName, subject, birthDate, position, req.params.id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: "Teacher not found" });
          return;
        }
        res.json({ changes: this.changes });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/teachers/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = "UPDATE teachers SET active = 0 WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Teacher not found" });
        return;
      }
      res.json({ changes: this.changes });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes for students
app.get("/api/students", apiKeyAuth, async (req, res) => {
  try {
    const sql = "SELECT * FROM students WHERE active = 1";
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/students/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = "SELECT * FROM students WHERE id = ? AND active = 1";
    db.get(sql, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json(row);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/students", apiKeyAuth, validateStudent, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, gender } = req.body;
    const sql = `INSERT INTO students (first_name, last_name, birth_date, gender) 
                    VALUES (?, ?, ?, ?)`;

    db.run(sql, [firstName, lastName, birthDate, gender], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        firstName,
        lastName,
        birthDate,
        gender,
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/students/:id", apiKeyAuth, validateStudent, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, gender } = req.body;
    const sql = `UPDATE students 
                    SET first_name = ?, last_name = ?, birth_date = ?, gender = ?
                    WHERE id = ?`;

    db.run(
      sql,
      [firstName, lastName, birthDate, gender, req.params.id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: "Student not found" });
          return;
        }
        res.json({ changes: this.changes });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/students/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = "UPDATE students SET active = 0 WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({ changes: this.changes });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes for sections
app.get("/api/sections", apiKeyAuth, async (req, res) => {
  try {
    const sql = `
      SELECT s.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name 
      FROM sections s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      WHERE s.active = 1
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/sections/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = `
      SELECT s.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name 
      FROM sections s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      WHERE s.id = ? AND s.active = 1
    `;
    db.get(sql, [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Section not found" });
        return;
      }
      res.json(row);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sections", apiKeyAuth, validateSection, async (req, res) => {
  try {
    const { name, capacity, teacherId } = req.body;
    const sql = `INSERT INTO sections (name, capacity, teacher_id) 
                    VALUES (?, ?, ?)`;

    db.run(sql, [name, capacity || 30, teacherId], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        name,
        capacity: capacity || 30,
        teacherId,
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/sections/:id", apiKeyAuth, validateSection, async (req, res) => {
  try {
    const { name, capacity, teacherId } = req.body;
    const sql = `UPDATE sections 
                    SET name = ?, capacity = ?, teacher_id = ?
                    WHERE id = ?`;

    db.run(
      sql,
      [name, capacity || 30, teacherId, req.params.id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: "Section not found" });
          return;
        }
        res.json({ changes: this.changes });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/sections/:id", apiKeyAuth, async (req, res) => {
  try {
    const sql = "UPDATE sections SET active = 0 WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Section not found" });
        return;
      }
      res.json({ changes: this.changes });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
