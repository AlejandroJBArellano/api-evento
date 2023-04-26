require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const router = require("./app");
const cors = require("cors");

// Inicializators

app = express();
require("./database");

//require("./exportingDatabase/getExhibitors.js")

// Settings
app.set("port", process.env.PORT);

// Middleweares
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(
	cors({
		origin: "*",
	})
);

//Routes
app.use(router);

app.listen(app.get("port"), (_) =>
	console.log(`server on port ${app.get("port")}`)
);
