const { User } = require("../models/User");
const UserTagId = require("../models/UserTagId");
const diacriticSensitiveRegex = require("../utils/diacriticSensitiveRegex");

const attendeesMethods = {
	get: async (req, res) => {
		try {
			console.log("req.query", req.query);
			//TODO: paginationOptions = req.query
			//TODO: searchParameters = req.query
			const paginationQueries = [
				"skip",
				"limit",
				"searchComposite",
				"_id",
				"createdAt",
				"updatedAt",
				"countTagId",
			];
			const queriesNotToRegExp = ["_id", "qr_code"];
			const query = {};

			Object.entries(req.query).forEach((key) => {
				const field = key[0];
				if (queriesNotToRegExp.includes(field)) {
					query[field] = req.query[field];
					return;
				}
				if (paginationQueries.includes(field)) return;
				if (Array.isArray(req.query[field])) {
					query[field] = {
						$in: req.query[field],
					};
					return;
				}
				const value = diacriticSensitiveRegex(req.query[field]);
				if (value.length > 0) {
					const regexp = new RegExp(value, "i");
					console.log(regexp);
					query[field] =
						field === "badge" ? req.query[field] : regexp;
				}
			});
			console.log("query", query);

			const { skip, limit, searchComposite } = req.query;

			if (searchComposite?.length) {
				const event = await Event.findOne();

				const valueDiacritic = diacriticSensitiveRegex(
					searchComposite,
					"i"
				);
				const orQuery = event._doc.tableColumnNames
					.map((e) => e.field)
					.filter((key) => !paginationQueries.includes(key))
					.map((key) => ({ [key]: new RegExp(valueDiacritic, "i") }));
				console.log("orQuery for searchComposite ");
				console.table(orQuery);

				const queryMongo = {
					$or: orQuery,
				};

				const users = await User.find(queryMongo)
					.skip(skip)
					.limit(limit);
				const count = await User.count(queryMongo);

				const users_ids = users?.map((user) =>
					user?._doc?._id.toString()
				);
				const tag_ids = await UserTagId.find(
					{
						user_id: {
							$in: users_ids,
						},
					},
					"tag_id user_id updatedAt delivered"
				);

				// console.log("tag ids searchComposite", tag_ids)

				const usersWithTagId = users.map((user) => {
					const userTagIds = tag_ids.filter((userTagId) => {
						return userTagId.user_id === user._id.toString();
					});

					const hasSomeDeliveredTag = userTagIds.some(
						(userTagId) => userTagId.delivered
					);

					return {
						...user._doc,
						countTagId: userTagIds.length,
						delivered: hasSomeDeliveredTag,
						lastTagCreatedAt: new Date(
							userTagIds.reduce(
								(acc, curr) =>
									new Date(acc) > new Date(curr.updatedAt)
										? new Date(acc)
										: new Date(curr.updatedAt),
								undefined
							)
						),
					};
				});

				return res.json({
					data: usersWithTagId,
					searchComposite,
					success: true,
					count,
				});
			}

			const users = await User.find(query, {}, { skip, limit });

			const users_ids = users?.map((user) => user?._doc?._id.toString());

			const tag_ids = await UserTagId.find(
				{
					user_id: {
						$in: users_ids,
					},
				},
				"tag_id user_id delivered updatedAt"
			);

			const usersWithTagId = users.map((user) => {
				const userTagIds = tag_ids.filter((userTagId) => {
					return userTagId.user_id === user._id.toString();
				});

				const hasSomeDeliveredTag = userTagIds.some(
					(userTagId) => userTagId.delivered
				);

				return {
					...user._doc,
					countTagId: userTagIds.length,
					delivered: hasSomeDeliveredTag,
					lastTagCreatedAt: new Date(
						userTagIds.reduce(
							(acc, curr) =>
								new Date(acc) > new Date(curr.updatedAt)
									? new Date(acc)
									: new Date(curr.updatedAt),
							undefined
						)
					),
				};
			});

			const usersFinal = usersWithTagId.filter((attendee) => {
				if (Array.isArray(req.query.countTagId)) {
					return req.query.countTagId.includes(attendee.countTagId);
				} else {
					if (req.query.countTagId >= 2) {
						return attendee.countTagId >= 2;
					}
					return req.query.countTagId == attendee.countTagId;
				}
			});

			const count = await User.count(query);
			res.status(200).json({
				data: req.query.countTagId ? usersFinal : usersWithTagId,
				success: true,
				count,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				error,
				success: false,
			});
		}
	},
};

module.exports = attendeesMethods;
