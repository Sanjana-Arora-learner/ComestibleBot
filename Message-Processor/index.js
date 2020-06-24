'use strict';

const response=require('./Response');
const uStore=require('../Store/User-store');
const mailer=require('../Mailer');

const extractEntity=(nlp,entity)=>{
    let obj=nlp[entity] && nlp[entity][0];
    if(obj && obj.confidence > 0.8)
    {
        return obj.value;
    }
    else{
        return null;
    }
}

module.exports = class MessageProcessor {  
    constructor(){
        this.intent='';
    }  
    handleMessage(serverURL,sender,data) {
        let nlpdata='';
       
        if(data.quick_reply && data.quick_reply.payload)
        {
            if(ValidateEmail(data.quick_reply.payload))
            {
                this.intent="EMAILADDRESS";
            }
            else
            { 
                this.intent=data.quick_reply.payload;               
            }
            nlpdata=data;
        }
        else if(data.nlp && data.nlp.entities)
        {            
            nlpdata=data.nlp.entities;
            let greetings = extractEntity(nlpdata,'greetings');
            let bye = extractEntity(nlpdata,'bye');
            let thanks = extractEntity(nlpdata,'thanks');
            let intent = extractEntity(nlpdata,'intent');
            if(greetings){
                this.intent='GREETINGS';
            }            
            else if(intent){
                this.intent=intent;
            }
            else if(bye){   
                this.intent='BYE';
            }
            else if(thanks){
                this.intent='THANKS';
            }
            else if(data.text)
            {
                if(ValidateEmail(data.text))
                {
                    this.intent="EMAILADDRESS";
                }
                else
                { 
                    this.intent=new String(data.text).toUpperCase();               
                }
                nlpdata=data;   
            }
            else
            {
                this.intent='';
            }
        }
        else if(data.text)
        {
            if(ValidateEmail(data.text))
            {
                this.intent="EMAILADDRESS";
            }
            else
            { 
                this.intent=new String(data.text).toUpperCase();               
            }
            nlpdata=data;            
        }
        else
        {
            this.intent='';
        }
        return GetResponseFromIntent(serverURL,sender,nlpdata,this.intent); 
    
    }
    handlePostbacks(serverURL,sender,message)
    {
        this.intent=message.payload;
        return GetResponseFromIntent(serverURL,sender,message,this.intent);
    }

    handleHandoverMessage(serverURL,sender,message)
    {
        let mess=JSON.parse(message);
        if(mess.orderStatus){ 
            this.intent='ORDERSTATUS';
        }
        return GetResponseFromIntent(serverURL,sender,mess,this.intent);
    } 
}

