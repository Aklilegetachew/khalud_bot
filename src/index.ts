import express, { Request, Response } from "express";
import "./bot";
import pool from "./database";
const app = express();
const port = 4000;
const path = require("path");

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/registration", async (req, res) => {
  try {
    // Query the database to get customer data
    const [rows] = await pool.query(
      `SELECT c.id AS customerId, c.firstName, c.lastName, c.phoneNumber, c.email, c.step, p.id AS productId, p.productDesc, p.modelName, p.imageUrl FROM customers c INNER JOIN products p ON c.productId = p.id;`
    );

    console.log(rows);
    res.render("registration", { data: rows });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).send("Server error");
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
