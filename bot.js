var request = require('request');
var cheerio = require('cheerio');
var TelegramBot = require('node-telegram-bot-api');
var monk = require('monk');
var ON_DEATH = require('death');


var   helpText='Привіт! Я бот, який може відслідковувати заміни для студентів ХПК. Просто напиши мені назву групи, про заміни якої ти хочеш дізнатись.';
      helpText+='\n\n';
      helpText+='Якщо ж ти хочеш отримувати повідомлення кожен раз, коли на сайті ХПК виходять заміни - натисни на кнопку "Відслідковувати групу".';
      helpText+='\n\n';
      helpText+='Також у мене є деякі команди:\n/my - Переглянути мої заміни;\n/remove - Не відслідковувати групу;\n/help - Переглянути це повідомлення з інструкцією.';
      helpText+='\nЗ питаннями та пропозиціями звертатись до @Stressful_Courtier.'

var token = '473584184:AAGQGkdSmbK_CaI9iy5mUURIMhb25MT20Aw'; // Устанавливаем токен
var db = monk('ether:herokuDB@ds249025.mlab.com:49025/heroku_26kgq0gk'); //База даних
setInterval(intervalFunc, 900000);// Перевірка наявності оновлень (900000 - 15 хв, 3600000 - 1 год) 


//DEBUG OPTIONS
//var token = '418440998:AAGpggVT2H3_4am1qZmwoNaQ5BEUS6-UEzg'; // Устанавливаем токен (DEVELOP)
//var db = monk('main:root@ds161148.mlab.com:61148/heroku_tqh5hdjz'); //База даних (DEVELOP)
//setInterval(intervalFunc, 5000); //Перевірка наявності оновлень (DEVELOP)


var admins=[310694905];

//UNDER CONSTRUCTION
//let isScheduledFarewell = true;
//let dateOfFinishing=new Date(2018, 03, 15); //DEVELOP
//let dateOfFinishing=new Date(2018, 05, 1);

