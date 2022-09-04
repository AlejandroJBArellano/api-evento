const { Schema, model } = require("mongoose");

const CumtomPropertieSchema = new Schema({
    name: String,
    value: Schema.Types.Mixed
}, {_id: false, versionKey: false})

const UserSchema = new Schema({
    event_code: String,
    registered_by_user_id: Number,
    email: String,
    first_name: String,
    identification_img_url: String,
    identification_img_file_name: String,
    last_name: String,
    mobile_number: String,
    badge: String,
    adminuser: String,
    adminpassword: String,
    adminsub: String,
    arrivaldate: String,
    accessdate: String,
    limitdate: String,
    user_role: {
        role: {
            type: String,
            required: true
        }
    },
    organization_role: {
        region: String,
        zona: String,
        distrito: String,
        tienda: String,
        area: String,
        role: String,
    },
    custom_properties: [CumtomPropertieSchema]
}, {
    versionKey: false
});

module.exports = model("User", UserSchema)