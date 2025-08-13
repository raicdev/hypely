import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).type("text/plain").send("Hello World");
});

app.listen(3000, () => {
  console.log("Express server running on http://localhost:3000");
});
