'use strict';

const express =require('express');
const config=require('../config');
const FBeamer=require('../fbeamer');
const bodyparser=require('body-parser');
const messageprocessor=require('../Message-Processor');


const router=express.Router();


const f=new FBeamer(config.fb);
const mprocessor= new messageprocessor();

router.use( (req, res, next) => {
    console.log('Request URL:', req.originalUrl)
    console.log('In WebHook: ')
    next()
  })

router.get('/', (req,res,next) => {    
    console.log('Params:', req.query)
    f.registerHook(req,res);
    return next();
});
router.post('/',
	(req, res, next) => {
        var serverURL = 'https://' + req.get('host');
		f.incoming(req, res, msg => {
			// Process messages
            const {
                message,
                sender,
                postback,
                isPost
            } = msg;
        console.log(msg);
            if (message) {
                mprocessor.handleMessage(serverURL,sender,message).then((response) =>{
                    for(let index=0; index < response.length ; index ++){
                        let m=response[index];
                        f.txt(sender, m, isPost);
                    }
                }).catch(error => {
                    console.log(error);
                    f.txt(sender, error);
                });
            }
            if(postback){
                mprocessor.handlePostbacks(serverURL,sender,postback).then((response) =>{
                    for(let index=0; index < response.length ; index ++){
                        let m=response[index];
                        f.txt(sender, m,isPost);
                    }
                }).catch(error => {
                    console.log(error);
                    f.txt(sender, error);
                });
            }
		});
		return next();
	});

module.exports = router;