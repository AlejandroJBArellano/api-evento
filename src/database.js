const mongoose = require("mongoose"), URI = require("./keys");

console.log(`database connecting to ${URI}`)
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(db => console.log(`database connected on ${URI}`))
    .catch(err => console.error("error",err))