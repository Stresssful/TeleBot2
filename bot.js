// <-------Requires------->
require('dotenv').config(); 
var request = require('request');
var cheerio = require('cheerio');
var TelegramBot = require('node-telegram-bot-api');
var mongoClient = require('mongodb').MongoClient;


// <-------Constants------->
var helpText='Привіт! Я бот, який може відслідковувати заміни для студентів ХПК. Просто напиши мені назву групи, про заміни якої ти хочеш дізнатись.';
    helpText+='\n\n';
    helpText+='Якщо ж ти хочеш отримувати повідомлення кожен раз, коли на сайті ХПК виходять заміни - натисни на кнопку "Відслідковувати групу".';
    helpText+='\n\n';
    helpText+='Також у мене є деякі команди:\n/my - Переглянути мої заміни;\n/remove - Не відслідковувати групу;\n/help - Переглянути це повідомлення з інструкцією.';
    helpText+='\nЗ питаннями та пропозиціями звертатись до @Stressful_Courtier.';

const baseUri = "mongodb+srv://admin:administrator@botdb.zctxy.azure.mongodb.net/<dbname>?retryWrites=true&w=majority";
const replacementsUri = 'http://hpk.edu.ua/replacements';

const databaseName = "BotDB";
//const databaseName = "BotDB_PTR";   //DEBUG

const usersCollectionName = "Users";
const lastUpdateCollectionName = "Last_update";
const usersCopyCollectionName = "Users_cpy";

const admins=[310694905];

const token = process.env.TOKEN;
//const token = '418440998:AAGpggVT2H3_4am1qZmwoNaQ5BEUS6-UEzg';    //DEBUG TOKEN


// <-------Setting up bot and mongo client------->
var client = new mongoClient(baseUri, { useNewUrlParser: true });
client.connect();

var bot = new TelegramBot(token, {polling: true});

setInterval(intervalFunc, 900000);// Перевірка наявності оновлень (900000 - 15 хв, 3600000 - 1 год) 
//setInterval(intervalFunc, 5000); //Перевірка наявності оновлень (DEVELOP)


// <-------Bot methods------->
bot.onText(/^\D\D-\d\d\d$/, function(msg, match) { // \D - буква; \d - цифра
    let fromId = msg.from.id;
    let Group = match[0].toUpperCase();

    let options = {
        reply_markup: JSON.stringify(
        {
            inline_keyboard: [
                [{ text: 'Відслідковувати групу', callback_data: Group+":subscribe" }],
                [{ text: 'Поширити друзям', switch_inline_query: " - Бот для відслідковування замін в розкладі ХПК." }],             
            ]
        })
    };

    getReplacements(Group, function(err, msg){bot.sendMessage(fromId,msg,options)});      
});

bot.onText(/\/my/, function(msg, match) { //команда \my
    let fromId = msg.from.id;
    let options = {
        reply_markup: JSON.stringify(
        {
            inline_keyboard: 
            [
                [{ text: 'Поширити друзям', switch_inline_query: " - Бот для відслідковування замін в розкладі ХПК." }],             
            ]
        })
    };

    let collection = client.db(databaseName).collection(usersCollectionName);
    let query = {id: fromId};
    collection.findOne(query, async function(err, doc){
        if (err) throw err;
        if(doc==null)bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу!");
        else
        {
            let group=doc.Group;
            getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg, options)});
        }
    });
});

bot.onText(/\/remove/, function(msg, match) { //команда \remove
    let fromId = msg.from.id;
    let collection = client.db(databaseName).collection(usersCollectionName);
    let query = {id: fromId};
    collection.findOneAndDelete(query, async function(err, doc){
        if (err) 
            throw err;
        if(doc.value==null)
            bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу!");
        else
        {
            let group=doc.value.Group;
            let adminNotify = "Користувач відписався\n";
            adminNotify += msg.from.id +'\n';
            adminNotify += msg.from.username + ': ' + msg.from.first_name + ' ' + msg.from.last_name+'\n';
            adminNotify += "Група: " + group;
            messageAdmin(adminNotify);

            bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу.");
        }
    });
});

bot.onText(/\/start/, function(msg, match) { //команда \start
    let fromId = msg.from.id;
    let text=helpText;
    bot.sendMessage(fromId, text);
});

bot.onText(/\/help/, function(msg, match) {//команда \help
    let fromId = msg.from.id;
    let text=helpText;
    bot.sendMessage(fromId, text);
});

bot.onText(/\/count/, async function(msg, match) { //команда \count
    let fromId = msg.from.id;      
    let collection = client.db(databaseName).collection(usersCollectionName);
    let count = await collection.countDocuments();
    bot.sendMessage(fromId,"Нас вже "+count+"!");
});

