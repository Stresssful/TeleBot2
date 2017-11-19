var request = require('request');
var cheerio = require('cheerio');
var TelegramBot = require('node-telegram-bot-api');
var monk = require('monk');

var db = monk('ether:herokuDB@ds249025.mlab.com:49025/heroku_26kgq0gk');
var users = db.get('users'); //таблиця користувачів
var update = db.get('last_update'); //останній апдейт


var token = '418440998:AAGGlVniBHyN9F1t2ckmOGm6CWel37p1G_A';// Устанавливаем токен
var bot = new TelegramBot(token, {polling: true});// Включить опрос сервера
setInterval(intervalFunc, 900000);// Перевірка наявності оновлень (900000 - 15 хв, 3600000 - 1 год)

  function getReplacements(GROUP, callback)
  {
    
      request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
      function (err, res, page) {        
          let $=cheerio.load(page); 
          let content=$('div.news-body').children();

          let date=content.eq(0).text(); //Дата
          let day=content.eq(1).text(); //Чисельник\знаменник

          let table=$('div.news-body > table > tbody').children(); //Заміни

          let anouncementsRaw=$('[colspan=6]'); //Всі оголошення
          let anouncements;
          if(anouncementsRaw.length>0)anouncements="Оголошення:\n";
          else anouncements="Оголошень немає\n";

          for(let i=0;i<anouncementsRaw.length; i++)
          {
            anouncements+="\t"+anouncementsRaw.eq(i).text()+"\n"; //Розбиття оголошень по рядках
          }
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
              if(group==GROUP)
              {
                output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                empty=false;
              }         
            }
            else if(!group.includes("-") && prevGroup==GROUP)         
            {
              output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
            }         
          }
          
          if(empty) output+="Замін немає";
          callback(null, output);
        });
  }

    function getReplacementsFromLoaded(content,tabl,anoun,callback,GROUP) //Заміни з вже завантаженої сторінки
    {
          let date=content.eq(0).text(); //Дата
          let day=content.eq(1).text(); //Чисельник\знаменник

          let table=tabl //Заміни

          let anouncementsRaw=anoun; //Всі оголошення
          let anouncements;
          if(anouncementsRaw.length>0)anouncements="Оголошення:\n";
          else anouncements="Оголошень немає\n";

          for(let i=0;i<anouncementsRaw.length; i++)
          {
            anouncements+="\t"+anouncementsRaw.eq(i).text()+"\n"; //Розбиття оголошень по рядках
          }
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
              if(group==GROUP)
              {
                output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                empty=false;
              }         
            }
            else if(!group.includes("-") && prevGroup==GROUP)         
            {
              output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
            }         
          }
          
        if(empty) output+="Замін немає";
        callback(null, output);
      }

      function intervalFunc() //функція для таймера
      { 
        update.find({},function(err,last)
        {
            if (err) throw err;
            let lastUpdate=last[0].LastDate;
            request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
            function (err, res, page) 
            {        
                let $=cheerio.load(page); 
                let content=$('div.news-body').children();          

                let date=content.eq(0).text(); //Дата
                if(date!=lastUpdate) //Якщо дата не така як в БД
                {
                  let tabl=$('div.news-body > table > tbody').children(); //Заміни
                  let anoun=$('[colspan=6]'); //Всі оголошення
                  update.remove({LastDate:lastUpdate}); //Записуєм дату в БД
                  update.insert(
                  {                
                    LastDate: date
                  });
                  users.find({},function(err,doc) 
                  {
                      if (err) throw err;
                      for(let i=0;i<doc.length;i++)
                      {
                        getReplacementsFromLoaded(content,tabl,anoun,function(err, msg){bot.sendMessage(doc[i].id, msg)},doc[i].Group)
                      }
                  });
                }
            });
        });
      }




    bot.onText(/^\D\D-\d\d\d$/, function(msg, match) { // \D - буква; \d - цифра
      let fromId = msg.from.id;
      let group = match[0].toUpperCase();

      let options = {
      reply_markup: JSON.stringify(
      {
          inline_keyboard: [
            [{ text: 'Переглянути заміни', callback_data: group+":show" }],
            [{ text: 'Відслідковувати групу', callback_data: group+":subscribe" }],            
          ]
        })
      };
      bot.sendMessage(fromId, group, options);
    });

    bot.onText(/\/my/, function(msg, match) { //команда \my
      let fromId = msg.from.id;
      users.findOne({ id: fromId }, function(err, doc)
      {
          if (err) throw err;
          if(doc==null)bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу!");
          else
          {
            let group=doc.Group;
            getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
          }
      });
    });

    bot.onText(/\/remove/, function(msg, match) { //команда \remove
      let fromId = msg.from.id;
      users.remove({ id:fromId});      
    });

    bot.on('callback_query', function (msg) { //обробка кнопок відслідкувати або переглянути заміну
      let query = msg.data.split(':');
      let group = query[0];
      let action = query[1];
      let fromId=msg.from.id;
      if (action=='show')
      { 
        getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
      }
      else
      { 
        addToBase(msg.from.id, group, msg.from.username);
        getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
      }
    });

    function addToBase(telegramID, group, name) //Запис користувачів в БД
    {
      users.remove({ id: telegramID });

      users.insert(
      { 
        id: telegramID, 
        Group: group,
        Name: name
      });
    }