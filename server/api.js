const express = require("express");
const router = express.Router();
const db = require("./connect");
const multer = require("multer");
const bcrypt = require("bcrypt");
const axios = require('axios');
const { OAuth2Client } = require("google-auth-library");
const { checkReferer, generateUniqueTokenUsers, generateUniqueCodeUsers, CheckEmailIsReal, generateUniqueTokenMessages } = require("./functions");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const imagesAllowed = ['image/png', 'image/jpeg'];

const client = new OAuth2Client('286400183504-sqg1fpfgd3q7kbhr6u8ff3n9uvdm3p73.apps.googleusercontent.com');

router.post("/log-in", checkReferer, (req, res) => {
    const { email, password } = req.body;

    if(email.trim() === '' && password.trim() === ''){
        return res.json({ message: 'All Inputs Are Empty!' });
    }else{
        if(email.trim() === ''){
            return res.json({ message: 'Email Is Empty!' });
        }else if(!CheckEmailIsReal(email)){
            return res.json({ message: 'Email Isnot Real!' });
        }else if(password.trim() === ''){
            return res.json({ message: 'Password Is Empty!' });
        }else{
            db.query("SELECT token, username, password FROM users WHERE email = ?", [email], async (err, data) => {
                if(err){
                    console.log(err);
                    return res.json({ message: "Something Went Wrong!" })
                }

                if(data.length > 0){
                    const hashedPassword = data[0].password;

                    try{
                        if(hashedPassword){
                            if(await bcrypt.compare(password, hashedPassword)){
                                res.cookie("user-token", btoa(data[0].token), {
                                    maxAge: (1000 * 60 * 60 * 24 * 365) * 10,
                                    sameSite: 'lax',
                                    httpOnly: true,
                                    secure: true
                                })
                                return res.json({ message: `Success, And Welcome ${data[0].username}` });
                            }else{
                                return res.json({ message: "Not Found The User!" })
                            }
                        }else{
                            return res.json({ message: "Not Found The User!" })
                        }
                    }catch(err){
                        // console.log(err);
                        return res.json({ message: "Something Went Wrong!" })
                    }
                }else{
                    return res.json({ message: "Not Found The User!" })
                }
            })
        }
    }
})

router.post("/sign-up", checkReferer, upload.single("image"), (req, res) => {
    const { username, email, password } = req.body;
    const image = req.file;

    if(!username.trim() && !email.trim() && !password.trim() && !image){
        return res.json({ message: 'All Inputs Are Empty!' });
    }else{
        if(!username.trim()){
            return res.json({ message: 'Username Is Empty!' });
        }else if(!email.trim()){
            return res.json({ message: 'Email Is Empty!' });
        }else if(!CheckEmailIsReal(email)){
            return res.json({ message: 'Email Isnot Real!' });
        }else if(!password.trim()){
            return res.json({ message: 'Password Is Empty!' });
        }else if(!image){
            return res.json({ message: 'Image Is Empty!' });
        }else if(!imagesAllowed.includes(image.mimetype)){
            return res.json({ message: 'File is not an image!' });
        }else{
            db.query("SELECT COUNT(*) AS count FROM users WHERE email = ?", [email], async (err, data) => {
                if(err){
                    console.log(err);
                    return res.json({ message: "Something Went Wrong!" })
                }

                if(data[0].count > 0){
                    return res.json({ message: "The Email Is Already Exits!" })
                }

                const blob = image.buffer.toString("base64");
                const token = await generateUniqueTokenUsers();
                const code = await generateUniqueCodeUsers();
                const hashedPassword = await bcrypt.hash(password, 10);
    
                db.query("INSERT INTO users (token, code, username, email, password, image) VALUES(?, ?, ?, ?, ?, ?)", 
                [token, code, username, email, hashedPassword, blob], (err, data) => {
                    if(err){
                        console.log(err);
                        return res.json({ message: "Something Went Wrong!" })
                    }
    
                    res.cookie("user-token", btoa(token), {
                        maxAge: (1000 * 60 * 60 * 24 * 365) * 10,
                        secure: true,
                        sameSite: "lax",
                        httpOnly: true
                    })
                    return res.json({ message: `Success, And Welcome ${username}` });
                })
            })
        }
    }
})

