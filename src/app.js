const { Router } = require("express"),
app = Router();

const axios = require("axios");
const getExhibitors = require("./exportingDatabase/getExhibitors");
const getStores = require("./exportingDatabase/getStores");
const getUsers = require("./exportingDatabase/getUsers");
const questionnairesMethods = require("./handlers/questionnaires");
const ConfigEntrance = require("./models/ConfigEntrance");
const ConfigTags = require("./models/ConfigTags");
const Impresora = require("./models/Impresora");
const Lectora = require("./models/Lectora");
// Models
const {User} = require("./models/User"),
Store = require("./models/Store"),
UserTagId = require("./models/UserTagId"),
EntranceControl = require("./models/EntranceControl"),
Questionnaire = require("./models/Questionnaire"),
Admonition = require("./models/Admonition"),
Answers = require("./models/Answers"),
Event = require("./models/Event");
const diacriticSensitiveRegex = require("./utils/diacriticSensitiveRegex");

// Messages
const message = "Success";

let membershipsTypes = []
let ticketTypes = []

app.get("/", async (req,res) => {
    const events = await Event.find()
    res.status(200).json(events[0])
})

app.get("/config-tags", async (req, res) => {
    const config = await ConfigTags.find();
    res.json(config)
})

app.post("/new-user", async (req, res) => {
    try {        
        console.log("New User: req.body",req.body)
        const newUser = new User(req.body)
        await newUser.validate()
        await newUser.save()
        res.json({message: "success", ...newUser._doc})
    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.get("/users", async (req, res) => {
    try {
        let query = {}
        if(req.query.user_id && req.query.user_id.length>0){
            query["_id"] = req.query.user_id
            console.log(query, query)
        }
        Object.entries(req.query).forEach((key) => {
            const field = key[0]
            const value = diacriticSensitiveRegex(req.query[field]);
            if(value.length > 0){
                const regexp = new RegExp(value,'i',);
                console.log(regexp)
                query[field] = regexp
            }
        })
        console.log('req.query', req.query)
        console.log("query",query)

        const users = await User.find(query)
        console.log("users",users.length)
        const users_ids = users?.map(user => user?._doc?._id.toString())
        let tag_ids = []
        if(users?.length < 2000){            
            tag_ids = await UserTagId.find({
                "user_id": {
                    $in: users_ids
                }
            }, "tag_id user_id")
        }
        console.log("tag_ids", tag_ids.length)
        const usersWithTagId = users.map(user => {
            return {
                ...user._doc,
                countTagId: tag_ids.filter(userTagId => {
                    return userTagId.user_id == user._id
                }).length
            }
        })
        res.status(200).json(usersWithTagId)
        return
    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo", error})
    }
})

app.get("/user/:id", async (req, res) => {
    try {
        
        const {id} = req.params
        const user = await User.findById(id)
        // If not user found, it returns an empty object
        if(!user) {
            res.json({})
            return;
        }

        res.json(user)
        return;

    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.put('/user/:id', async (req, res) => {
    try {        
        User.findByIdAndUpdate(req.params.id, req.body, {returnDocument: 'after'})
            .then(e => res.json(e).status(200))
            .catch(err => res.json(err).status(500))
    } catch (error) {
        res.json(error).status(500)
    }
})

app.post("/tag_id-user", async (req, res) => {
    try {
        User.findById(req.body.id)
            .then(async (respuesta) => {
                if(respuesta){
                    var target = {};
                    //TODO: not user found
                    for (var i in respuesta._doc) {
                        if (["_id"].indexOf(i) >= 0) continue;
                        if (!Object.prototype.hasOwnProperty.call(respuesta._doc, i)) continue;
                        target[i] = respuesta._doc[i];
                    }                    
                    
                    const newUserTagId = new UserTagId({
                        tag_id: req.body.tag_id,
                        user_id:respuesta._id,
                        ...target
                    })

                    try{
                        newUserTagId.tag_id=req.body.tag_id
                        console.log("newUserTagId",newUserTagId)
                        await newUserTagId.save()
                        res.json(newUserTagId)
                    }catch(err){
                        console.log(err)
                        res.status(500).json({error:err});
                    }
                } else {
                    const respuesta = {
                        tag_id: req.body.tag_id,
                        registered_by_user_id: 0,
                        user_id: "_desconocido",
                        first_name: "_desconocido",
                        last_name: "_desconocido",
                        email: "",
                        mobile_number: "",
                        badge: "",
                        user_role: {
                            role: "_desconocido"
                        },
                        organization_role: {
                            region: "_desconocido",
                            zona: "_desconocido",
                            distrito: "_desconocido",
                            tienda: "_desconocido"
                        }
                    }
                    try {
                        const newUserTagId = new UserTagId(respuesta);
                        await newUserTagId.save()
                        res.json(newUserTagId)
                        return;
                    } catch (error) {
                        console.log(err)
                        res.status(500).json(error)
                        return;
                    }
                }
            })
    } catch (error) {
        console.log(err)
        res.status(500).json(error)
        return;
    }
})

app.get("/tag_id-user", async (req, res) => {
    try {
        const user = await UserTagId.findOne({
            tag_id: req.query.tag_id
        })
        if(!user){
            res.json({})
            return;
        }
        res.json(user)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})

app.get("/tag-ids-by-user-id", async (req, res) => {
    try {
        const users = await UserTagId.find({
            user_id: req.query.user_id
        })

        res.json(users)
        console.log(users)
        return;

    } catch (error) {
        res.json(error)
        return;
    }
})
app.post("/new-entrance-with-date", (req, res) => {
    console.log(req.body)
    try {        
        const user = UserTagId.findOne({
            tag_id: req.body.tag_id
        }).then(async (response) => {
            if(response){
                var target = {};
                for (var i in response._doc) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(response._doc, i)) continue;
                    target[i] = response._doc[i];
                }
                // TODO: one method for entrance and handling the created just if the body contains it
                const newEntrance = new EntranceControl({
                    ...target,
                    id_lectora: req.body.id_lectora,
                    event_type: req.body.event_type,
                    created: new Date(req.body.created)
                })
                await newEntrance.save()
                res.json(newEntrance)
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
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                    id_lectora: req.body.id_lectora,
                    event_type: req.body.event_type
                }
                const newEntrance = new EntranceControl(target);
                await newEntrance.save()
                res.json(newEntrance)
            }
        })
    } catch (error) {
        res.json(error)
        return;
    }
})

app.post("/new-entrance", (req, res) => {
    try {        
        UserTagId.findOne({
            tag_id: req.body.tag_id
        }).then(async (response) => {
            if(!response) {
                // TODO: target without embed properties
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
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                    id_lectora: req.body.id_lectora,
                    event_type: req.body.event_type
                }
                const newEntrance = new EntranceControl(target);
                await newEntrance.save()
                res.status(200).json(newEntrance)
            };
            let target = {};
            for (var i in response._doc) {
                if (["_id"].indexOf(i) >= 0 || !Object.prototype.hasOwnProperty.call(response._doc, i)) continue;
                target[i] = response._doc[i];
            }
            const newEntrance = new EntranceControl({
                ...target,
                id_lectora: req.body.id_lectora,
                event_type: req.body.event_type
            })
            await newEntrance.save()
            res.status(200).json(newEntrance)
        })
    } catch (error) {
        res.status(500).json(error)
        return;
    }
})

app.route("/questionnaires")
    .get(questionnairesMethods.get)
    .post(questionnairesMethods.create)

app.post("/admonitions", async (req, res) => {
    try {
        const funcion = req.body.map(async e => {
            const user = await UserTagId.findOne({tag_id: e.tag_id})
            if(user){
                delete user._id
                let target = {}
                for (var i in user) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(user._doc, i)) continue;
                    target[i] = user[i];
                }
                target.points = e.points
                target.id_lectora = e.id_lectora
                try{
                    target.createdAt = new Date()    
                }catch(e){
                    console.log("hot fix en producción en fallo!, me copian??");
                } 
                return target
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
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                    id_lectora: e.id_lectora,
                    points: e.points
                })
                return target
            }
            // * SOLVED
            //TODO: not tag id found
        })
        Promise.all(funcion).then(results => {
            Admonition.insertMany(results)
                .then(arr => res.json(arr))
            return;
        }).catch(e => console.log(e))
    } catch (error) {
        res.json(error)
        return;
    }
})

