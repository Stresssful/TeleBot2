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

var monk = require('monk');
var db = monk('ether:herokuDB@ds249025.mlab.com:49025/heroku_26kgq0gk');
var collection = db.get('users');
var ID=310694905;

collection.findOne({ id: ID }, function(err, doc)
    {
        if (err) throw err;
        console.log(doc.Name);
    });

/*
	0 - Група
	1 - Пара
	2 - Кого замінили
	3 - Предмет
	4 - Викладач
	5 - Аудиторія
*/