const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chat-app",
    charset: 'utf8mb4'
});

db.connect((err) => {
    if(err) console.log(err);
    else {
        console.log("Connected To MySQL Server");
    }
})

module.exports = db;