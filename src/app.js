const { Router } = require("express"),
app = Router();

// Models
const User = require("./models/User"),
Store = require("./models/Store"),
UserTagId = require("./models/UserTagId"),
EntranceControl = require("./models/EntranceControl"),
Questionnaire = require("./models/Questionnaire"),
Admonition = require("./models/Admonition"),
Answers = require("./models/Answers");

// Messages
const message = "Success";

app.get("/config-tags", (req, res) => {
    const config = [
        {tag_id:'661c67af',cmd:'CMD_READY'},
        {tag_id:'5cb7cc6d',cmd:'CMD_ADD_POINTS'},
        {tag_id:'842ad83f',cmd:'CMD_SUBSTRACT_POINTS'},
        {tag_id:'800ed83f',cmd:'CMD_SYNC'},
        {tag_id:'eceed73f',cmd:'CMD_SHOW_CONFIG'}
    ]
    res.json(config)
})

app.get("/new-user", (req, res) => {
    const hola = "Hola mundo"
    res.json(hola)
})

// Second sprint: post new User
app.post("/new-user", async (req, res) => {
    try {        
        const newUser = new User(req.body)
        await newUser.validate()
        await newUser.save()
        res.json({message: "success", ...newUser._doc})
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find users by store and first letters of the last name

app.get("/tienda", async (req, res) => {
    try {
        const users = await User.find({
            "organization_role.tienda": req.query.tienda
        })
        console.log(req.query)
        const response = []
        try {
            if(req.query.users){
                users.forEach((e) => {
                    if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                    e.last_name.toLowerCase().startsWith(req.query.users)) {
                        response.push(e)
                    }
                })
                res.json(response)
                return
            } else {
                res.json(users)
                return
            }
        } catch (error) {
            res.json(error)
            return
        }
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


app.get("/users", async (req, res) => {
    try {
        let query = {}
        if(req.query.region && req.query.region.length>0){
            query["organization_role.region"] = req.query.region
            console.log('query',query)
        }
        if(req.query.zona && req.query.zona.length>0){
            query["organization_role.zona"] = req.query.zona
            console.log('query',query)
        }
        if(req.query.distrito && req.query.distrito.length>0){
            query["organization_role.distrito"] = req.query.distrito
            console.log('query',query)
        }
        if(req.query.tienda && req.query.tienda.length>0){
            var regexp = new RegExp( req.query.tienda,'i');
            query["organization_role.tienda"] = regexp
            console.log('query at tienda',query)
        }
        if(req.query.first_name && req.query.first_name.length>0){
            var regexp = new RegExp(req.query.first_name,'i');
            query["first_name"] = regexp
            console.log('query',query)
        }
        if(req.query.last_name && req.query.last_name.length>0){
            var regexp = new RegExp( req.query.last_name,'i');
            query["last_name"] = regexp
            console.log('query',query)
        }
        const users = await User.find(query)
        console.log('req.query',req.query)
        console.log('users',users)

        res.json(users)
        return
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


// Second sprint: find users by store and first letters of the last name

app.get("/region", async (req, res) => {
    try {   

        try {   
            const users = await User.find({
                "organization_role.region": req.query.region
            }).sort(
                [
                    ['organization_role.zona',1],
                    ['organization_role.distrito',1],
                    ['user_role.role',-1],
                    ['organization_role.tienda',1],
                    ['organization_role.area',1]
                ]
            )

            if(users.length === 0){
                res.json({mensaje: "No se encontró a nadie en la búsqueda."})
                return;
            }

            const response = []
            
            if(req.query.users){
                users.forEach((e) => {
                    if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                    e.last_name.toLowerCase().startsWith(req.query.users)) {
                        response.push(e)
                    }
                })
                res.json(response)
                return;
            } else {
                res.json(users)
                return;
            }
        } catch (error) {
            res.json(error)
            return;
        }   

    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find user by id
app.get("/user/:id", async (req, res) => {
    try {
        
        const {id} = req.params
        const user = await User.findById(id)

        if(!user) {
            res.json({mensaje: "No se pudo encontrar al usuario. Verifica que el identificar único sea el correcto y vuelve a intentarlo."})
            return;
        }

        res.json(user)
        return;

    } catch (error) {
        
    }
})


// Third sprint: store registration
app.post("/new-store", async (req, res) => {
    try {        
        const newStore = new Store(req.body);
        await newStore.validate()
        await newStore.save()
        res.json({message: "Nueva tienda creada satisfactoriamente", ...newStore._doc})
    } catch (error) {
        res.json({message: "Ocurrió un error.", error})
    }
})

// Third sprint: get all stores and get stores by its zone, region or distrit
app.get("/stores", async (req, res) => {
    try {        
        if(Object.keys(req.query).length === 0) {
            const stores = await Store.find()
            res.json(stores)
            return;
        } else {
            const { region, zona, distrito } = req.query
            const query = {}

            if(zona){
                query.zona = zona
            }
            if(distrito){
                query.distrito = distrito
            }
            if(region){
                query.region = region
            }

            const stores = await Store.find(query)
            
            if(stores.length === 0) {
                res.json({mensaje: "No se encontró ninguna tienda. Verifica tus datos y vuelve a intentarlo."})
                return;
            }
            
            res.json(stores)
            return;
        }
    } catch (error) {
        res.json(error)
        return;
    }
})

app.get("/tag_id-users/all", async (req, res) => {
    try {        
        if(Object.keys(req.query).length === 0) {

            const users = await UserTagId.find()
            res.json(users)
            return;

        } else {

            const { region, zona, distrito } = req.query
            let query = {}

            if(zona){
                query['organization_role.zona']=zona
            }
            if(distrito){
                query['organization_role.distrito']=distrito
            }
            if(region){
                query['organization_role.region']=region
            }

            const users = await UserTagId.find(query)

            if(users.length === 0) {
                res.json({mensaje: "No se encontró a ningún usuario. Verifica tus datos e inténtalo de nuevo"})
                return;
            }

            res.json(users)
            return;

        }
    } catch (error) {
        res.json(error)
        return;
    }
})

// Fourth sprint: embed user and tag-id
app.post("/tag_id-user", async (req, res) => {
    const usuarioTagId = await UserTagId.findOne({
        tag_id: req.body.tag_id
    })
    if(usuarioTagId){
        res.json({
            mensaje: "Este usuario ya tiene vinculado un tag", 
            ...usuarioTagId._doc
        })
        return;
    } else {
        const theUser = User.findById(req.body.id)
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
                        await newUserTagId.save()
                        res.json(newUserTagId)
                    }catch(err){
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
                            area: "_desconocido",
    
                        }
                    }
                    try {
                        const newUserTagId = new UserTagId(respuesta);
                        await newUserTagId.save()
                        res.json(newUserTagId)
                        return;
                    } catch (error) {
                        res.status(500).json(error)
                        return;
                    }
                }
                
            })
    }
})


// Fourth sprint: get a user by giving it a tag_id
app.get("/tag_id-user", async (req, res) => {
    try {
        const user = await UserTagId.findOne({
            tag_id: req.query.tag_id
        })
        if(!user){
            res.json({mensaje: "No se encontró al usuario, vuelve a intentarlo."})
            return;
        }
        res.json(user)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})


// Fifth sprint: create the entrance and get out
app.post("/new-entrance", (req, res) => {
    try {        
        const user = UserTagId.findOne({
            tag_id: req.body.tag_id
        }).then(async (response) => {
            if(response){
                //! _desconocido
                //! desconoc en caso de tag_id
    
                // TODO: generate empty entrance control, dependiendo de cada ruta; para esta un schema de EntranceControl
                var target = {};
                //TODO: not tag id found
                for (var i in response._doc) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(response._doc, i)) continue;
                    target[i] = response._doc[i];
                }
                const newEntrance = new EntranceControl({
                    ...target,
                    id_lectora: req.body.id_lectora,
                    event_type: req.body.event_type
                })
                await newEntrance.save()
                res.json(newEntrance)
            } else {
                const target = {
                    tag_id: "_descono",
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
                        area: "_desconocido",

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

// Sixth sprint: get array of questionnaries
app.get("/questionnaries", async (req, res) => {
    try {        
        if (Object.keys(req.query).length >= 1) {
            const questionnaires = await Questionnaire.find(req.query);
            if(questionnaires.length === 0){
                res.json({mensaje: "No se encontraron cuestionarios, verifica tus datos."})
                return;
            }
            res.json(questionnaires)
            return;
        } const questionnaires = await Questionnaire.find();
        res.json(questionnaires)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})

// Sixth sprint: post questionnarie
app.post("/questionnarie",async (req, res) => {
    try {        
        const newQuestionnarie = new Questionnaire(req.body);
        await newQuestionnarie.save()
        res.json(newQuestionnarie)
        return;
    } catch (error) {
        res.status(500).json(error)
        return
    }
})

// Seventh sprint: post many admonitions
app.post("/admonitions", async (req, res) => {
    try {
        const funcion = req.body.map(async e => {
            const user = await UserTagId.findOne({tag_id: e.tag_id})
            if(user){
                delete user._id
                console.log(user._id)                    
                let target = {}
                for (var i in user) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(user._doc, i)) continue;
                    target[i] = user[i];
                }
                target.points = e.points
                target.id_lectora = e.id_lectora
                console.log(target)
                return target
            } else {
                const target = new Admonition({
                    tag_id: "_descono",
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
                        area: "_desconocido",

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

// Eighth sprint: post the answers
app.post("/answers", (req, res) => {
    try {        
        const arrayDe = req.body.map( (object, index) => {
            UserTagId.findOne({
                tag_id: req.body[index].tag_id
            }).then(async respuesta => {
                if(respuesta){
                    // * SOLVED
                    //TODO: not tag id found
                    const user = respuesta._doc
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
                    return newAnswer
                } else {
                    const target = new Answers({
                        track: req.body[index].track,
                        preguntas: req.body[index].preguntas,
                        tag_id: "_descono",
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
                            area: "_desconocido",
    
                        }
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
                    return target
                }
            })
            return object
        })
        res.json(arrayDe)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})

module.exports = app;