router.post('/auth/google/callback', checkReferer, async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '286400183504-sqg1fpfgd3q7kbhr6u8ff3n9uvdm3p73.apps.googleusercontent.com',
        });

        const { name, email, picture } = ticket.getPayload();

        const imageResponse = await axios.get(picture, { responseType: 'arraybuffer' });
        const blob = Buffer.from(imageResponse.data, 'binary').toString('base64');
        
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, data) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ message: 'Something Went Wrong!' });
            }

            if (data.length > 0) {
                const user = data[0];
                res.cookie("user-token", btoa(user.token), { 
                    maxAge: ((1000 * 60 * 60 * 24 * 365) * 10),
                    sameSite: "lax",
                    httpOnly: true,
                    secure: true
                });
                return res.json({ message: `Success, And Welcome ${user.username}` });
            } else {
                const token = await generateUniqueTokenUsers();
                const code = await generateUniqueCodeUsers();
                db.query("INSERT INTO users (token, code, username, email, image) VALUES(?, ?, ?, ?, ?)", [token, code, name, email, blob], (err, result) => {
                    if (err) {
                        console.error('Database query error:', err);
                        return res.status(500).json({ message: 'Something Went Wrong!' });
                    }

                    res.cookie("user-token", btoa(token), { 
                        maxAge: ((1000 * 60 * 60 * 24 * 365) * 10),
                        sameSite: "lax",
                        httpOnly: true,
                        secure: true
                    });
                    return res.json({ message: `Success, And Welcome ${name}` });
                });
            }
        });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        return res.status(500).json({ message: 'Invalid Google token' });
    }
});

router.post("/log-out", checkReferer, (req, res) => {
    res.clearCookie("user-token", { path: "/", sameSite: "lax", secure: true });
    return res.json({ message: "Logout Successful" })
})

router.post("/log-in-status", checkReferer, (req, res) => {
    const { userData } = req.body;
    const token = req.cookies["user-token"];
    if(token?.trim()){
        const tokenAtob = atob(token);
        db.query("SELECT token, username, email, image, code FROM users WHERE token = ?", [tokenAtob], (err, data) => {
            if(err){
                console.log(err);
                return res.json({ isLoggedIn: false });
            }

            if(data.length > 0){
                if(!userData){
                    return res.json({ isLoggedIn: true });
                }else{
                    return res.json({ isLoggedIn: true, user: data[0] });
                }
            }else{
                res.clearCookie("user-token");
                return res.json({ isLoggedIn: false });
            }
        })
    }else{
        return res.json({ isLoggedIn: false });
    }
})

router.get("/users", checkReferer, (req, res) => {
    const token = req.cookies["user-token"];
    if (token) {
        const clientToken = atob(token);
        db.query(`
        SELECT 
            u.username, 
            u.image, 
            u.code,
            COALESCE(COUNT(m.id), 0) AS unreadCount,
            lastMessage.message AS lastMessage,
            lastMessage.date AS lastMessageDate,
            lastMessage.from_user_code AS lastMessageFromUserCode
        FROM users u
        LEFT JOIN messages m
            ON m.to_user_code = (SELECT code FROM users WHERE token = ?)
            AND m.is_read = FALSE
            AND m.from_user_code = u.code
        LEFT JOIN (
            SELECT 
                message,
                date,
                from_user_code,
                to_user_code
            FROM messages
            WHERE (to_user_code = (SELECT code FROM users WHERE token = ?)
            OR from_user_code = (SELECT code FROM users WHERE token = ?))
            ORDER BY date DESC
            LIMIT 1
        ) lastMessage
            ON (lastMessage.from_user_code = u.code AND lastMessage.to_user_code = (SELECT code FROM users WHERE token = ?))
            OR (lastMessage.to_user_code = u.code AND lastMessage.from_user_code = (SELECT code FROM users WHERE token = ?))
        WHERE u.token != ?
        GROUP BY u.code, u.username, u.image, lastMessage.message, lastMessage.date, lastMessage.from_user_code
        `, [clientToken, clientToken, clientToken, clientToken, clientToken, clientToken], (err, users) => {
            if (err) {
                console.log(err);
                return res.json({ message: "Something Went Wrong!" });
            }

            if (users.length <= 0) {
                return res.json({ message: "Not Found Any Users!" });
            }

            return res.json({ message: "Success", users });
        });
    }
});

