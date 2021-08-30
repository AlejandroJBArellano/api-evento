require("dotenv").config()
const { HOST, DATABASE, URI } = process.env

const URIDatabase = `${URI}`

module.exports = URIDatabase