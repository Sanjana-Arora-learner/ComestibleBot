'use strict';

if(process.env.Node_ENV === 'PRODUCTION')
{
    module.exports = {
        fb :
        {
            pageAccessToken:process.env.pageAccessToken,
            verifyToken:process.env.verifyToken,
            appSecret:process.env.appSecret,
            senderMail:process.env.senderMail,
            pass:process.env.pass
        }
    }
}