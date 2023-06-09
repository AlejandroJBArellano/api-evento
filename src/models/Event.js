const { Schema, model } = require("mongoose");

const EventSchema = new Schema({
	event_title: {
		type: String,
		required: true,
	},
	organization_role_for_table: [
		{
			field: String,
		},
	],
	tableColumnNames: [
		{
			field: String,
			title: String,
		},
	],
});
module.exports = model("Event", EventSchema);
