const { Schema, model } = require("mongoose");

const ConfigTagSchema = new Schema({
    tag_id: String,
    cmd: String
})

module.exports = model("ConfigTags", ConfigTagSchema)
