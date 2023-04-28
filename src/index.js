require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const router = require("./app");
const cors = require("cors");

// Inicializators

app = express();
const originalSend = app.response.send;
require("./database");

//require("./exportingDatabase/getExhibitors.js")

// Settings
app.set("port", process.env.PORT);

morgan.token("body", (req, res) => `req.body-${JSON.stringify(req.body)}`);
morgan.token(
	"queryParam",
	(req, res) => `req.query-${JSON.stringify(req.query)}`
);

app.response.send = function sendOverWrite(body) {
	originalSend.call(this, body);
	this.__custombody__ = body;
};

morgan.token("res-body", (_req, res) => JSON.stringify(res.__custombody__));
morgan.token("user", (req, _res) => `user-${req.cookies?.["user"]}`);

// Middlewearesp
app.use(
	morgan(function (tokens, req, res) {
		return [
			tokens.method(req, res),
			tokens.url(req, res),
			tokens.status(req, res),
			tokens.body(req, res),
			tokens.queryParam(req, res),
			tokens.user(req, res),
			tokens["res-body"](req, res),
			tokens["response-time"](req, res),
			"ms",
		].join(" ");
	})
);

app.use((req, res, next) => {
	console.log(res.body);
	next();
});

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
