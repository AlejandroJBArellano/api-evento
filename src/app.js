const { Router } = require("express");
const app = Router();

const axios = require("axios");
const getExhibitors = require("./exportingDatabase/getExhibitors");
const getUsers = require("./exportingDatabase/getUsers");
const questionnairesMethods = require("./handlers/questionnaires");
// Models
const { User } = require("./models/User");
const ConfigEntrance = require("./models/ConfigEntrance");
const ConfigTags = require("./models/ConfigTags");
const Impresora = require("./models/Impresora");
const Lectora = require("./models/Lectora");
const UserTagId = require("./models/UserTagId");
const EntranceControl = require("./models/EntranceControl");
const Admonition = require("./models/Admonition");
const Recorder = require("./models/Recorder");
const Answers = require("./models/Answers");
const Event = require("./models/Event");
const ReplacementReason = require("./models/ReplacementReason");
const diacriticSensitiveRegex = require("./utils/diacriticSensitiveRegex");
const { user } = require("./exportingDatabase/keys");
const XLSX = require("xlsx");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fs = require("fs");
const { parse } = require("csv-parse");
const { Readable } = require("stream");

// Messages
const message = "Success";

let membershipsTypes = [];
let ticketTypes = [];

app.get("/", async (req, res) => {
	const events = await Event.find();
	res.status(200).json(events[0]);
});

app.get("/config-tags", async (req, res) => {
	const config = await ConfigTags.find();
	res.json(config);
});

app.post("/new-user", async (req, res) => {
	try {
		console.log("New User: req.body", req.body);
		const searchComposite = Object.values(req.body).join(" ");
		const newUser = new User(req.body);
		newUser.searchComposite = searchComposite;
		console.log(newUser);
		await newUser.validate();
		await newUser.save();
		res.json({ message: "success", ...newUser._doc });
	} catch (error) {
		console.log(error);
		res.status(500).json({
			mensaje: "Ocurrió un error. Vuelve a intentarlo",
		});
	}
});

app.get("/users", async (req, res) => {
	try {
		let query = {};
		if (req.query.user_id && req.query.user_id.length > 0) {
			query["_id"] = req.query.user_id;
			console.log(query, query);
		}
		Object.entries(req.query).forEach((key) => {
			const field = key[0];
			const value = diacriticSensitiveRegex(req.query[field]);
			if (value.length > 0) {
				const regexp = new RegExp(value, "i");
				console.log(regexp);
				query[field] = regexp;
			}
		});
		console.log("req.query", req.query);
		console.log("query", query);

		const users = await User.find(query);
		console.log("users", users.length);
		const users_ids = users?.map((user) => user?._doc?._id.toString());
		let tag_ids = [];
		if (users?.length < 2000) {
			tag_ids = await UserTagId.find(
				{
					user_id: {
						$in: users_ids,
					},
				},
				"tag_id user_id"
			);
		}
		console.log("tag_ids", tag_ids.length);
		const usersWithTagId = users.map((user) => {
			return {
				...user._doc,
				countTagId: tag_ids.filter((userTagId) => {
					return userTagId.user_id === user._id;
				}).length,
			};
		});
		res.status(200).json(usersWithTagId);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({
			mensaje: "Ocurrió un error. Vuelve a intentarlo",
			error,
		});
	}
});

app.get("/user/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		// If not user found, it returns an empty object
		if (!user) {
			res.json({});
			return;
		}

		res.json(user);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({
			mensaje: "Ocurrió un error. Vuelve a intentarlo",
		});
	}
});

app.put("/user/:id", async (req, res) => {
	try {
		User.findByIdAndUpdate(req.params.id, req.body, {
			returnDocument: "after",
		})
			.then((e) => res.json(e).status(200))
			.catch((err) => res.json(err).status(500));
	} catch (error) {
		res.json(error).status(500);
	}
});

app.post("/tag_id-user", async (req, res) => {
	try {
		const { id: user_id, ...body } = req.body;

		console.log("body", req.body);
		const attendee = await User.findById(user_id);

		if (!attendee) {
			res.status(400).json({
				error: {
					message: "Attendee not found",
				},
				success: false,
			});
		}

		const attendeeWithoutId = Object.keys(attendee._doc).reduce(
			(obj, k) => {
				if (k !== "_id") obj[k] = attendee[k];
				return obj;
			},
			{}
		);

		const newBadgeBonding = new UserTagId({
			...body,
			...attendeeWithoutId,
			user_id,
			createdAt: new Date(),
		});

		console.log("newBadgeBonding", newBadgeBonding);
		await newBadgeBonding.save();
		const tag_ids = await UserTagId.find({ user_id });
		res.json({
			...newBadgeBonding._doc,
			countTagId: tag_ids.length,
			lastTagCreatedAt: newBadgeBonding.toObject().createdAt,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			error,
			success: false,
		});
	}
	// try {
	//     User.findById(req.body.id)
	//         .then(async (respuesta) => {
	//             if(respuesta){
	//                 var target = {};
	//                 //TODO: not user found
	//                 for (var i in respuesta._doc) {
	//                     if (["_id"].indexOf(i) >= 0) continue;
	//                     if (!Object.prototype.hasOwnProperty.call(respuesta._doc, i)) continue;
	//                     target[i] = respuesta._doc[i];
	//                 }

	//                 const newUserTagId = new UserTagId({
	//                     tag_id: req.body.tag_id,
	//                     user_id:respuesta._id,
	//                     ...target
	//                 })

	//                 try{
	//                     newUserTagId.tag_id=req.body.tag_id
	//                     console.log("newUserTagId",newUserTagId)
	//                     await newUserTagId.save()
	//                     const tag_ids = await UserTagId.find({user_id: respuesta._id})

	//                     res.json({...newUserTagId._doc,
	//                         countTagId: tag_ids.length
	//                     })
	//                 }catch(err){
	//                     console.log(err)
	//                     res.status(500).json({error:err});
	//                 }
	//             } else {
	//                 const respuesta = {
	//                     tag_id: req.body.tag_id,
	//                     user_id: "_desconocido",
	//                     first_name: "_desconocido",
	//                     last_name: "_desconocido",
	//                     badge: ""
	//                 }
	//                 try {
	//                     const newUserTagId = new UserTagId(respuesta);
	//                     await newUserTagId.save()
	//                     res.json(newUserTagId)
	//                     return;
	//                 } catch (error) {
	//                     console.log(err)
	//                     res.status(500).json(error)
	//                     return;
	//                 }
	//             }
	//         })
	// } catch (error) {
	//     console.log(err)
	//     res.status(500).json(error)
	//     return;
	// }
});