const GetResponseFromIntent = (serverURL,sender,nlpdata,intent) =>{
    return new Promise(function(resolve, reject) {
    console.log(intent);
    let message=[];
    try {
        switch(intent)
        {
            case 'GREETINGS':
                message.push(createTextResponse(response.constants.welcome));
                message.push(createGreetingsResponse());
                break;
            case 'GenerateNew':
            case 'GetStarted':
                    message=uStore.fetchGroceryListFromDB(sender).then(text => {                           
                        if(text)
                        { 
                            uStore.addGroceryItems(sender,text);
                            let array=[];
                            array.push( {
                                text: response.constants.existingList,
                                quick_replies:[
                                {
                                    content_type:"text",
                                    title:response.constants.createNewList,
                                    payload:"CreateNewList"
                                },
                                {
                                    content_type:"text",
                                    title:response.constants.displayList,
                                    payload:"DisplayList"
                                }
                                ]
                            });
                            return array;
                        }
                        else
                        {
                            return GetResponseFromIntent(serverURL,sender,nlpdata,'CreateNewList');
                        } 
                    }).catch(error => {
                        console.log(error);
                        let err=[];
                        err.push(createTextResponse(response.constants.errorList));
                        err.push(createGreetingsResponse());
                        return err;
                    });
                break;
            case 'CreateNewList':
            case new String(response.constants.createNewList).toUpperCase():
                    //Delete if anything existing 
                    message=uStore.DeleteGroceryListfromDB(sender)
                    .then(() => {
                        uStore.deleteUserGroceryList(sender);
                        let array=[];
                        array.push(createWebviewResponse(serverURL,sender));
                        return array;
                    })
                    .catch(err => {console.log(err)});                    
                
            break;
            case 'DisplayList':
            case new String(response.constants.displayList).toUpperCase():
            case new String('No, Display List').toUpperCase():
                let lresponse=uStore.displayUserList(sender);
                if(lresponse){
                    message.push({
                        text: response.constants.displaying +"\n" +lresponse,
                        quick_replies:[
                        {
                            content_type:"text",
                            title:response.constants.createNewList,
                            payload:"CreateNewList"
                        },
                        {
                            content_type:"text",
                            title:response.constants.modifyList,
                            payload:"ModifyList"
                        },
                        {
                            content_type:"text",
                            title:response.constants.finalList,
                            payload:"FinalList"
                        }
                        ]
                    });
                }
                else {
                    message.push({
                        text: response.constants.noListmsg,
                        quick_replies:[
                        {
                            content_type:"text",
                            title:response.constants.createNewList,
                            payload:"CreateNewList"
                        }
                        ]
                    });
                }
            break;
            case 'ModifyList':
            case new String(response.constants.modifyList).toUpperCase():
                message.push(AddRemoveButton());
            break;        
            case 'Add':
                let gItems = extractEntity(nlpdata,'groceryItem');
                if(gItems){ 
                    uStore.addGroceryItems(sender,gItems); 
                    message.push(createTextResponse(response.constants.actionconfirmation)); 
                    //let reply = response.constants.actionconfirmation + "\n" + response.constants.askMore;
                    message.push(AddRemoveButton(response.constants.askMore));
                } else {    
                    message.push(createTextResponse(response.constants.notdoneconfirmation));   
                    //let reply = response.constants.notdoneconfirmation + "\n" + response.constants.askMore; 
                    message.push(AddRemoveButton(response.constants.askMore));
                }
                
                break;
            case 'Remove':
                let rItems = extractEntity(nlpdata,'groceryItem');
                if(rItems){ 
                    let result = uStore.removeGroceryItems(sender,rItems);
                    let displayedmessage='';
                    if(result.found)
                    {   
                        displayedmessage= `We have removed '${result.found}' Items.`;
                    }
                    if(result.notFound)
                    {
                        displayedmessage= `${displayedmessage}We could not find '${result.notFound}' items in your list.`;
                    }
                    displayedmessage=displayedmessage ? displayedmessage : response.constants.notdoneconfirmation;
                    message.push(createTextResponse(displayedmessage));   
                    //let reply = response.constants.actionconfirmation + "\n" + response.constants.askMore;
                    message.push(AddRemoveButton(response.constants.askMore));                   
                } else {
                    message.push(createTextResponse(response.constants.notdoneconfirmation));
                    //let reply = response.constants.notdoneconfirmation + "\n" + response.constants.askMore; 
                    message.push(AddRemoveButton(response.constants.askMore));
                }                
            break;
            case 'FinalList':
            case new String(response.constants.finalList).toUpperCase():
                message.push({
                    text: response.constants.saveList,
                    quick_replies:[
                    {
                        content_type:"text",
                        title:response.constants.yesSave,
                        payload:"SaveList"
                    },
                    {
                        content_type:"text",
                        title:response.constants.noSave,
                        payload:"NoSaveList"
                    }
                    ]
                });
            break;
            case 'SaveList':
            case new String(response.constants.yesSave).toUpperCase():
                message= uStore.saveGroceryListToDb(sender).then(() => {
                    let array=[];
                    let reply=response.constants.savedconfirmation + "\n" + response.constants.optionsList;
                    array.push(optionsQuickReplyMessage(reply)); 
                    return array;                  
                })
                .catch(err => {
                    console.log(err);
                    let array=[];
                    let reply=response.constants.savedError + "\n" + response.constants.optionsList;
                    array.push(optionsQuickReplyMessage(reply));
                    return array; 
                });
            break;
            case 'NoSaveList':
            case new String(response.constants.noSave).toUpperCase():
                message= uStore.DeleteGroceryListfromDB(sender).then(() => {
                    let array=[];
                    array.push(optionsQuickReplyMessage(response.constants.optionsList)); 
                    return array;                  
                })
                .catch(err => {
                    console.log(err);
                    let array=[];
                    array.push(optionsQuickReplyMessage(response.constants.optionsList));
                    return array; 
                });
            break;
            case 'GetMailAddress':
            case new String(response.constants.mailList).toUpperCase():
            {
                //Ask For Mail Address
                message.push({ 
                    text: response.constants.askMail,
                    quick_replies:[
                    {
                    content_type:"user_email",
                    payload:"EMAILADDRESS"
                  }]
                });
                break;
            }
            case 'EMAILADDRESS':
                let emailAddress='';
                if(nlpdata.quick_reply)
                { 
                    emailAddress=nlpdata.quick_reply.payload;
                    if(!emailAddress || !ValidateEmail(emailAddress))
                    {
                        emailAddress=nlpdata.text;
                    }
                }
                else{
                    emailAddress=nlpdata.text;
                }
                if(emailAddress)
                {
                    let list=uStore.displayUserList(sender);
                    if(list)
                    { 
                        message= mailer.sendGroceryListMail(emailAddress,list).then( () =>{ 
                            let array=[];
                            uStore.deleteUserGroceryList(sender);
                            array.push(createTextResponse(response.constants.mailed));
                            array.push(createTextResponse(response.constants.thankYouFinal))
                            return array;
                        }).catch(err => {
                            let array=[];
                            uStore.deleteUserGroceryList(sender);
                            array.push(createTextResponse(response.constants.optionsError));
                            array.push(createGreetingsResponse());
                            return array;
                        });                    
                    }
                    else{
                        message.push({
                            text: response.constants.noListmsg,
                            quick_replies:[
                            {
                                content_type:"text",
                                title:response.constants.createNewList,
                                payload:"CreateNewList"
                            }
                            ]
                        });
                    }
                }
                else{
                    uStore.deleteUserGroceryList(sender);
                    message.push(createTextResponse(response.constants.optionsError));
                    message.push(createGreetingsResponse());
                }                                
                break;            
            case 'OnlineOrder':
            case new String(response.constants.orderOnline).toUpperCase():
            {
                 //Mail the list and delete from memory
                 let list= uStore.getGroceryList(sender);
                let msg={
                    passControl:true,
                    metadata:list
                };
                message.push(msg);
                message.push(createTextResponse(response.constants.redirectingOnline));                
                break;
            }
            case 'ORDERSTATUS':
            {
                uStore.deleteUserGroceryList(sender);
                if(nlpdata.orderStatus && nlpdata.orderStatus === 'OrderConfirmed'){
                    message.push(createTextResponse(response.constants.orderStatusSuccess));
                    message.push(createTextResponse(response.constants.thankYouFinal));
                }
                else{
                    message.push(createTextResponse(response.constants.optionsError));
                    message.push(createGreetingsResponse());
                }                
                break;
            }
            case 'BYE':
                 //delete from memory
                 uStore.deleteUserGroceryList(sender);
                message.push(createTextResponse(response.constants.bye))
            break;
            case 'THANKS':
                message.push(createTextResponse(response.constants.thanks))
            break;
            default:
                message.push(createTextResponse(response.constants.default));
                message.push(createGreetingsResponse());
            break;
        }
        resolve(message);
    } catch(e){
        console.log("Error occured:"+e);
        message.push(createTextResponse(response.constants.errorList));
        message.push(createGreetingsResponse());
        reject (message);
    }
});
}

