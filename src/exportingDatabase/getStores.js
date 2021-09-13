const mysql = require("mysql2"),
Store = require("../models/Store"),
keys = require("./keys");

try {
    const connection = mysql.createConnection(keys);
    
    const getStores = `SELECT \`stores\`.\`idstores\`,
    \`stores\`.\`region\`,
    \`stores\`.\`zona\`,
    \`stores\`.\`distrito\`,
    \`stores\`.\`tienda\`
    FROM \`registration_db\`.\`stores\`;`
    
    connection.query(getStores, (err, results, fields) => {
        if(err) {
            connection.end()
            console.log(err);
            return;
        }
        results.forEach(e => {
            delete e.idstores
        });
        Store.insertMany(results).then(arr => {
            connection.end()
            console.log("Stores inserted successfully");
        }).catch(e => {
            connection.end()
            console.log(e)
        })
    });
} catch (error) {
    console.log(error)
}
