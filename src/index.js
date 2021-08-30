require("dotenv").config()

const express = require("express"),
morgan = require("morgan"),
router = require("./app"),

// Inicializators

app = express();
require("./database")

// Settings
app.set("port", process.env.PORT)

// Middleweares
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended:false }))

//Routes
app.use(router)

app.listen(app.get("port"), _=>console.log(`server on port ${app.get("port")}`));