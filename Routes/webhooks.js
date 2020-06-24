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
                pageId,
                postback,
                isPost,
                isHandoverMessage,
                metadata,
                fromStandBy
            } = msg;
        console.log(msg);
            if (message) {
                mprocessor.handleMessage(serverURL,sender,message).then((response) =>{
                    sendMessage(sender,response,isPost,pageId);
                }).catch(error => {
                    console.log(error);
                    sendMessage(sender,error,false);
                });
            }
            else if(postback){
                mprocessor.handlePostbacks(serverURL,sender,postback).then((response) =>{
                    sendMessage(sender,response,isPost);
                }).catch(error => {
                    console.log(error);
                    sendMessage(sender,error,false);
                });
            }
            else if(isHandoverMessage)
            {
                if(metadata.message)
                {
                    mprocessor.handleMessage(serverURL,sender,message).then((response) =>{
                        sendMessage(sender,response,isPost);
                    }).catch(error => {
                        console.log(error);
                        sendMessage(sender,error,false);
                    });
                }
                else {
                    mprocessor.handleHandoverMessage(serverURL,sender,metadata).then((response) =>{
                        sendMessage(sender,response,false);
                    }).catch(error => {
                        console.log(error);
                        sendMessage(sender,error,false);
                    });
                }
                
            }
		});
		return next();
    });
    
    function sendMessage(sender, messages, isPost,pageId)
    {
        console.log(messages);
        for(let index=0; index < messages.length ; index ++){
            let m=messages[index];
            if(m.passControl)
            {
                f.passControl(sender,config.fb.OrderAppId,m.metadata);
            }
            else{
                f.txt(sender, m,isPost,pageId);
            }
        }
    }

module.exports = router;