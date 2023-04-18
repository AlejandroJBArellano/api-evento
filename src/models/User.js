const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
	{
		event_code: String,
		email: String,
		first_name: String,
		last_name: String,
		mobile_number: String,
		badge: String,
	},
	{
		timestamps: true,
		versionKey: false,
		strict: false,
	}
);
UserSchema.index({ "$**": "text" });

module.exports = { UserSchema, User: model("User", UserSchema) };
