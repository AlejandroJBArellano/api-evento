const mongoose = require("mongoose"), URI = require("./keys");

mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(db => console.log(`database connected on ${URI}`))
    .catch(err => console.error(err))