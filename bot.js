
var request = require('request');
var cheerio = require('cheerio');
var TelegramBot = require('node-telegram-bot-api');

  function getReplacements(GROUP, callback)
  {
    
    request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
      function (err, res, page) {
        //Передаём страницу в cheerio
        let $=cheerio.load(page);
        //Идём по DOM-дереву обычными CSS-селекторами
        test=$('div.news-body > table > tbody').children();
        let output=GROUP+":\n";    
        let prevGroup='';
        let empty=true;
        for(let i=1; i<test.length; i++)
         {
            let group=test.eq(i).children().eq(0).text();
            let pair=test.eq(i).children().eq(1).text();
            //let pair=test.eq(i).children().eq(2).text();
            let subject=test.eq(i).children().eq(3).text();
            let teacher=test.eq(i).children().eq(4).text();
            let room=test.eq(i).children().eq(5).text();

            if(group.includes("-"))
            {
              prevGroup=group;
              if(group==GROUP)
              {
                //console.log(test.eq(i).text());
                output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
                empty=false;
              }         
            }
            else if(!group.includes("-") && prevGroup==GROUP)         
            {
              //console.log(test.eq(i).text());
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


    bot.onText(/^\D\D-\d\d\d$/, function(msg, match) {
      let fromId = msg.from.id;
      let group = match[0].toUpperCase();
      let responce = getReplacements(group, function(err, msg){bot.sendMessage(fromId, msg)});
    });