app.post("/answers", (req, res) => {
    try {        
        const arrayDe = req.body.map(async (object, index) => {
            const userTagId = await UserTagId.findOne({
                tag_id: req.body[index].tag_id
            })
            if(userTagId){
                const user = userTagId._doc
                delete user._id
                const newAnswer = new Answers({
                    track: req.body[index].track,
                    ...user,
                    preguntas: req.body[index].preguntas
                });
                newAnswer.correctas = 0;
                newAnswer.incorrectas = 0;
                const { preguntas } = req.body[index];
                preguntas.forEach(e => {
                    if(e.respuesta_usuario === e.respuesta_correcta) {
                        newAnswer.correctas += 1
                    } else {
                        newAnswer.incorrectas += 1
                    }
                })
                const calificacion = newAnswer.correctas / preguntas.length 
                newAnswer.calificacion = (calificacion * 100)
                await newAnswer.save();
                objectMapped = newAnswer
                return newAnswer
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
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                })
                const { preguntas } = req.body[index];
                target.correctas = 0;
                target.incorrectas = 0;
                preguntas.forEach(e => {
                    if(e.respuesta_usuario === e.respuesta_correcta) {
                        target.correctas += 1
                    } else {
                        target.incorrectas += 1
                    }
                })
                const calificacion = target.correctas / preguntas.length 
                target.calificacion = (calificacion * 100)
                await target.save();
                objectMapped = target
                return target
            }
        })
        res.json(arrayDe)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
});

