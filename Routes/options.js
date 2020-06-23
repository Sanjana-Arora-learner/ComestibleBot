'use strict';

const express = require('express');
const path =require('path');
const config=require('../config');
const FBeamer=require('../fbeamer');
const uStore=require('../Store/User-store');
const f=new FBeamer(config.fb);
const router=express.Router();

//For Serving Web Views
router.use( (req, res, next) => {
    console.log('In Web Views: ')
    console.log('Options URL:', req.originalUrl)
    next()
  })

router.get('/', (req, res) => {
    console.log("here");
   let referer = req.get('Referer');
if (referer) {
    if (referer.indexOf('www.messenger.com') >= 0) {
        res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
    } else if (referer.indexOf('www.facebook.com') >= 0) {
        res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
    }
    else{
        res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
    }
    
    
}
res.sendFile(path.resolve("Public","Index.html"));
});

router.get('/optionspostback', (req, res) => {
    let body = req.query;
    console.log(body.selectedItems);
    console.log(body.psid);
    uStore.addGroceryItems(body.psid, body.selectedItems);
    res.status(200).send('Please close this window to return to the conversation thread.');
    let message=
        {
            attachment:{
                type:"template",
                payload:{
                  template_type:"button",
                  text:"Do you wish to Add/Remove any Item? Type 'Add Pasta,Noodles' or 'Remove Pasta,Noodles'",
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
    f.txt(body.psid, message);
});

module.exports = router;