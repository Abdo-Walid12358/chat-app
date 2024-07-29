const crypto = require('crypto');
const db = require('./connect');

const checkReferer = (req, res, next) => {
    const referer = req.header('Referer');
    if (referer && referer.startsWith('http://localhost:3000')) {
        next();
    } else {
        res.sendStatus(403);
    }
};  

async function generateUniqueTokenUsers() {
    try {
        let token;
        do {
            const randomBytes = crypto.randomBytes(16);
            token = randomBytes.toString('hex');
        } while (await tokenExistsInDatabaseUsers(token));
        return token;
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
}

function tokenExistsInDatabaseUsers(token) {
    return new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM users WHERE token = ?", [token], (err, results) => {
            if (err) {
                return reject(err);
            }
            const count = results[0].count;
            resolve(count > 0);
        });
    });
}

async function generateUniqueCodeUsers() {
    try {
        let code;
        do {
            const randomBytes = crypto.randomBytes(16);
            code = randomBytes.toString('hex');
        } while (await codeExistsInDatabaseUsers(code));
        return code;
    } catch (error) {
        throw new Error('Error generating code: ' + error.message);
    }
}

function codeExistsInDatabaseUsers(code) {
    return new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM users WHERE code = ?", [code], (err, results) => {
            if (err) {
                return reject(err);
            }
            const count = results[0].count;
            resolve(count > 0);
        });
    });
}

async function generateUniqueTokenMessages() {
    try {
        let token;
        do {
            const randomBytes = crypto.randomBytes(36);
            token = randomBytes.toString('hex');
        } while (await tokenExistsInDatabaseMessages(token));
        return token;
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
}

function tokenExistsInDatabaseMessages(token) {
    return new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM messages WHERE token = ?", [token], (err, results) => {
            if (err) {
                return reject(err);
            }
            const count = results[0].count;
            resolve(count > 0);
        });
    });
}

function CheckEmailIsReal(email){
    const filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    
    if(filter.test(email))
        return true;
    else
        return false;
}

module.exports = {
    checkReferer,
    generateUniqueTokenUsers,
    generateUniqueCodeUsers,
    generateUniqueTokenMessages,
    CheckEmailIsReal,
};