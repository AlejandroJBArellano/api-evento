const { Schema, model } = require("mongoose");
const { UserSchema } = require("./User");

const CumtomPropertieSchema = new Schema({
    name: String,
    value: Schema.Types.Mixed
}, {_id: false, versionKey: false})

const EntranceControl = new Schema({
    tag_id: String,
    user_id:String,
    id_lectora: String,
    event_type: String,
    created: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: false,
    versionKey: false,
    strict: false
}).add(UserSchema);

module.exports = model("EntranceControl", EntranceControl)