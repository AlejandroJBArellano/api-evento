const { Schema, model, Types } = require("mongoose");
const { UserSchema } = require("./User");

const UserTagIdSchema = new Schema(
	{
		user_id: {
			type: String,
			ref: "User",
		},
		tag_id: {
			type: String,
			required: true,
			unique: true,
		},
		delivered: Boolean,
	},
	{
		versionKey: false,
		timestamps: true,
		strict: false,
		collection: "usertagids",
	}
).add(UserSchema);

module.exports = model("UserTagId", UserTagIdSchema);