var users = db.get('users'); //таблиця користувачів
var update = db.get('last_update'); //останній апдейт
var bot = new TelegramBot(token, {polling: true});// Включить опрос сервера

  function getReplacements(GROUP, callback)
  {    	
      request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
      function (err, res, page) {  

      	  let formattedGroup=GROUP.split('-');

          let $=cheerio.load(page); 
          let content=$('div.news-body').children();

          let date=content.eq(0).text(); //Дата
          let day=content.eq(1).text(); //Чисельник\знаменник
          let anouncementsTop=$('div.news-body > p'); // Оголошення (за межами таблиці)

          let table=$('div.news-body > table > tbody').children(); //Заміни

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
          
          let output=GROUP+":\n"+date+"\n"+day+"\n"+anouncements+"\n"+"Заміни:\n";


          let prevGroup='';
          let empty=true;
          for(let i=1; i<table.length; i++)
          {
            let group=table.eq(i).children().eq(0).text(); //0-Група
            let pair=table.eq(i).children().eq(1).text(); //1-Пара
            //let replaced=table.eq(i).children().eq(2).text(); //2-Кого замінили
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
              if(prevGroup.includes(GROUP) 
              || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes("," + formattedGroup[1]))
              || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes(", " + formattedGroup[1])))       
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
              if(prevGroup.includes(GROUP) 
              || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes("," + formattedGroup[1]))
              || (prevGroup.includes(formattedGroup[0]) && prevGroup.includes(", " + formattedGroup[1])))       
              {
                output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
              }          
          }
          
        if(empty) output+="Замін немає";
        callback(null, output);
      }

      function intervalFunc() //функція для таймера
      { 
      	/*let today=new Date();
      	if(isScheduledFarewell)
      	{      		
      		if(today.getDay()==dateOfFinishing.getDay() && today.getMonth()==dateOfFinishing.getMonth() && today.getFullYear()==dateOfFinishing.getFullYear())
      		{
      			console.log("true");
      			farewell();
      			isScheduledFarewell=false;
      		}
      	}
      	else if(today.getDay()!=dateOfFinishing.getDay() || today.getMonth()!=dateOfFinishing.getMonth() || today.getFullYear()!=dateOfFinishing.getFullYear())
      	{
      		isScheduledFarewell=true;
      	}*/


        let options = {
        reply_markup: JSON.stringify(
        {
            inline_keyboard: [
              [{ text: 'Поширити друзям', switch_inline_query: " - Бот для відслідковування замін в розкладі ХПК." }],             
            ]
          })
        };
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
                        getReplacementsFromLoaded(content,
                          tabl,
                          anouncements,
                          function(err, msg){bot.sendMessage(doc[i].id, msg, options).catch(err => users.remove({id:doc[i].id}) /*messageAdmin(doc[i].id+"\n"+doc[i].Name+"\n"+doc[i].Group)*/)},
                          doc[i].Group)
                      }
                      users.count({}, function (err, count) 
                      {
                        if (err) throw err;
                        var adminNotify = "Очистку завершено\n";
                        messageAdmin(adminNotify);
                      });
                  });
                }
            });
        });
      }


    bot.onText(/^\D\D-\d\d\d$/, function(msg, match) { // \D - буква; \d - цифра
      let fromId = msg.from.id;
      let Group = match[0].toUpperCase();
      let formattedGroup=Group.split('-');

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
      users.findOne({ id: fromId }, function(err, doc)
      {
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

      users.findOne({ id: fromId }, function(err, doc)
      {
          if (err) throw err;
          if(doc==null)bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу!");
          else
          {
            let group=doc.Group;
            let adminNotify = "Користувач відписався\n";
            adminNotify += msg.from.id +'\n';
            adminNotify += msg.from.username + ': ' + msg.from.first_name + ' ' + msg.from.last_name+'\n';
            adminNotify += "Група: " + group;
            messageAdmin(adminNotify);            
          }
      });
      

      users.remove({ id:fromId});
      bot.sendMessage(fromId,"Ви не відслідковуєте жодну групу.");
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

    bot.onText(/\/count/, function(msg, match) { //команда \count
      let fromId = msg.from.id;
      users.count({}, function (err, count) {
      	if (err) throw err;
  		bot.sendMessage(fromId,"Нас вже "+count+"!");
	  });
    });

    bot.onText(/^\/yell(.*|\n)*$/, function(msg, match) {
      let fromId = msg.from.id;
      if(admins.indexOf(fromId) != -1 )
      {
        let text = msg.text.substr(5);
        users.find({},function(err,doc) 
        {
          if (err) throw err;
          for(let i=0;i<doc.length;i++) 
          {            
            bot.sendMessage(doc[i].id,text);
          }
        }); 
      }
    });

    bot.on('callback_query', function (msg) { //обробка кнопок відслідкувати або переглянути заміну
      let query = msg.data.split(':');
      let group = query[0];
      let action = query[1];
      let adminNotify="";

      //console.log( msg.from.id);

      addToBase(msg.from.id, group, msg.from.username);
      bot.sendMessage(msg.from.id, "Ви відслідковуєте групу "+group+".");



      adminNotify += "Користувач підписався\n";
      adminNotify += msg.from.id +'\n';
      adminNotify += msg.from.username + ': ' + msg.from.first_name + ' ' + msg.from.last_name+'\n';
      adminNotify += "Група: " + group;
      users.count({}, function (err, count) 
      {
        if (err) throw err;
        adminNotify += "\n---------------------------\n";
        adminNotify += "Нас вже "+count+"!";
        messageAdmin(adminNotify);
      });
      

      //if (action=='show')
      //{ 
        //getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
      //}
      //else
      //{ 
        
      //}
    });

    function messageAdmin(msg)
    {
      for(let i = 0; i < admins.length; i++)
      {
        bot.sendMessage(admins[i], msg);                
      }
    }

    function addToBase(telegramID, group, name) //Запис користувачів в БД
    {
      //users.remove({ id: telegramID });

      users.update(
      { id: telegramID },
      { 
        id: telegramID, 
        Group: group,
        Name: name
      },
      { upsert: true });
    }

    function farewell()
    {
    	users.find({},function(err,doc) 
        {
            if (err) throw err;
            let currentYear=(new Date()).getFullYear()-2000;
            for(let i=0;i<doc.length;i++)
            {
                bot.sendMessage(doc[i].id, "Кінець навчального року");
                let formatGroup=doc[i].Group.split('-');
                let number=parseInt(formatGroup[1].substr(0, 2));
                if((currentYear-number)>=4)
                {
                    bot.sendMessage(doc[i].id,"Випуск");
                    users.remove({ id:doc[i].id});
                } 
            }
        });
    }
