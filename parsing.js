var request = require('request');
var cheerio = require('cheerio');
var PORT = 8007;
//Загружаем страницу

var test;
var __GROUP__ = process.argv[2];

request({uri:'http://hpk.edu.ua/replacements', method:'GET', encoding:'utf-8'},
    function (err, res, page) {
        //Передаём страницу в cheerio
        let $=cheerio.load(page);
        //Идём по DOM-дереву обычными CSS-селекторами
        test=$('div.news-body > table > tbody').children();
        let output=__GROUP__+":\n";
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
        		if(group==__GROUP__)
        		{
        			//console.log(test.eq(i).text());
        			output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
        			empty=false;
        		}     		
        	}
        	else if(!group.includes("-") && prevGroup==__GROUP__)        	
        	{
        		//console.log(test.eq(i).text());
        		output+="\t"+pair+"\t"+subject+"\t\t"+teacher+"\t"+room+"\n";
        	}        	
        }
        if(empty) output+="Замін немає";
        console.log(output);
});    


/*
	0 - Група
	1 - Пара
	2 - Кого замінили
	3 - Предмет
	4 - Викладач
	5 - Аудиторія
*/