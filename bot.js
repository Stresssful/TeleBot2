
var request = require('request');
var cheerio = require('cheerio');
var TelegramBot = require('node-telegram-bot-api');

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

    // Устанавливаем токен, который выдавал нам бот.
    var token = '418440998:AAGGlVniBHyN9F1t2ckmOGm6CWel37p1G_A';
    // Включить опрос сервера
    var bot = new TelegramBot(token, {polling: true});


    bot.onText(/^\D\D-\d\d\d$/, function(msg, match) { // \D - буква; \d - цифра
      let fromId = msg.from.id;
      let group = match[0].toUpperCase();
      let responce = getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
    });