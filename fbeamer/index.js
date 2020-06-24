const crypto=require('crypto');
const request=require('request');
const apiVersion='v7.0';

class FBeamer
{
    constructor({pageAccessToken,verifyToken,appSecret}) {
        try{
            if(pageAccessToken && verifyToken){
                this.pageAccessToken=pageAccessToken;
                this.verifyToken=verifyToken;
                this.appSecret=appSecret;
            }else{
                throw "One or more token is missing";
            }

        }catch (e){
            console.log(e);
        }
    }
    registerHook(req,res){
        const params=req.query;
        const mode =params['hub.mode'],
        token=params['hub.verify_token'],
        challenge=params['hub.challenge'];
        try{
            if((mode && token) && (mode === 'subscribe' && token === this.verifyToken)){
                console.log("Webhook registered");
                return res.send(challenge);
            }
            else{
                throw "Unable to register Webhook";
                return res.sendStatus(200);
            }

        }catch(e){
            console.log(e);
        }
    }
    verifySignature(req, res, next) {
        let rawData = '';       
        
        if(req.method === 'POST') {
            req.setEncoding('utf8');
            req.on('data', function(data) {
                rawData += data;
            });
            let hash = crypto.createHmac('sha1', this.APP_SECRET).update(rawData).digest('hex');
            let signature = req.headers['x-hub-signature'];
            if(hash !== signature.split("=")[1]) {
                // Implement a logging and notification mechanism
                console.error("ERROR: INVALID SIGNATURE");
            }
            
        }
        return next();
    }
    incoming(req,res,cb){
        res.sendStatus(200);
        if(req.body.object === 'page' && req.body.entry)
        {
            let data = req.body;
            data.entry.forEach(pageObj =>{
                console.log(pageObj);
                if(pageObj.standby){
                    let msgEvent=pageObj.standby[0];
                        console.log(msgEvent);
                        let obj={
                            recipient:{
                                id:msgEvent.sender.id
                            },
                            metadata:'Taking COntrol'
                        };
                        this.takeThreadControl(obj).catch(error => console.log(error))
                        let messageObj='';
                        if(msgEvent.message){
                            messageObj={
                            sender: msgEvent.sender.id,
                            pageId:msgEvent.recipient.id,
                            timeOfMessage: msgEvent.timestamp,
                            message: msgEvent.message,
                            postback:msgEvent.postback,
                            fromStandBy:true
                            }
                        }
                        cb(messageObj);
                }
                if(pageObj.messaging){
                    pageObj.messaging.forEach(msgEvent => {
                        console.log(msgEvent);  
                        let messageObj='';
                        if(msgEvent.message){
                            messageObj={
                            sender: msgEvent.sender.id,
                            pageId:msgEvent.recipient.id,
                            timeOfMessage: msgEvent.timestamp,
                            message: msgEvent.message
                            }
                        }
                        if(msgEvent.postback){
                            messageObj={
                            sender: msgEvent.sender.id,
                            pageId:msgEvent.recipient.id,
                            timeOfMessage: msgEvent.timestamp,
                            postback:msgEvent.postback
                            }
                        }
                        else if(msgEvent.pass_thread_control){ 
                            messageObj = {
                                sender: msgEvent.sender.id,
                                timeOfMessage: msgEvent.timestamp,
                                OwnerAppId: msgEvent.pass_thread_control.new_owner_app_id,
                                metadata:msgEvent.pass_thread_control.metadata,
                                isHandoverMessage:true
                            }
                        }
                        if(msgEvent.field && msgEvent.field === 'feed')
                        {
                            messageObj = {
                                sender: msgEvent.value.post_id,
                                timeOfMessage: msgEvent.value.created_time,
                                message: msgEvent.value.message,
                                isPost:true
                            }
                        }
                        cb(messageObj);
                    });
                }
            });
        }
    }   
    sendMessage(payload){
        return new Promise( (resolve, reject) => {
            request({
                uri:`https://graph.facebook.com/${apiVersion}/me/messages`,
                qs:{
                    access_token:this.pageAccessToken
                },
                method:'POST',
                json:payload
            },(error,response,body) => {
                if(!error && response.statusCode === 200){
                    resolve({
                        messageId:body.message_id
                    });
                }else {
                    reject(error);
                }
            })
        });
    }

    passThreadControl(payload){
        return new Promise( (resolve, reject) => {
            request({
                uri:`https://graph.facebook.com/${apiVersion}/me/pass_thread_control`,
                qs:{
                    access_token:this.pageAccessToken
                },
                method:'POST',
                json:payload
            },(error,response,body) => {
                if(!error && response.statusCode === 200){
                    resolve({
                        messageId:body.message_id
                    });
                }else {
                    reject(error);
                }
            })
        });
    } 

    takeThreadControl(payload){
        return new Promise( (resolve, reject) => {
            request({
                uri:`https://graph.facebook.com/${apiVersion}/me/take_thread_control`,
                qs:{
                    access_token:this.pageAccessToken
                },
                method:'POST',
                json:payload
            },(error,response,body) => {
                if(!error && response.statusCode === 200){
                    resolve({
                        messageId:body.message_id
                    });
                }else {
                    reject(error);
                }
            })
        });
    } 

    txt(id,message,isPost=false,pageId=''){
        let obj={
            recipient:{
                id
            },
            message:message
        };
        if(isPost)
        {
            obj={
                recipient:{
                    post_id:id
                },
                message:message
            };
        }

            if(pageId)
            {
                obj={
                    recipient:{
                        id
                    },
                    sender: {
                        id: pageId
                      },
                    message:message
                };
            }
        return this.sendMessage(obj).catch(error => console.log(error));
    }
    
    passControl(id,target_app_id,metadata)
    {
        let obj={
            recipient:{
                id
            },
            target_app_id:target_app_id,
            metadata:metadata
        };
        console.log(obj);
        return this.passThreadControl(obj).catch(error => console.log(error));
    }
}
module.exports=FBeamer;