const express = require("express");
const app = express();
const apiRoutes = require("./api");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const WebSocket = require("ws");
const http = require("http");
const MySQLEvents = require('@rodrigogs/mysql-events');
const db = require("./connect");
const PeerServer = require('peer').PeerServer;
const port = 5000;

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", apiRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on("connection", () => {
    // console.log('New WebSocket connection');
})

const peerServer = PeerServer({ port: 9000, path: '/' });

peerServer.on('connection', (client) => {
    console.log('PeerJS client connected');
});

server.listen(port, () => {
    console.log(`Server Is Running At https://localhost:${port}`);
    setupMySQLEvents();
})

const setupMySQLEvents = async () => {
    const instance = new MySQLEvents(db, {
        startAtEnd: true,
    });

    await instance.start();

    instance.addTrigger({
        name: 'USER_CHANGES',
        expression: 'chat-app.users.*',
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: (event) => {
            const { type, affectedRows } = event;
            let dataToSend;

            if (type === 'INSERT') {
                dataToSend = { user: affectedRows[0].after };
            } else if (type === 'UPDATE') {
                dataToSend = { user: affectedRows[0].after, update: true };
            } else if (type === 'DELETE') {
                dataToSend = { userCode: affectedRows[0].before.code, delete: true };
            }

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(dataToSend));
                }
            });
        },
    });

    instance.addTrigger({
        name: 'MESSAGE_CHANGES',
        expression: 'chat-app.messages.*',
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: (event) => {
            const { type, affectedRows } = event;
            let dataToSend;

            if (type === 'INSERT') {
                dataToSend = { message: affectedRows[0].after };
            } else if (type === 'UPDATE') {
                dataToSend = { message: affectedRows[0].after, update: true };
            } else if (type === 'DELETE') {
                dataToSend = { message: affectedRows[0].before, delete: true };
            }

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(dataToSend));
                }
            });
        },
    });

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};