//Message when user says "Hi"
const createGreetingsResponse =() =>{
    return {
        attachment:{
            type:"template",
            payload:{
              template_type:"button",
              text:response.constants.welcome1,
              buttons:[
                {
                    type: "postback",
                    title: response.constants.getstarted,
                    payload: "GetStarted"
                }
              ]
            }
          }        
    };

}

//Web View to get consolidated response from user
const createWebviewResponse =(serverURL,sender) =>{
    let url=`${serverURL}/options?sid=${sender}`;
    console.log(url);
    return {
        attachment:{
            type:"template",
            payload:{
              template_type:"button",
              text:response.constants.generateMessage,
              buttons:[
                {
                    type: "web_url",
                    url: url,
                    title: "Click Me",
                    webview_height_ratio: "tall",
                    messenger_extensions: true
                }
              ]
            }
          }        
    };

}

//Generic method for creating text responses
const createTextResponse =(data) =>{
    return {
        text:data
    };

}

//For adding more grocery Items
const AddRemoveButton =(data = response.constants.askMore) =>{
    return {
        attachment:{
            type:"template",
            payload:{
              template_type:"button",
              text:data,
              buttons:[
                {
                    type: "postback",
                    title: "No, Display List",
                    payload: "DisplayList"
                }
              ]
            }
          }        
    };

}

 //options when the user needs to decide what needs to be done further
const optionsQuickReplyMessage = (data) =>{
    return {
        text: data,
        quick_replies:[
          {
            content_type:"text",
            title:response.constants.mailList,
            payload:"GetMailAddress"
          },
          {
            content_type:"text",
            title:response.constants.orderOnline,
            payload:"OnlineOrder"
          }
        ]
      };
}

function ValidateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return (true)
  }
    return (false)
}