app.get("/tag_id-user", async (req, res) => {
	try {
		const userTagId = await UserTagId.findOne({
			tag_id: req.query.tag_id,
		});
		if (!userTagId) {
			return res.json(undefined);
		}
		const user = await User.findById(userTagId.user_id);
		const tags = await UserTagId.find({
			user_id: user._id,
		});
		console.log("tags", tags.length);
		res.json({
			...user.toObject(),
			tags,
			countTagId: tags.length,
		});
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json(error);
		return;
	}
});

app.get("/tag-ids-by-user-id", async (req, res) => {
	try {
		const users = await UserTagId.find({
			user_id: req.query.user_id,
		});

		res.json(users);
		console.log(users);
		return;
	} catch (error) {
		res.json(error);
		return;
	}
});
app.post("/new-entrance-with-date", (req, res) => {
	console.log(req.body);
	try {
		const user = UserTagId.findOne({
			tag_id: req.body.tag_id,
		}).then(async (response) => {
			if (response) {
				const target = {};
				for (const i in response._doc) {
					if (["_id"].indexOf(i) >= 0) continue;
					if (!Object.prototype.hasOwnProperty.call(response._doc, i))
						continue;
					target[i] = response._doc[i];
				}
				// TODO: one method for entrance and handling the created just if the body contains it
				const newEntrance = new EntranceControl({
					...target,
					id_lectora: req.body.id_lectora,
					event_type: req.body.event_type,
					created: new Date(req.body.created),
				});
				await newEntrance.save();
				res.json(newEntrance);
			} else {
				const target = {
					tag_id: req.body.tag_id,
					registered_by_user_id: 0,
					user_id: "_desconocido",
					first_name: "_desconocido",
					last_name: "_desconocido",
					email: "",
					mobile_number: "",
					badge: "",
					user_role: {
						role: "_desconocido",
					},
					organization_role: {
						region: "_desconocido",
						zona: "_desconocido",
						distrito: "_desconocido",
						tienda: "_desconocido",
					},
					id_lectora: req.body.id_lectora,
					event_type: req.body.event_type,
				};
				const newEntrance = new EntranceControl(target);
				await newEntrance.save();
				res.json(newEntrance);
			}
		});
	} catch (error) {
		res.json(error);
		return;
	}
});

app.post("/new-entrance", (req, res) => {
	try {
		const funcion = req.body.map(async (e) => {
			const response = await UserTagId.findOne({
				tag_id: e.tag_id,
			});

			let target = {};

			if (!response) {
				target = {
					registered_by_user_id: 0,
					user_id: "_desconocido",
					first_name: "_desconocido",
					last_name: "_desconocido",
					badge: "",
				};
				const newEntrance = new EntranceControl(target);
				await newEntrance.save();
				res.status(200).json(newEntrance);
			} else {
				for (const i in response._doc) {
					if (
						["_id"].indexOf(i) >= 0 ||
						!Object.prototype.hasOwnProperty.call(response._doc, i)
					)
						continue;
					target[i] = response._doc[i];
				}
			}
			target.tag_id = e.tag_id;
			target.id_lectora = e.id_lectora;
			target.event_type = e.event_type;
			if (e.created) {
				target.created = new Date(e.created);
			}
			console.log("response", target);
			return target;
		});
		Promise.all(funcion)
			.then((results) => {
				EntranceControl.insertMany(results).then((arr) =>
					res.status(200).json(arr)
				);
				return;
			})
			.catch((e) => console.log(e));
	} catch (error) {
		res.status(500).json(error);
		return;
	}
});

app.route("/questionnaires")
	.get(questionnairesMethods.get)
	.post(questionnairesMethods.create);

