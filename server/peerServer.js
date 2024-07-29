const express = require('express');
const { PeerServer } = require('peer');
const app = express();
const port = 9000;

// إعداد خادم PeerJS
const peerServer = PeerServer({ port: port, path: '/' });

// بدء الخادم
app.listen(5000, () => {
    console.log(`Server is running on http://localhost:5000`);
});
