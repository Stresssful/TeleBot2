var request = require('request');
var cheerio = require('cheerio');
var PORT = 8007;
//Загружаем страницу

var test;
/*var GROUP = process.argv[2];

request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
    function (err, res, page) {
        //Передаём страницу в cheerio
        let $=cheerio.load(page);
        let content=$('div.news-body').children();
        //let dateDay=$('div.news-body > p');
        let date=content.eq(0).text();
        let day=content.eq(1).text();
        let table=$('div.news-body > table > tbody').children();
        //console.log(date);
        //console.log(day);
        let anouncementsRaw=$('[colspan=6]');
        let anouncements;
        if(anouncementsRaw.length>0)anouncements="Оголошення:\n";
        else anouncements="Оголошень немає\n";
        for(let i=0;i<anouncementsRaw.length; i++)
        {
        	anouncements+="\t"+anouncementsRaw.eq(i).text()+"\n";
        }
        //console.log(anouncements);
        //console.log(table.text());


        let output=GROUP+":\n"+date+"\n"+day+"\n"+anouncements+"\n"+"Заміни:\n";
        let prevGroup='';
        let empty=true;
        for(let i=1; i<table.length; i++)
        {
        	let group=table.eq(i).children().eq(0).text();
        	let pair=table.eq(i).children().eq(1).text();
        	//let pair=table.eq(i).children().eq(2).text();
        	let subject=table.eq(i).children().eq(3).text();
        	let teacher=table.eq(i).children().eq(4).text();
        	let room=table.eq(i).children().eq(5).text();

        	if(group.includes("-"))
        	{
        		prevGroup=group;
        		if(group==GROUP)
        		{
        			//console.log(table.eq(i).text());
        			output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
        			empty=false;
        		}     		
        	}
        	else if(!group.includes("-") && prevGroup==GROUP)        	
        	{
        		//console.log(table.eq(i).text());
        		output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
        	}        	
        }
        
        if(empty) output+="Замін немає";
        console.log(output);
        
});    
*/

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

  function getReplacementsFromLoaded(content,tabl,anoun,callback,GROUP)
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
        //callback(null, output);
        callback(output);
  }

  /*function getDate()
  {
    request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
      function (err, res, page) 
      {        
          let $=cheerio.load(page); 
          let content=$('div.news-body').children();

          let date=content.eq(0).text(); //Дата
          let day=content.eq(1).text();
      }
  }*/

var monk = require('monk');
var request = require('request');
var cheerio = require('cheerio');
var db = monk('ether:herokuDB@ds249025.mlab.com:49025/heroku_26kgq0gk');
var users = db.get('users');
var update = db.get('last_update');
var ID=310694905;


function intervalFunc() 
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
          if(date!=lastUpdate)
          {
            let tabl=$('div.news-body > table > tbody').children(); //Заміни
            let anoun=$('[colspan=6]'); //Всі оголошення
            update.remove({LastDate:lastUpdate});
            update.insert(
            {                
              LastDate: date
            });
            users.find({},function(err,doc)
            {
                if (err) throw err;
                for(let i=0;i<doc.length;i++)
                {
                  //console.log(doc[i].Group);
                  getReplacementsFromLoaded(content,tabl,anoun,console.log,doc[i].Group)
                }
            });
          }
      });
      //getReplacements(group, function(err, msg){console.log(msg)});
      //console.log(group);
  });
}

    /*users.findOne({ id: 310694905 }, function(err, doc)
    {
          if (err) throw err;
          let group=doc.Group;
          getReplacements(group, function(err, msg){console.log(msg)});
     });*/

setInterval(intervalFunc, 1500);

//3600000=1hour



/*
	0 - Група
	1 - Пара
	2 - Кого замінили
	3 - Предмет
	4 - Викладач
	5 - Аудиторія
*/