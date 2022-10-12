const mysql = require("mysql2"),
{User} = require("../models/User"),
keys = require("./keys");

const getExhibitors = () => {

    try {
        console.log("connection")
        const connection = mysql.createConnection(keys);
        
        const getUsers = `SELECT a.first_name, a.last_name, a.email, c.company_name
            FROM attendee a
            INNER JOIN companies c
            on c.responsable_attendee_id = a.id
            UNION ALL
            SELECT a.first_name, a.last_name, a.email, c.company_name
            FROM registration_db.attendee a 
            INNER JOIN registration_db.companies_has_attendee cha 
            ON a.id = cha.attendee_id 
            INNER JOIN registration_db.companies c
            ON cha.companies_id = c.id
            Order by company_name;`
        
        connection.query(getUsers, (err, results, fields) => {
            if(err) {
                console.log(err)
                connection.end();
                return;
            }
            newUsers=[]
            results.forEach(e => {


                let newUser = {
                    registered_by_user_id: -2,
                    first_name: e.first_name,
                    last_name: e.last_name,
                    email: e.email,
                    identification_img_url: "",
                    identification_img_file_name: "",
                    mobile_number: "",
                    badge: "amarillo",
                    adminuser: "",
                    adminpassword: "",
                    adminsub: "",
                    arrivaldate: "",
                    accessdate: "",
                    limitdate: "",
                    user_role: {
                        role: "asistente"
                    },
                    organization_role: {
                        region: "expositores",
                        zona: "",
                        distrito: "",
                        tienda: e.company_name,
                        area:"",
                        role:""
                    }
                }
                newUsers.push(newUser)

            })
            User.insertMany(newUsers).then(arr => {
                connection.end()
                console.log("All of the users have been downloaded successfully");
            }).catch(e => {
                connection.end()
                console.log(e);
            })
        })
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = getExhibitors
