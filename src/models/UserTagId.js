const { Schema, model } = require("mongoose");
const { UserSchema } = require("./User");

const UserTagIdSchema = new Schema({
    user_id:String,
    tag_id: {
        type: String,
        required: true,
        unique: true
    },
}, {
    versionKey: false,
    timestamps: true,
    strict: false
}).add(UserSchema)

module.exports = model("UserTagId", UserTagIdSchema)