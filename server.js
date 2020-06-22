'use strict';

const express =require('express');
const path =require('path');
const favicon =require('serve-favicon');
const bodyparser=require('body-parser');
const cookieParser =require('cookie-parser');
const index = require('./Routes/options');
const webhooks = require('./Routes/webhooks');
var cors = require("cors");


//Server Settings
const server=express();
const PORT= process.env.PORT || 3000;

//Use the Static assets
server.use(favicon(path.join(__dirname, '/Public', '/favicon.ico')));
server.use(express.static("Public"));

server.use(bodyparser.json());
server.use(bodyparser.urlencoded({extended: false}));
server.use(cookieParser());

server.use(cors());

//Routes
server.use('/webhook',webhooks);
server.use('/options',index);

server.listen(PORT, () => console.log(`FBeamer Bot Service running on PORT : ${PORT}`));