app.post("/admonitions", async (req, res) => {
	try {
		const funcion = req.body.map(async (e) => {
			const user = await UserTagId.findOne({ tag_id: e.tag_id });
			if (user) {
				user._id = undefined;
				const target = {};
				for (const i in user) {
					if (["_id"].indexOf(i) >= 0) continue;
					if (!Object.prototype.hasOwnProperty.call(user._doc, i))
						continue;
					target[i] = user[i];
				}
				target.points = e.points;
				target.id_lectora = e.id_lectora;
				try {
					target.createdAt = new Date();
				} catch (e) {
					console.log("hot fix en producción en fallo!, me copian??");
				}
				return target;
			} else {
				const target = new Admonition({
					tag_id: e.tag_id,
					registered_by_user_id: 0,
					user_id: "_desconocido",
					first_name: "_desconocido",
					last_name: "_desconocido",
					email: "",
					identification_img_url: "",
					identification_img_file_name: "",
					mobile_number: "",
					badge: "",
					adminuser: "",
					adminpassword: "",
					adminsub: "",
					arrivaldate: "",
					accessdate: "",
					limitdate: "",
					user_role: {
						role: "_desconocido",
					},
					organization_role: {
						region: "_desconocido",
						zona: "_desconocido",
						distrito: "_desconocido",
						tienda: "_desconocido",
					},
					id_lectora: e.id_lectora,
					points: e.points,
				});
				return target;
			}
			// * SOLVED
			//TODO: not tag id found
		});
		Promise.all(funcion)
			.then((results) => {
				Admonition.insertMany(results).then((arr) => res.json(arr));
				return;
			})
			.catch((e) => console.log(e));
	} catch (error) {
		res.json(error);
		return;
	}
});

app.post("/answers", (req, res) => {
	try {
		const arrayDe = req.body.map(async (object, index) => {
			const userTagId = await UserTagId.findOne({
				tag_id: req.body[index].tag_id,
			});
			if (userTagId) {
				const user = userTagId._doc;
				user._id = undefined;
				const newAnswer = new Answers({
					track: req.body[index].track,
					...user,
					preguntas: req.body[index].preguntas,
				});
				newAnswer.correctas = 0;
				newAnswer.incorrectas = 0;
				const { preguntas } = req.body[index];
				preguntas.forEach((e) => {
					if (e.respuesta_usuario === e.respuesta_correcta) {
						newAnswer.correctas += 1;
					} else {
						newAnswer.incorrectas += 1;
					}
				});
				const calificacion = newAnswer.correctas / preguntas.length;
				newAnswer.calificacion = calificacion * 100;
				await newAnswer.save();
				objectMapped = newAnswer;
				return newAnswer;
			} else {
				const target = new Answers({
					track: req.body[index].track,
					preguntas: req.body[index].preguntas,
					tag_id: req.body[index].tag_id,
					registered_by_user_id: 0,
					user_id: "_desconocido",
					first_name: "_desconocido",
					last_name: "_desconocido",
					email: "",
					mobile_number: "",
					badge: "",
					user_role: {
						role: "_desconocido",
					},
					organization_role: {
						region: "_desconocido",
						zona: "_desconocido",
						distrito: "_desconocido",
						tienda: "_desconocido",
					},
				});
				const { preguntas } = req.body[index];
				target.correctas = 0;
				target.incorrectas = 0;
				preguntas.forEach((e) => {
					if (e.respuesta_usuario === e.respuesta_correcta) {
						target.correctas += 1;
					} else {
						target.incorrectas += 1;
					}
				});
				const calificacion = target.correctas / preguntas.length;
				target.calificacion = calificacion * 100;
				await target.save();
				objectMapped = target;
				return target;
			}
		});
		res.json(arrayDe);
		return;
	} catch (error) {
		res.json(error);
		return;
	}
});

app.get("/how-many-got-in", async (req, res) => {
	try {
		const user_ids = await EntranceControl.find().distinct("tag_id");
		res.json(user_ids.length).status(200);
	} catch (error) {
		res.json(error).status(500);
	}
});

app.get("/total-users", async (req, res) => {
	try {
		const users = await User.find().count();
		res.json(users).status(200);
	} catch (error) {
		res.json(error).status(500);
	}
});

const fillArray = (array) => {
	for (let index = 24; index < array.length; index++) {
		array[index] = index + 1;
	}
	return array;
};

app.get("/influx", async (req, res) => {
	try {
		const usersEntrance = await EntranceControl.aggregate([
			{
				$group: {
					_id: "$tag_id",
					firstEntryDate: { $min: "$created" },
				},
			},
		]);
		const buckets = [];
		for (const user of usersEntrance) {
			user.firstEntryDate.setHours(user.firstEntryDate.getHours() - 5);
			let bucketForDay = buckets.find(
				(bucket) =>
					bucket?.firstEntryDate ===
					user.firstEntryDate.toISOString().substring(0, 10)
			);
			if (!bucketForDay) {
				bucketForDay = {
					firstEntryDate: user.firstEntryDate
						.toISOString()
						.substring(0, 10),
					// attendees: [],
					hours: Array(24)
						.fill({})
						.map((element, index) => ({
							entryHour: index.toLocaleString("en-US", {
								minimumIntegerDigits: 2,
								useGrouping: false,
							}),
							attendees: 0,
						})),
				};
				buckets.push(bucketForDay);
			}
			// bucketForDay.attendees.push(user)
			let bucketForHour = bucketForDay.hours.find(
				(bucket) =>
					bucket.entryHour ===
					user.firstEntryDate.toISOString().substring(11, 13)
			);
			if (!bucketForHour) {
				bucketForHour = {
					entryHour: user.firstEntryDate
						.toISOString()
						.substring(11, 13),
					attendees: 0,
				};
				bucketForDay.hours.push(bucketForHour);
			}
			bucketForHour.attendees++;
		}
		res.json(buckets).status(200);
	} catch (error) {
		console.log(error);
		res.json(error).status(500);
	}
});