app.get('/how-many-got-in', async (req, res) => {
    try {
        const user_ids = await EntranceControl.find().distinct("tag_id")
        res.json(user_ids.length).status(200)
    } catch (error) {
        res.json(error).status(500)
    }
});

app.get("/total-users", async (req, res) => {
    try {
        const users = await User.find().count()
        res.json(users).status(200)
    } catch (error) {
        res.json(error).status(500)
    }
})

const fillArray = array => {
    for (let index = 24; index < array.length; index++) {
        array[index] = index+1
    }
    return array
}

app.get("/influx", async (req, res) => {
    try {
        const usersEntrance = await EntranceControl.aggregate([
            {
                $group: {
                    _id: "$tag_id",
                    firstEntryDate: {$min: "$created"}
                }
            }
        ])
        const buckets = []
        for (const user of usersEntrance) {
            user.firstEntryDate.setHours(user.firstEntryDate.getHours()-5)
            let bucketForDay = buckets.find(bucket => bucket?.firstEntryDate === user.firstEntryDate.toISOString().substring(0,10))
            if(!bucketForDay){
                bucketForDay = {
                    firstEntryDate: user.firstEntryDate.toISOString().substring(0,10),
                    // attendees: [],
                    hours: Array(24).fill({}).map((element, index) => ({
                        entryHour: index.toLocaleString('en-US', {
                            minimumIntegerDigits: 2,
                            useGrouping: false
                        }),
                        attendees: 0
                    }))
                }
                buckets.push(bucketForDay)
            }
            // bucketForDay.attendees.push(user)
            let bucketForHour = bucketForDay.hours.find(bucket => bucket.entryHour === user.firstEntryDate.toISOString().substring(11, 13))
            if(!bucketForHour){
                bucketForHour = {
                    entryHour: user.firstEntryDate.toISOString().substring(11, 13),
                    attendees: 0
                }
                bucketForDay.hours.push(bucketForHour)
            }
            bucketForHour.attendees++
        }
        res.json(buckets).status(200)
    } catch (error) {
        console.log(error)
        res.json(error).status(500)
    }
})

app.delete("/user_tag-id", async (req, res) => {
    await UserTagId.findOneAndDelete({
        tag_id: req.query.tag_id
    })
    res.json({
        success: true
    }).status(200)
});

app.get("/top-admonitions", async (req, res) => {
    const admonitions = await Admonition.aggregate([
        {
            $group: {
                _id: "$tag_id",
                totalPoints: {$sum: "$points"}
            }
        }
    ]).sort("-totalPoints").limit(10)
    res.json(admonitions).status(200)
})

app.get("/admonition-by-tag", async (req, res) => {
    const admonition = await Admonition.aggregate([
        {
            $group: {
                _id: "$tag_id",
                totalPoints: {$sum: "$points"}
            }
        }
    ]).sort("-totalPoints")
    userWithAdmonitions = admonition.find((value)=>{
        return value._id === req.query.tag_id
    })
    res.json(userWithAdmonitions).status(200)
})