bot.onText(/^\/yell(.*|\n)*$/, async function(msg, match) {
    let fromId = msg.from.id;
    if(admins.indexOf(fromId) != -1 )
    {
        let text = msg.text.substr(5);

        let collection = client.db(databaseName).collection(usersCollectionName);
        let allValues = await collection.find({}).toArray();
        for(let i=0; i<allValues.length;i++)
        {          
            bot.sendMessage(allValues[i].id,text);
        } 
    }
});

bot.on('callback_query', async function (msg) { //обробка кнопок відслідкувати або переглянути заміну
    let query = msg.data.split(':');
    let group = query[0];
    let action = query[1];
    let adminNotify="";

    await addToBase(msg.from.id, group, msg.from.username);
    bot.sendMessage(msg.from.id, "Ви відслідковуєте групу "+group+".");

    adminNotify += "Користувач підписався\n";
    adminNotify += msg.from.id +'\n';
    adminNotify += msg.from.username + ': ' + msg.from.first_name + ' ' + msg.from.last_name+'\n';
    adminNotify += "Група: " + group;      

    let collection = client.db(databaseName).collection(usersCollectionName);
    let count = await collection.countDocuments();
    adminNotify += "\n---------------------------\n";
    adminNotify += "Нас вже "+count+"!";

    messageAdmin(adminNotify);
});



// <-------Parsing functions------->
function getReplacements(GROUP, callback)
{    	
    request({uri:replacementsUri, method:'GET', encoding:'utf-8'},
    function (err, res, page) {  

        let formattedGroup=GROUP.split('-');

        let $=cheerio.load(page); 
        let content=$('div.news-body').children();

        let date=content.eq(0).text(); //Дата
        let day=content.eq(1).text(); //Чисельник\знаменник
        let anouncementsTop=$('div.news-body > p'); // Оголошення (за межами таблиці)

        let table=$('div.news-body > table > tbody').children(); //Заміни

        let anouncementsRaw=$('[colspan=6]'); //Оголошення (в таблиці)
        let anouncements7=$('[colspan=7]');
        let anouncements8=$('[colspan=8]');

        let anouncements;
        if(anouncementsRaw.length>0 || anouncements8.length>0 || anouncements7.length>0 || anouncementsTop.length>2)
            anouncements="Оголошення:\n";
        else 
            anouncements="Оголошень немає\n";

        if(anouncementsTop.length>2)
            for(let i=2;i<anouncementsTop.length;i++) //Перше оголошення за межами таблиці - 3 елемент р у елементі div.news-body
                anouncements+=anouncementsTop.eq(i).text()+"\n"; 

        for(let i=0;i<anouncementsRaw.length; i++)
            anouncements+="\t"+anouncementsRaw.eq(i).text()+"\n"; //Розбиття оголошень по рядках

        for(let i=0;i<anouncements8.length; i++)
            anouncements+="\t"+anouncements8.eq(i).text()+"\n";

        for(let i=0;i<anouncements7.length; i++)
            anouncements+="\t"+anouncements7.eq(i).text()+"\n";
        
        let output=GROUP+":\n"+date+"\n"+day+"\n"+anouncements+"\n"+"Заміни:\n";


        let prevGroup='';
        let empty=true;
        for(let i=1; i<table.length; i++)
        {
            let group=table.eq(i).children().eq(0).text(); //0-Група
            let pair=table.eq(i).children().eq(1).text(); //1-Пара
            //2-Кого замінили
            let subject=table.eq(i).children().eq(3).text(); //3-Предмет
            let teacher=table.eq(i).children().eq(4).text(); //4-Викладач
            let room=table.eq(i).children().eq(5).text(); //5-Аудиторія

            if(group.includes("-")) //Якщо клітинка з групою не порожня -- там буде -
            {
                prevGroup=group;
                if(group.includes(GROUP) 
                    || (group.includes(formattedGroup[0]) && group.includes("," + formattedGroup[1])) 
                    || ((group.includes(formattedGroup[0]) && group.includes(", " + formattedGroup[1])))) 
                {
                    output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                    empty=false;
                }         
            }
            else if(!group.includes("-"))
            {
                if(prevGroup.includes(GROUP) 
                || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes("," + formattedGroup[1]))
                || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes(", " + formattedGroup[1])))       
                {
                    output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                }         
            }
        }
        
        if(empty) output+="Замін немає";
        callback(null, output);
    });
}

