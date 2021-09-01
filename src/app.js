const { Router } = require("express"),
app = Router();

// Models
const User = require("./models/User"),
Store = require("./models/Store"),
UserTagId = require("./models/UserTagId"),
EntranceControl = require("./models/EntranceControl");

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
app.get("/tienda/:store", async(req,res) => {
    try {
        const {store} = req.params
        const users = await User.find({
            "organization_role.tienda": store
        })
        if(users.length === 0){
            res.json({mensaje: "No se encontró la tienda"})
            return;
        }
        res.json(users)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.get("/tienda/:storeName/user/:name", async (req, res) => {
    try {        
        const { storeName, name } = req.params
        const founded = await User.find({
            "organization_role.tienda": storeName
        });
        if(founded.length === 0){
            res.json({mensaje: "No se encontró la tienda"})
            return;
        }
        let respuesta = [];
        founded.forEach(e => {
            if(e.first_name.toLowerCase().startsWith(name) || e.last_name.toLowerCase().startsWith(name)){
                respuesta.push(e)
            }
        })
        if(respuesta.length === 0) {
            res.json({mensaje: "No se encontró ningún usuario en esta tienda que coincida con la búsqueda."})
            return;
        }
        res.json(respuesta)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


// Second sprint: find users by store and first letters of the last name
app.use("/region/:regionName", async (req, res) => {
    try {        
        const users = await User.find({
            "organization_role.region": req.params.regionName
        })
        if(users.length === 0){
            res.json({mensaje: "No se encontró la región"})
            return;
        }
        res.json(users)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.get("/region/:regionName/user/:name", async (req, res) => {
    try {        
        const { regionName, name } = req.params
        const founded = await User.find({
            "organization_role.region": regionName
        });
        if(founded.length === 0){
            res.json({mensaje: "No se encontró la región"})
            return;
        }
        let respuesta = [];
        founded.forEach(e => {
            if(e.first_name.toLowerCase().startsWith(name) || e.last_name.toLowerCase().startsWith(name)){
                respuesta.push(e)
            }
        })
        if(respuesta.length === 0) {
            res.json({mensaje: "No se encontró ningún usuario en esta tienda que coincida con la búsqueda."})
            return;
        }
        res.json(respuesta)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find user by id
app.get("/user/:id", async (req, res) => {
    const {id} = req.params
    const user = await User.findById(id)
    res.json(user)
})


// Third sprint: store registration
app.post("/new-store", async (req, res) => {
    try {        
        const newStore = new Store(req.body);
        await newStore.validate()
        await newStore.save()
        res.json({message: "New Store created successfully."})
    } catch (error) {
        console.log(error);
        res.json({message: "Ocurrió un error."})
    }
})

// Third sprint: get all stores and get stores by its zone, region or distrit
app.get("/stores", async (req, res) => {
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
        console.log(req.query)
        res.json(stores)
        return;
    }
})


// Fourth sprint: embed user and tag-id
app.post("/tag_id-user", async (req, res) => {
    const theUser = User.findById(req.body.id).then(async (respuesta) => {
        const newUserTagId = new UserTagId({
            tag_id: req.body.tag_id,
            user_id: req.body.id
        })
        await newUserTagId.save()
        res.json({
            message: "Tag-ig and User embedded succesfully"
        })
    })
})


// Fourth sprint: get a user by giving it a tag_id
app.get("/tag_id-user/:tag_id", (req, res) => {
    const user = UserTagId.findOne({
        tag_id: req.params.tag_id
    }).then(async (response) => {
        const usuario = await User.findById(response.user_id)
        const resolved = {
            ...response._doc,
            ...usuario._doc
        }
        res.json(resolved)
    })
})


// Fifth sprint: create the entrance and get out
app.post("/new-entrance", (req, res) => {
    const user = UserTagId.findOne({
        tag_id: req.body.tag_id
    }).then(async (response) => {
        const newEntrance = new EntranceControl({
            tag_id: req.body._id,
            user_id: response._doc.user_id,
            id_lectora: req.body.id_lectora,
            event_type: req.body.event_type
        })
        await newEntrance.save()
        const usuario = await User.findById(response._doc.user_id)
        res.json({
            ...newEntrance._doc,
            ...usuario._doc
        })
    })
})

module.exports = app;