const { Schema, model } = require("mongoose");
const { UserSchema } = require("./User");

const AdmonitionSchema = new Schema({
    tag_id: {
        type: String
    },
    points: Number,
    id_lectora: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: false,
    strict: false,
    versionKey: false
}).add(UserSchema);

module.exports = model("Admonition", AdmonitionSchema)