async function intervalFunc() //функція для таймера
{
    let options = {
        reply_markup: JSON.stringify(
            {
                inline_keyboard: [
                    [{ text: 'Поширити друзям', switch_inline_query: " - Бот для відслідковування замін в розкладі ХПК." }],             
                ]
            })
    };
    
    let col = client.db(databaseName).collection(lastUpdateCollectionName)
    let lastUpdateArray = await col.find().toArray();
    let lastUpdate = lastUpdateArray[0].LastDate;
    request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
        async function (err, res, page) 
        {        
            let $=cheerio.load(page); 
            let content=$('div.news-body').children();          

            let date=content.eq(0).text(); //Дата
            let newUpdate = content.text().substring(0,128);
            if(newUpdate.length < 128) 
                return;
        
            if(newUpdate!=lastUpdate) //Якщо дата не така як в БД
            {
                let tabl=$('div.news-body > table > tbody').children(); //Заміни
                console.log(newUpdate);

                let anouncementsTop=$('div.news-body > p'); // Оголошення (за межами таблиці)
                let anouncementsRaw=$('[colspan=6]'); //Оголошення (в таблиці)
                let anouncements8=$('[colspan=8]');
                let anouncements7=$('[colspan=7]');
                let anouncements;
                if(anouncementsRaw.length>0 || anouncements8.length>0 || anouncements7.length>0 || anouncementsTop.length>2)anouncements="Оголошення:\n";
                    else anouncements="Оголошень немає\n";

                if(anouncementsTop.length>2)
                    for(let i=2;i<anouncementsTop.length;i++) //Перше оголошення за межами таблиці - 3 елемент р у елементі div.news-body
                        anouncements+=anouncementsTop.eq(i).text()+"\n"; 

                for(let i=0;i<anouncementsRaw.length; i++)
                    anouncements+="\t"+anouncementsRaw.eq(i).text()+"\n"; //Розбиття оголошень по рядках

                for(let i=0;i<anouncements8.length; i++)
                    anouncements+="\t"+anouncements8.eq(i).text()+"\n";
                for(let i=0;i<anouncements7.length; i++)
                    anouncements+="\t"+anouncements7.eq(i).text()+"\n";

                await col.deleteOne({LastDate:lastUpdate});
                await col.insertOne({LastDate:newUpdate});

                let usersCollection = client.db(databaseName).collection(usersCollectionName);
                let users = await usersCollection.find().toArray();
                for(let i = 0; i < users.length; i++)
                {
                    getReplacementsFromLoaded(content,
                        tabl,
                        anouncements,
                        function(err, msg){bot.sendMessage(users[i].id, msg, options)
                            .catch(err =>
                                { 
                                    usersCollection.deleteOne({id:users[i].id}); 
                                    messageAdmin("Користувача видалено: "+users[i].id+"\n"+users[i].Name+"\n"+users[i].Group)
                                })}, users[i].Group);
                }
            
                var adminNotify = "Очистку завершено\n";
                messageAdmin(adminNotify);
            }
            else
            {
                console.log("Same");
            }
        }
    );
}

function getReplacementsFromLoaded(content,tabl,anoun,callback,GROUP) //Заміни з вже завантаженої сторінки
{
    let formattedGroup=GROUP.split('-');
    let date=content.eq(0).text(); //Дата
    let day=content.eq(1).text(); //Чисельник\знаменник
    let table=tabl //Заміни

    let anouncements=anoun;

    //let anouncementsTop=content.eq(2).text(); //Оголошення (за межами таблиці)
          
    let output=GROUP+":\n"+date+"\n"+day+"\n"+anouncements+"\n"+"Заміни:\n";


    let prevGroup='';
    let empty=true;
    for(let i=1; i<table.length; i++)
    {
        let group=table.eq(i).children().eq(0).text(); //0-Група
        let pair=table.eq(i).children().eq(1).text(); //1-Пара
        //let replaced=table.eq(i).children().eq(2).text();//2-Кого замінили
        let subject=table.eq(i).children().eq(3).text(); //3-Предмет
        let teacher=table.eq(i).children().eq(4).text(); //4-Викладач
        let room=table.eq(i).children().eq(5).text(); //5-Аудиторія

        if(group.includes("-")) //Якщо клітинка з групою не порожня -- там буде -
        {
            prevGroup=group;
            if(group.includes(GROUP) 
                || (group.includes(formattedGroup[0]) && group.includes("," + formattedGroup[1])) 
                || ((group.includes(formattedGroup[0]) && group.includes(", " + formattedGroup[1])))) 
            {
                output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                empty=false;
            }         
        }
        else if(!group.includes("-"))
        {
            if(prevGroup.includes(GROUP) 
                || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes("," + formattedGroup[1]))
                || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes(", " + formattedGroup[1])))       
                {
                    output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                }          
        }
    }
          
    if(empty) output+="Замін немає";
    callback(null, output);
}


// <-------Utility functions------->
function messageAdmin(msg)
{
  for(let i = 0; i < admins.length; i++)
  {
    bot.sendMessage(admins[i], msg);                
  }
}

async function addToBase(telegramID, group, name) //Запис користувачів в БД
{  
    let users = client.db(databaseName).collection(usersCollectionName);
    await users.updateOne(
        { id: telegramID },
        { $set: { "Group": group, "Name": name } },
        { upsert: true }
    );

    let usersCpy = client.db(databaseName).collection(usersCopyCollectionName);
    await usersCpy.updateOne(
        { id: telegramID },
        { $set: { "Group": group, "Name": name } },
        { upsert: true }
    );
}