'use strict';
const sqlite3 = require("sqlite3").verbose();
const path =require('path');

class UserStore
{
    constructor()
    {
        this.userGroceryList = new Map();

       let db=this.connectToDb();
        //table creation
        const sql_create = `CREATE TABLE IF NOT EXISTS UserGroceryList (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            SenderId VARCHAR(200) NOT NULL,
            GroceryList TEXT
          );`;
          
          db.run(sql_create, err => {
            if (err) {
                db.close();
                return console.error(err.message);
            }
          });
          db.close();
    }

    connectToDb()
    {
        const db_name = path.join(__dirname, "../../data", "/userdata.db");
        let db = new sqlite3.Database(db_name, err => {
        if (err) {
            return console.error(err.message);
        }
        });
        return db;
    }
    addGroceryItems (sender,groceryItems) {
        let list='';
        if(this.userGroceryList.has(sender))
        {
            list=this.userGroceryList.get(sender);
        }
        let items =groceryItems.split(",");
        let text='';
        items.forEach(element => {
            let smallEle=element.toLowerCase();
            text=text+","+smallEle;
        });
        text=text.substring(1, text.length);
        list=list ? list+","+text: text;
        //let moreItems=groceryItems.split(",");
        //list.push(moreItems);
        if(list){ 
        this.userGroceryList.set(sender,list);
        }
    }
    
    removeGroceryItems (sender,groceryItems) {
        let found='';
        let notFound='';
        let list='';
        if(this.userGroceryList.has(sender))
        {
            list=this.userGroceryList.get(sender);
        }
        if(list)
        {
            let newList=list.split(",");
            let moreItems=groceryItems.split(",");
            moreItems.forEach(element => {
                let ele=element.toLowerCase();
                const index = newList.indexOf(ele);
                if (index !== -1) {
                    newList.splice(index, 1);
                    found=`${found} , ${ele}`;
                }
                else{
                    notFound=`${notFound} , ${ele}`;
                }
            });
            if(newList)
            { 
                let newValues=newList.join(",");
                this.userGroceryList.set(sender,newValues);
            }
            found=found.substring(2,found.length);
            notFound=notFound.substring(2,notFound.length);
        }
        return {
            found,
            notFound
        };
    }
    
    deleteUserGroceryList (sender) {
        if(this.userGroceryList.has(sender))
        {
            this.userGroceryList.delete(sender);
            return 1;
        }
        return -1;
    }
    
    displayUserList (sender){        
        let text='';
        if(this.userGroceryList.has(sender))
        { 
            let list=this.userGroceryList.get(sender);        
            if(list)
            {
                let newList=list.split(",");
                let uniquelist=Array.from(new Set(newList));
                uniquelist.forEach((element,index) => {
                    let capitalizedLetter=element.charAt(0).toUpperCase() + element.slice(1);
                    text=text + `${index +1}. ${capitalizedLetter}\n`;
                }); 
                //text=uniquelist.join('\n'); 
            }
        }
        return text;
    }

    checkIfGroceryListAvailable(sender)
    {
        return this.userGroceryList.has(sender);
    }

    //DB Operations
    saveGroceryListToDb(sender){
        let list=this.userGroceryList.get(sender);
        let newList=list.split(","); 
        let updatedlist=Array.from(new Set(newList));              
        let text=updatedlist.join(',');
        let db=this.connectToDb();
        return new Promise(function(resolve, reject) { 
        const sql_insert = `INSERT OR REPLACE INTO UserGroceryList (SenderId, GroceryList) VALUES ('${sender}','${text}');`;
        db.run(sql_insert, err => {
            if(err){
                db.close();
                reject(err);
            } 
            db.close();
            resolve();
        });       
    });
    }

    DeleteGroceryListfromDB(sender){
        let db=this.connectToDb();
        return new Promise(function(resolve, reject) { 
        const sql_deleted = `DELETE FROM UserGroceryList WHERE SenderId ='${sender}';`;
        db.run(sql_deleted, err => {
            if(err){
                db.close();
                reject(err);
            } 
            db.close();
            resolve();
        });        
    });
    }

    updateGroceryListInDb(sender){
        let list=new Set(this.userGroceryList.get(sender)); 
        let newList=list.split(","); 
        let updatedlist=Array.from(new Set(newList));        
        let text=updatedlist.join(',');
        let db=this.connectToDb();
        return new Promise(function(resolve, reject) {
            const sql_update = `UPDATE UserGroceryList SET GroceryList= '${text}' WHERE SenderId ='${sender}';`;
            db.run(sql_update, err => {
                if(err){
                    db.close();
                    reject(err);
                } 
                db.close();
                resolve();
            });            
        });
    }

    fetchGroceryListFromDB(sender){
        if(this.checkIfGroceryListAvailable(sender)){
            this.deleteUserGroceryList(sender);
        }
        let text='';
        let db=this.connectToDb();
        return new Promise(function(resolve, reject) {
            
            const sql_fetch = `SELECT * FROM UserGroceryList WHERE SenderId ='${sender}';`;
            db.get(sql_fetch, (err, row) => { 
                if(err){
                    db.close();
                    reject(err);
                }           
                if(row)
                { 
                    text=row.GroceryList;                                              
                }
                db.close();
                resolve(text);
            });
        });        
    }
}


const USER_STORE = new UserStore();
module.exports=USER_STORE;