router.patch("/user/:token", checkReferer, upload.single("image"), async (req, res) => {
    const { username, email, password } = req.body;
    const image = req.file;
    const { token } = req.params;
    const tokenAtob = atob(token);

    if(!username.trim()){
        return res.json({ message: 'Username Is Empty!' });
    }else{
        let query = "UPDATE users SET username = ?";
        let params = [username];
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);

            query += ", password = ?";
            params.push(hashedPassword);
        }

        let blob;

        if(image){
            if(imagesAllowed.includes(image.mimetype)){
                blob = image.buffer.toString("base64");

                query += ", image = ?";
                params.push(blob);
            }
        }
    
        query += " WHERE email = ? AND token = ?";
        params.push(email, tokenAtob);
    
        db.query(query, params, (err, data) => {
            if (err) {
                console.log(err);
                return res.json({ message: "Something Went Wrong!" });
            }
    
            return res.json({ message: "Success", blob: blob ? blob : null });
        });
    }
});

router.get("/user/:code", checkReferer, (req, res) => {
    const { code } = req.params;
    if(code){
        const codeAtob = atob(code);

        db.query("SELECT id, username, image FROM users WHERE code = ?", [codeAtob], (err, data) => {
            if(err){
                console.log(err);
                return res.json({ message: "Something Went Wrong!" })
            }
    
            if(data.length <= 0){
                return res.json({ message: "Not Found The User!" })
            }
    
            return res.json({ message: "Success", user: data[0] });
        })
    }else{
        return res.json({ message: "Not Found" });
    }
})

router.post("/user/:toUserCode/message", checkReferer, upload.single('audio'), async (req, res) => {
    const { message, fromUserCode } = req.body;
    const { toUserCode } = req.params;
    const audioFile = req.file;

    if (!fromUserCode || !toUserCode) {
        return res.json({ message: "Something Went Wrong!" });
    }

    if (message.trim() === '' && !audioFile) {
        return res.json({ message: "Message Is Empty!" });
    } else {
        const toUserCodeAtob = atob(toUserCode);
        const token = await generateUniqueTokenMessages();
        const date = new Date().toISOString();
        let blobAudio;

        if(audioFile){
            blobAudio = audioFile.buffer.toString("base64");
        }

        db.query("INSERT INTO messages (token, from_user_code, message, to_user_code, date, audio) VALUES(?, ?, ?, ?, ?, ?)",
            [token, fromUserCode, message, toUserCodeAtob, date, blobAudio ? blobAudio : null],
            (err, data) => {
                if (err) {
                    console.log(err);
                    return res.json({ message: "Something Went Wrong!" });
                }
    
                return res.json({ message: "Success" });
            }
        );
    }
});

router.post("/user/:toUserCode/messages", checkReferer, (req, res) => {
    const { toUserCode } = req.params;
    const { fromUserCode } = req.body;

    if(!fromUserCode || !toUserCode){
        return res.json({ message: "Something Went Wrong!" });
    }

    const toUserCodeAtob = atob(toUserCode);

    db.query("SELECT * FROM messages WHERE (from_user_code = ? AND to_user_code = ?) OR (from_user_code = ? AND to_user_code = ?) ORDER BY id",
        [toUserCodeAtob, fromUserCode, fromUserCode, toUserCodeAtob], (err, messages) => {
        if(err){
            console.log(err);
            return res.json({ message: "Something Went Wrong!" })
        }

        if(messages.length <= 0){
            return res.json({ message: "Not Found Any Message!" });
        }

        return res.json({ message: "Success", messages });
    })
})

router.post("/user/:userCode/messages/read", (req, res) => {
    const { userCode } = req.params;
    const { fromUserCode } = req.body;

    if (!userCode || !fromUserCode) {
        return res.json({ message: "Invalid request" });
    }

    db.query(`
        UPDATE messages
        SET is_read = TRUE
        WHERE to_user_code = ? AND from_user_code = ? AND is_read = FALSE
    `, [userCode, fromUserCode], (err) => {
        if (err) {
            console.log(err);
            return res.json({ message: "Error updating messages" });
        }

        return res.json({ message: "Messages marked as read" });
    });
})

module.exports = router;