var nodemailer = require('nodemailer');
const config=require('../config');

function sendGroceryListMail(recipient_email, list) {    
    let transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.fb.senderMail,
            pass: config.fb.pass
        }
    });
    
    let emailBody=`Hi, \n\nPlease find below your grocery list:- \n\n\n${list}\nThank you for using our services.\n\nBest Regards,\nComestibleBot\n(Your Indian Groceries List Generator)`

    let message= {
        from: config.fb.senderMail, 
        to: recipient_email,
        subject: "Your Grocery List",
        text: emailBody
    }
    return new Promise((resolve,reject) => {
    transport.sendMail(message, function(err,info){
       
        if(err){
            console.log(err);
            console.log("Failed to send email.\n");
            reject(err);
        }
        else{
            console.log('Email sent: ' + info.response);
            resolve();
        }
    } );
    });
}


module.exports.sendGroceryListMail = sendGroceryListMail;