const { Router } = require("express"),
app = Router();

app.get("/", (req, res) => {
    const hola = "Hola mundo"
    res.json(hola)
})

module.exports = app;