app.put("/user_tag-id", async (req, res) => {
	try {
		const attendeeTagId = await UserTagId.findOne({
			tag_id: req.body.tag_id,
		});
		const unattachedAt = new Date();
		(attendeeTagId.tag_id = `${
			req.body.tag_id
		}_desvinculado_${unattachedAt.toISOString()}`),
			await attendeeTagId.save();
		const tagsAttendee = await UserTagId.find(
			{
				user_id: attendeeTagId.toObject().user_id,
			},
			"tag_id user_id"
		);
		res.json({
			success: true,
			data: { tags: tagsAttendee, countTagId: tagsAttendee.length },
			attendeeTagId,
		}).status(200);
	} catch (error) {
		console.log(error);
		res.status(500).json({
			error,
		});
	}
});

app.put("/deliver-tag", async (req, res) => {
	try {
		const tagId = await UserTagId.findOne({
			tag_id: req.body.tag_id,
		});

		console.log(tagId);

		tagId.delivered = true;

		await tagId.save();

		res.json({
			success: true,
			data: tagId,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/top-admonitions", async (req, res) => {
	const admonitions = await Admonition.aggregate([
		{
			$group: {
				_id: "$tag_id",
				totalPoints: { $sum: "$points" },
			},
		},
	])
		.sort("-totalPoints")
		.limit(10);
	res.json(admonitions).status(200);
});

app.get("/admonition-by-tag", async (req, res) => {
	const admonition = await Admonition.aggregate([
		{
			$group: {
				_id: "$tag_id",
				totalPoints: { $sum: "$points" },
			},
		},
	]).sort("-totalPoints");
	userWithAdmonitions = admonition.find((value) => {
		return value._id === req.query.tag_id;
	});
	res.json(userWithAdmonitions).status(200);
});

app.get("/distinct-value/:distinct", async (req, res) => {
	const distinctValues = await User.distinct(req.params.distinct);
	res.status(200).json(distinctValues);
});

app.get("/config-entrance", async (req, res) => {
	const entrances = await ConfigEntrance.find();
	res.json(entrances);
});

app.get("/config-registro-en-sitio", async (req, res) => {
	const lectoras = await Lectora.find();
	const impresoras = await Impresora.find();
	res.json({
		lectoras,
		impresoras,
	});
});

app.get("/insert-exhibitors", async (req, res) => {
	getExhibitors();
	res.json({
		message: "Exhibitors inserted",
	}).status(200);
});

app.get("/insert-stores", async (req, res) => {
	getStores();
	res.json({
		message: "Stores inserted",
	}).status(200);
});

app.get("/insert-users", async (req, res) => {
	getUsers();
	res.json({
		message: "Users inserted",
	}).status(200);
});

app.get("/insert-data-bubble", async (req, res) => {
	let remaining = 0;
	const resultsTicketOrders = [];
	let dataTicketOrder = null;

	const config = {
		headers: {
			Authorization: `Bearer ${process.env.BUBBLE_API_KEY}`,
		},
		params: {
			limit: 100,
			cursor: 0, // user.cursor +1 || 0
		},
		timeout: 5000,
	};
	const { data: dataTicketTypes } = await axios.get(
		`${process.env.BUBBLE_API}/TicketType`,
		config
	);
	ticketTypes = dataTicketTypes.response.results;
	console.log(ticketTypes);
	const { data: dataMembershipTypes } = await axios.get(
		`${process.env.BUBBLE_API}/MembershipType`,
		config
	);
	membershipsTypes = dataMembershipTypes.response.results;
	console.log(membershipsTypes);
	do {
		console.log("while", config.params.cursor, remaining);
		dataTicketOrder = await axios.get(
			`${process.env.BUBBLE_API}/TicketOrder`,
			config
		);
		remaining = dataTicketOrder.data.response.remaining;
		//Filter non test tickets, i.e price different of $1 USD
		const nonTestTickets = dataTicketOrder.data.response.results.filter(
			(ticketOrder) =>
				ticketOrder.ticket_type_price !== 1 &&
				ticketOrder.status === "PAYED_WITH_STRIPE"
		);
		console.log("non test tickets in interation: ", nonTestTickets.length);
		resultsTicketOrders.push(...nonTestTickets);
		config.params.cursor += config.params.limit;
	} while (remaining > 0);
	config.params.cursor = 0;
	const response = [];
	console.log("resultsTicketOrders.length", resultsTicketOrders.length);
	console.log("Es momento de resolver las promises");
	for (let index = 0; index < resultsTicketOrders.length; index++) {
		const ticketOrder = resultsTicketOrders[index];
		console.log("Member: ", ticketOrder.ordering_Member);
		let data;
		let completed = false;
		do {
			try {
				const result = await axios.get(
					`${process.env.BUBBLE_API}/Member/${ticketOrder.ordering_Member}`,
					config
				);
				data = result.data;
				completed = Boolean(data?.response);
			} catch (err) {
				console.log("err", err);
			}
		} while (!completed);

		const membership = membershipsTypes.find((ms) => {
			return data?.response?.membership === ms._id;
		});

		try {
			console.log(data?.response.first_name, index);
			const newTicket = {
				event_code: "Evolution2022",
				registered_by_user_id: -1,
				identification_img_url: "",
				identification_img_file_name: "",
				email: data?.response?.email,
				first_name: ticketOrder.attendee_name
					? ticketOrder.attendee_name
					: "PENDIENTE",
				last_name: "",
				mobile_number: "",
				// TODO: switch for ticket type to return slug
				badge: "",
				adminuser: "",
				adminpassword: "",
				adminsub: "",
				arrivaldate: "",
				accessdate: "",
				limitdate: "",
				qr_code: ticketOrder._id,
				buyerSmartId: data?.response?.pin,
				buyerName: data?.response?.first_name,
				buyerRank: membership?.name,
				ticketPrice: -1,
				ticketType: "",
			};
			const badgeType = ticketTypes.find(
				(type) => type?._id === ticketOrder?.original_TicketType
			);
			newTicket.ticketPrice = badgeType.price;
			newTicket.ticketType = badgeType._id;

			if (
				badgeType.name
					.toLowerCase()
					.trim()
					.includes("platinum reservad")
			) {
				newTicket.badge = "platinum-reservado";
			} else if (
				badgeType.name.toLowerCase().trim().includes("platinum")
			) {
				newTicket.badge = "platinum";
			} else if (badgeType.name.toLowerCase().trim().includes("vip")) {
				newTicket.badge = "vip";
			} else if (badgeType.name.toLowerCase().trim().includes("gold a")) {
				newTicket.badge = "gold-a";
			} else if (badgeType.name.toLowerCase().trim().includes("gold b")) {
				newTicket.badge = "gold-b";
			}
			//console.log("badgeType",badgeType.name)
			else console.log("newTicket.badge", newTicket.badge);

			response.push(newTicket);
		} catch (e) {
			console.log(e);
		}
	}
	await User.insertMany(response);
	res.status(200).json(response);
});

app.post("/login", async (req, res) => {
	const { pin } = req.body;

	const recorder = await Recorder.findOne({
		pin,
	});

	if (!recorder) {
		return res.status(400).json({
			error: "Recorder not found!",
		});
	}

	return res.status(200).json({
		data: recorder,
		success: true,
	});
});

app.post("/replacement", async (req, res) => {
	try {
		const newReplacement = new ReplacementReason({
			comment: req.body.comment,
			reason: req.body.reason,
		});

		await newReplacement.save();

		return res.status(200).json({
			data: newReplacement,
			success: true,
		});
	} catch (error) {
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/attendees", async (req, res) => {
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
				query[field] = regexp;
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

			const users = await User.find(queryMongo).skip(skip).limit(limit);
			const count = await User.count(queryMongo);

			const users_ids = users?.map((user) => user?._doc?._id.toString());
			const tag_ids = await UserTagId.find(
				{
					user_id: {
						$in: users_ids,
					},
				},
				"tag_id user_id createdAt delivered"
			);

			// console.log("tag ids searchComposite", tag_ids)

			const usersWithTagId = users.map((user) => {
				const userTagIds = tag_ids.filter((userTagId) => {
					return userTagId.user_id === user._id.toString();
				});

				const hasSomeDeliveredTag = tag_ids.some(
					(userTagId) => userTagId.delivered
				);

				return {
					...user._doc,
					countTagId: userTagIds.length,
					delivered: hasSomeDeliveredTag,
					lastTagCreatedAt: new Date(
						userTagIds.reduce(
							(acc, curr) =>
								new Date(acc) > new Date(curr.createdAt)
									? new Date(acc)
									: new Date(curr.createdAt),
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
			"tag_id user_id createdAt delivered"
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
							new Date(acc) > new Date(curr.createdAt)
								? new Date(acc)
								: new Date(curr.createdAt),
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
});

//TODO: change to /distinct/:field

app.get("/sidenav", async (req, res) => {
	try {
		const { field } = req.query;
		const distinctValues = await User.distinct(field);
		// TODO: one just unique query to the database and then sorting them in memory
		const data = [];
		for (let i = 0; i < distinctValues.length; i++) {
			const value = distinctValues[i];
			const count = await User.find({ [field]: value }).count();
			data.push({
				field: value,
				count,
			});
		}
		res.status(200).json({
			data,
			success: true,
		});
	} catch (error) {
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/status-count", async (req, res) => {
	try {
		const attendeesLength = await User.count();
		const attendeesWithTag = await UserTagId.count();
		const attendees = await UserTagId.aggregate([
			{
				$group: {
					_id: "$user_id",
					count: { $sum: 1 },
				},
			},
			{
				$group: {
					_id: "$count",
					count: { $sum: 1 },
				},
			},
		]);
		const finalCount = {};
		for (const iterator of attendees) {
			if (iterator._id >= 2)
				finalCount["REPOSITION"] = finalCount["REPOSITION"]
					? finalCount["REPOSITION"] + iterator.count
					: iterator.count;
			else
				finalCount["COMPLETED"] = finalCount["COMPLETED"]
					? finalCount["COMPLETED"] + iterator.count
					: iterator.count;
		}
		finalCount["PENDING"] =
			attendeesLength -
			(finalCount["REPOSITION"] + finalCount["COMPLETED"]);
		res.status(200).json({
			data: finalCount,
			success: true,
		});
	} catch (error) {
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/attendee-by-status", async (req, res) => {
	try {
		const { countTagId, skip, limit } = req.query;
		const isArrayOfStatuses = Array.isArray(countTagId);
		const data = {};
		const statuses = {
			1: { $eq: 1 },
			2: { $gte: 2 },
		};
		const STATUSES = {
			0: "PENDING",
			1: "COMPLETED",
			2: "REPOSITION",
		};
		if (
			(isArrayOfStatuses && countTagId.includes("0")) ||
			countTagId === "0"
		) {
			console.log("here");
			const attendees = await UserTagId.find({}, "user_id");

			const attendeesIdsWithTag = [
				...new Set(attendees.map(({ user_id }) => user_id)),
			];

			const attendeesWithoutTag = await User.find({
				_id: {
					$not: {
						$in: attendeesIdsWithTag,
					},
				},
			})
				.skip(skip)
				.limit(limit);
			const count = await User.count({
				_id: {
					$not: {
						$in: attendeesIdsWithTag,
					},
				},
			});
			console.log("attendeesWithoutTag", attendeesWithoutTag.length);
			console.log("count", count);
			data[STATUSES[0]] = {
				attendees: attendeesWithoutTag,
				count,
			};
			console.log(Object.values(data["PENDING"]));
		}
		if (
			isArrayOfStatuses &&
			(countTagId.includes("1") || countTagId.includes("2"))
		) {
			for (const iterator of countTagId) {
				if (!parseInt(iterator)) continue;
				const attendeesByStatus = await UserTagId.aggregate([
					{
						$group: {
							_id: "$user_id",
							count: { $sum: 1 },
						},
					},
					{
						$match: {
							count: statuses[iterator],
						},
					},
					{ $skip: parseInt(skip) },
					{ $limit: parseInt(limit) },
				]);
				const attendeesWithTag = await User.find({
					_id: {
						$in: attendeesByStatus.map(({ _id }) => _id),
					},
				});
				data[STATUSES[iterator]] = {
					attendees: attendeesWithTag,
					count: attendeesWithTag.length,
				};
			}
		} else {
			if (!data[STATUSES[0]]) {
				const attendeesByStatus = await UserTagId.aggregate([
					{
						$group: {
							_id: "$user_id",
							count: { $sum: 1 },
						},
					},
					{
						$match: {
							count: statuses[countTagId],
						},
					},
				]);
				const attendeesWithTag = await User.find({
					_id: {
						$in: attendeesByStatus.map(({ _id }) => _id),
					},
				})
					.skip(skip)
					.limit(limit);
				const count = await User.count({
					_id: {
						$in: attendeesByStatus.map(({ _id }) => _id),
					},
				});
				data[STATUSES[countTagId]] = {
					attendees: attendeesWithTag,
					count,
				};
			}
		}
		res.json({
			data,
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/total-attendees", async (req, res) => {
	try {
		const totalAttendees = await User.count();
		res.json({
			data: totalAttendees,
			success: true,
		});
	} catch (error) {
		res.status(500).json({
			error,
			success: false,
		});
	}
});

// "year": {
//     "$year": "$created"
// },
// "dayOfYear": {
//     "$dayOfYear": "$created"
// },
// "dayOfMonth": {
//     "$dayOfMonth": "$created"
// },
// "dayOfWeek": {
//     "$dayOfWeek": "$created"
// },
// "hour": {
//     "$hour": "$created"
// },
// "interval": {
//     "$subtract": [{
//             "$minute": "$created"
//         },
//         {
//             "$mod": [{
//                 "$minute": "$created"
//             }, 60]
//         }
//     ]
// }

app.get("/influx-time", async (req, res) => {
	// TODO: dropdown de días
	// TODO: gráfica: eje x (tiempo) eje y (asistentes query); series: todas las entradas
	const { start, end } = req.query;

	console.log(start, end);

	const usersEntrance = await EntranceControl.aggregate([
		{
			$group: {
				_id: {
					tag_id: "$tag_id",
					created: "$created",
					event_type: "$event_type",
				},
			},
		},
		{
			$replaceRoot: {
				newRoot: "$_id",
			},
		},
		{
			$match: {
				created: {
					$gte: new Date(start),
					$lt: new Date(end),
				},
			},
		},
		{
			$group: {
				_id: {
					event_type: "$event_type",
					dateTrunc: {
						$dateTrunc: {
							date: "$created",
							unit: "hour",
							timezone: "-0500",
						},
					},
				},
				count: { $sum: 1 },
			},
		},
	]);

	const hoursNotSet = usersEntrance
		.map((entranceControl) => entranceControl._id.dateTrunc)
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

	const hoursAlmostASet = new Set();

	hoursNotSet.forEach((hour) => {
		if (!hoursAlmostASet.has(new String(hour))) {
			hoursAlmostASet.add(hour);
		}
	});

	const hours = [
		...new Set(
			usersEntrance
				.map((entranceControl) => entranceControl._id.dateTrunc)
				.sort((a, b) => new Date(a) - new Date(b))
		),
	];

	const series = [
		...new Set(
			usersEntrance.map(
				(entranceControl) => entranceControl._id.event_type
			)
		),
	];

	const entrances = series.map((serie) => {
		const objects = usersEntrance.filter(
			(entranceControl) => entranceControl._id.event_type === serie
		);

		const hours = objects
			.map((obj) => {
				return {
					dateTrunc: obj._id.dateTrunc,
					count: obj.count,
				};
			})
			.map(({ dateTrunc, count }) => ({
				dateTrunc,
				count,
			}))
			.sort((a, b) => new Date(a.dateTrunc) - new Date(b.dateTrunc));

		return {
			event_type: serie,
			hours,
		};
	});

	res.json({
		data: {
			hola: usersEntrance[0],
			hours,
			entrances,
		},
		success: true,
	});
});

app.post(
	"/validate-import-file",
	upload.single("attendees"),
	async (req, res) => {
		try {
			console.log(req.file);
			// if(req.file.originalname.endsWith(".csv")){
			//     const data =[]
			//     const buffer = new Buffer(req.file.buffer, "base64")
			//     const readable = new Readable()
			//     readable._read = () => {}
			//     readable.push(buffer)
			//     readable.push(null)
			//     readable.pipe(
			//         parse({ delimiter: ",", from_line: 2 })
			//     )

			//         fs.createReadStream(req.file.buffer, "utf-8").pipe(parse({ delimiter: ",", from_line: 2 })).on("data", function (row) {
			//             data.push(row)
			//       }).on("end", function () {
			//         console.log("finished");
			//       })
			//       .on("error", function (error) {
			//         console.log(error.message);
			//       });
			//     return res.json({
			//         data
			//     })
			// }
			if (
				!req.file.mimetype ===
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			) {
				res.json({
					data: {
						errorCode,
					},
				});
			}
			const workbook = XLSX.read(req.file.buffer);
			const jsa = XLSX.utils.sheet_to_json(
				workbook.Sheets[workbook.SheetNames[0]],
				{ header: 1 }
			);
			const events = await Event.find();
			if (jsa[0].length === 0) {
				return res.status(500).json({
					data: {
						errorCode: "NO_HEADERS_IN_IMPORT_FILE",
					},
				});
			}
			res.json({
				data: {
					fields: jsa[0],
					users: jsa,
					event: events[0],
				},
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				error,
				success: false,
			});
		}
	}
);

app.post("/insert-users", async (req, res) => {
	try {
		console.log("req.body", req.body);
		const { camposToColumnas, attendeesRows } = req.body;
		const finalAttendees = attendeesRows
			.slice(1, attendeesRows.length)
			.filter((row) => row.length)
			.map((row) => {
				const finalValue = {};
				Object.keys(camposToColumnas).forEach((key) => {
					const value = row[camposToColumnas[key]];
					if (value) {
						finalValue[key] = value;
					}
				});
				return finalValue;
			});
		console.log("finalAttendees");
		console.table(finalAttendees);
		await User.insertMany(finalAttendees);
		res.json({
			data: {
				finalAttendees,
			},
			success: true,
		});
	} catch (error) {
		res.status(500).json({
			error,
			success: true,
		});
	}
});

app.get("/attendees-table", async (req, res) => {
	try {
		const usersWithTagId = await User.aggregate([
			{
				$addFields: {
					userId: { $toString: "$_id" },
				},
			},
			{
				$lookup: {
					from: "usertagids",
					localField: "userId",
					foreignField: "user_id",
					as: "tag_ids",
				},
			},
			{
				$project: {
					_id: 1,
					doc: "$$ROOT",
					countTagId: { $size: "$tag_ids" },
					lastTagCreatedAt: {
						$cond: {
							if: { $eq: [{ $size: "$tag_ids" }, 0] },
							then: null,
							else: {
								$max: "$tag_ids.createdAt",
							},
						},
					},
				},
			},
			{
				$group: {
					_id: null,
					data: { $push: "$$ROOT" },
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					data: 1,
					count: 1,
				},
			},
		]);

		return res.json({
			data: usersWithTagId[0]?.data,
			success: true,
			count: usersWithTagId[0]?.count || 0,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			error,
			success: false,
		});
	}
});

// {
//     $project: {
//         _id: 0,
//         group_name: {
//             $switch: {
//                 branches: [
//                     { case: { $eq: [ "$_id", 0 ] }, then: "PENDING" },
//                     { case: { $eq: [ "$_id", 1 ] }, then: "COMPLETED" },
//                     { case: { $gt: [ "$_id", 1 ] }, then: "REPOSITION" }
//                 ],
//                 default: "UNKNOWN"
//             }
//         },
//         count: 1
//     }
// }
app.get("/another-endpoint", async (req, res) => {
	try {
		const { countTagId, limit, skip } = req.query;
		console.log(countTagId);
		const matchByCountTagId = Array.isArray(countTagId)
			? {
					$match: {
						$or: [
							countTagId.includes("2")
								? { countTagId: { $gte: 2 } }
								: {},
							countTagId.includes("1") || countTagId.includes("0")
								? {
										countTagId: {
											$in: [
												...countTagId
													.map((e) => parseInt(e))
													.filter((e) => e !== 2),
											],
										},
								  }
								: {},
						],
					},
			  }
			: parseInt(countTagId) >= 2
			? {
					$match: {
						countTagId: { $gte: parseInt(countTagId) },
					},
			  }
			: {
					$match: {
						countTagId: parseInt(countTagId),
					},
			  };
		console.log("matchByCountTagId");
		console.dir(matchByCountTagId);
		const result = await User.aggregate([
			{
				$addFields: {
					userId: { $toString: "$_id" },
				},
			},
			{
				$lookup: {
					from: "usertagids",
					localField: "userId",
					foreignField: "user_id",
					as: "tags",
				},
			},
			{
				$project: {
					doc: "$$ROOT",
					countTagId: { $size: "$tags.tag_id" },
					_id: 0,
				},
			},
			matchByCountTagId,
			{ $skip: parseInt(skip) },
			{ $limit: parseInt(limit) },
			{
				$group: {
					_id: {
						$cond: [
							{ $eq: ["$countTagId", 0] },
							"PENDING",
							{
								$cond: [
									{ $eq: ["$countTagId", 1] },
									"COMPLETED",
									"REPOSITION",
								],
							},
						],
					},
					users: { $push: "$$ROOT" },
					count: { $sum: 1 },
				},
			},
			{
				$group: {
					_id: null,
					data: {
						$push: {
							k: "$_id",
							v: {
								attendees: "$users",
								count: "$count",
							},
						},
					},
				},
			},
			{
				$replaceRoot: {
					newRoot: { $arrayToObject: "$data" },
				},
			},
		]);
		const totalCount = await User.aggregate([
			{
				$addFields: {
					userId: { $toString: "$_id" },
				},
			},
			{
				$lookup: {
					from: "usertagids",
					localField: "userId",
					foreignField: "user_id",
					as: "tags",
				},
			},
			{
				$project: {
					doc: "$$ROOT",
					countTagId: { $size: "$tags.tag_id" },
					_id: 0,
				},
			},
			matchByCountTagId,
			{
				$group: {
					_id: null,
					count: { $sum: 1 },
				},
			},
		]);

		const total = totalCount[0].count;
		res.status(200).json({
			data: { total, attendees: result[0] },
			success: true,
			matchByCountTagId,
		});
	} catch (error) {
		console.log("error", error);
		res.status(500).json({
			error,
			success: false,
		});
	}
});

app.get("/delivered-graphic", async (req, res) => {
	try {
		const userTagIds = await User.aggregate([
			{
				$addFields: {
					userId: { $toString: "$_id" },
				},
			},
			{
				$lookup: {
					from: "usertagids",
					localField: "userId",
					foreignField: "user_id",
					as: "tags",
				},
			},
			// {
			// 	$addFields: {
			// 		delivered: {
			// 			$anyElementTrue: {
			// 				$map: {
			// 					input: "$tags",
			// 					as: "tag",
			// 					in: "$$tag.delivered",
			// 				},
			// 			},
			// 		},
			// 	},
			// },
			// {
			// 	$addFields: {
			// 		has_tags: {
			// 			$gt: [{ $size: "$tags" }, 0],
			// 		},
			// 		has_delivered_tags: {
			// 			$anyElementTrue: {
			// 				$map: {
			// 					input: "$tags",
			// 					as: "tag",
			// 					in: "$$tag.delivered",
			// 				},
			// 			},
			// 		},
			// 	},
			// },
			// {
			// 	$addFields: {
			// 		user_type: {
			// 			$switch: {
			// 				branches: [
			// 					{
			// 						case: { $not: "$has_tags" },
			// 						then: "no_tags",
			// 					},
			// 					{
			// 						case: { $not: "$has_delivered_tags" },
			// 						then: "tags_without_delivered",
			// 					},
			// 				],
			// 				default: "tags_with_delivered",
			// 			},
			// 		},
			// 	},
			// },
			// {
			// 	$group: {
			// 		_id: "$user_type",
			// 		users: {
			// 			$push: {
			// 				_id: "$_id",
			// 				name: "$name",
			// 			},
			// 		},
			// 	},
			// },
			{
				$addFields: {
					has_tags: {
						$cond: [{ $gt: [{ $size: "$tags" }, 0] }, 1, 0],
					},
					has_delivered_tags: {
						$cond: [
							{
								$anyElementTrue: {
									$map: {
										input: "$tags",
										as: "tag",
										in: "$$tag.delivered",
									},
								},
							},
							1,
							0,
						],
					},
				},
			},
			{
				$addFields: {
					user_type: {
						$switch: {
							branches: [
								{
									case: { $eq: ["$has_tags", 0] },
									then: "no_tags",
								},
								{
									case: { $eq: ["$has_delivered_tags", 0] },
									then: "tags_without_delivered",
								},
							],
							default: "tags_with_delivered",
						},
					},
				},
			},
			{
				$group: {
					_id: "$user_type",
					users: {
						$push: {
							_id: "$_id",
							name: "$name",
						},
					},
				},
			},
			{
				$project: {
					_id: "$_id",
					user_type: 1,
					user_count: { $size: "$users" },
				},
			},
		]);
		res.json({ data: userTagIds, success: true });
	} catch (error) {
		console.log(error);
		res.json({ error, success: false });
	}
});
module.exports = app;