app.get("/distinct-value/:distinct", async(req, res) => {
    const distinctValues = await User.distinct(req.params.distinct)
    res.status(200).json(distinctValues)
})

app.get('/config-entrance', async (req, res) => {
    const entrances = await ConfigEntrance.find();
    res.json(entrances)
});

app.get('/config-registro-en-sitio', async (req, res) => {
    const lectoras = await Lectora.find();
    const impresoras = await Impresora.find();
    res.json({
        lectoras,
        impresoras
    })
})

app.get('/insert-exhibitors', async (req, res) => {
    getExhibitors()
    res.json({
        message: "Exhibitors inserted"
    }).status(200)
})

app.get('/insert-stores', async (req, res) => {
    getStores()
    res.json({
        message: "Stores inserted"
    }).status(200)
})

app.get('/insert-users', async (req, res) => {
    getUsers()
    res.json({
        message: "Users inserted"
    }).status(200)
})

app.get("/insert-data-bubble", async (req, res) => {
    let remaining = 0
    let resultsTicketOrders = []
    let dataTicketOrder = null;

    const config = {
        headers: {
            "Authorization": `Bearer ${process.env.BUBBLE_API_KEY}`
        },
        params: {
            limit: 100,
            cursor: 0 // user.cursor +1 || 0
        },
        timeout: 2000,
    }
    const {data: dataTicketTypes} = await axios.get(`${process.env.BUBBLE_API}/TicketType`, config)
    ticketTypes = dataTicketTypes.response.results
    console.log(ticketTypes)
    const {data: dataMembershipTypes} = await axios.get(`${process.env.BUBBLE_API}/MembershipType`, config)
    membershipsTypes = dataMembershipTypes.response.results
    console.log(membershipsTypes)
    do {
        console.log("while", config.params.cursor, remaining)
        dataTicketOrder = await axios.get(`${process.env.BUBBLE_API}/TicketOrder`, config);
        remaining = dataTicketOrder.data.response.remaining
        //Filter non test tickets, i.e price different of $1 USD
        let nonTestTickets = dataTicketOrder.data.response.results.filter(ticketOrder => ticketOrder.ticket_type_price!=1 &&  ticketOrder.status =='PAYED_WITH_STRIPE')
        console.log ("non test tickets in interation: ",nonTestTickets.length)
        resultsTicketOrders.push(...nonTestTickets)
        config.params.cursor += config.params.limit
    } while (remaining > 0);
    config.params.cursor = 0
    const response = []
    console.log("resultsTicketOrders.length",resultsTicketOrders.length)
    console.log("Es momento de resolver las promises")
    for (let index = 0; index < resultsTicketOrders.length; index++) {
        const ticketOrder = resultsTicketOrders[index]
        console.log("Member: ",ticketOrder.ordering_Member) 
        let data 
        let completed = false
        do{
            try{
                let result = await axios.get(`${process.env.BUBBLE_API}/Member/${ticketOrder.ordering_Member}`, config)    
                data = result.data
                completed = data?.response!=undefined
            }catch(err){
                console.log("err",err)
            }
        }while(!completed)
        
 
        const membership = membershipsTypes.find((ms) => {
            return data?.response?.membership === ms._id
        })
        
        console.log(data?.response.first_name, index)
        let newTicket = {
            event_code: "Evolution2022",
            registered_by_user_id: -1,
            identification_img_url: "",
            identification_img_file_name: "",
            email: data?.response?.email,
            first_name: ticketOrder.attendee_name,
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
            ticketType: ""
            
        }
        let badgeType = ticketTypes.find(type => type?._id === ticketOrder?.original_TicketType)
        newTicket.ticketPrice = badgeType.price
        newTicket.ticketType = badgeType._id

        if(badgeType.name.toLowerCase().trim().includes("platinum")){
            newTicket.badge="platinum"

        }
        if(badgeType.name.toLowerCase().trim().includes("vip")){
            newTicket.badge="vip"
        }
        if(badgeType.name.toLowerCase().trim().includes("gold a")){
            newTicket.badge="gold-a"
        }
        if(badgeType.name.toLowerCase().trim().includes("gold b")){
            newTicket.badge="gold-b"
        }
        //console.log("badgeType",badgeType.name)
        console.log("newTicket.badge",newTicket.badge)

        response.push(newTicket)
        
    }
    await User.insertMany(response)
    res.status(200).json(response)
})


module.exports = app;