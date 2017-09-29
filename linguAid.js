var originalTerm, term; 
var def, j, k;
var numResources;
var definitions;
var listOfWords = [];

/*
Create the context menu item.
*/
browser.contextMenus.create({
  id: "contextMenu",
  title: "linguAid",
  contexts: ["selection"]
});

browser.contextMenus.onClicked.addListener((info, tab) => formatTerm(info, tab));


function formatTerm(info, tab){
	/*set global variables to their initial values*/
	numResources=0;
	definitions = "";

	/*formatTerm*/
	var digit = [0,9];
	originalTerm = (info.selectionText).toLowerCase();
	term = originalTerm.replace(/-/g, ' ').replace(/[0-9]/g, '');// g   busqueda global (global match)  	
	searchInResources();
}

function searchInResources(){
	var dataR1 = "-Database=db_A00534&term="+term+"&-Table=Layout #1&-OperatorLogical=OR&-Operator=eq&-Token=-Search&-Nothing=Search";
	var r1 = new XMLHttpRequest();
	r1.open('POST', 'http://techdictionary.com/search_action.lasso', true);
	r1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	r1.onload = function(){
		var resultsR1 = r1.response;
		searchInR1(resultsR1);
	}
	r1.send(dataR1);

	var url2 = 'https://en.wikipedia.org/w/index.php?search='+term;
	var r2 = new XMLHttpRequest();
	r2.open('GET', url2, true);
	r2.onload = function () {
		var resultsR2 = r2.response;
   		searchInR2(resultsR2);			
	}
	r2.send(null);

	var dataR3 = "term="+term+"&type= ";
	var r3 = new XMLHttpRequest();
	var url = "https://pc.net/glossary/definition/"+term;
	r3.open('GET', url, true);
	r3.onload = function () {
	   	var resultsR3 = r3.response;
   		searchInR3(resultsR3);
	}
	r3.send();

	var url4 = 'http://babelnet.org/search?word='+term+'&lang=EN';
	var r4 = new XMLHttpRequest();
	r4.open('GET', url4, true);
	r4.onload = function () {
		var resultsR4 = r4.response;
   		searchInR4(resultsR4);
	 };
	r4.send(null);
}

function searchInR1 (results) {
	    var i=0;
	    j = results.indexOf('<td class="results"'); 
	    while(j!=-1){
		j=results.indexOf('<div align="left">', j)+18;
		k=results.indexOf("</div>", j);
		//As what is obtainted contains in the even positions the terms defined and in the odd ones their 
		//definitions, only the odd positions are copied in the array of definitions
		if(i%2!=0){//store result
			def = results.slice(j, k);
			definitions = definitions+maximumLength(def);
		}
		i++;
		j=results.indexOf('<td class="results"', k);
	    }
	    //console.log("1. "+definitions);
	    numResources++;
	    if(numResources==4)	getPOS();
}

function searchInR2(results){
 	    if(results.indexOf("disambigbox")==-1){
			j=results.indexOf("<p>")+3;
			if(j!=2){
				k=results.indexOf("</p>");
				if(j!=k){
					def = removeTags(results.slice(j, k));
					definitions = definitions+"\n"+maximumLength(def)+".";
				}
			}
	    }
	    else{//disambiguation page
			j=results.indexOf('id="Computing"');
			if(j!=-1){
				k = results.indexOf('<h2>', j);
				var article = results.slice(j, k);
				j=article.indexOf("<li>");
			 	while(j!=-1){
					k=article.indexOf("</li>", j);
					def =removeTags(article.slice(j+4, k));
					definitions = definitions+"\n"+maximumLength(def)+".";
					j=article.indexOf("<li>", k);
				}
			}
	   }
	    //console.log("2. "+definitions);
	    numResources++;
	    if(numResources==4)	getPOS();
}

function searchInR3(results){
	    j = results.indexOf('<div id="definition">');
	    if(j!=-1){
	        j=results.indexOf("<p>", j)+3;
		k=results.indexOf("</p>", j);
		//store result
		def = removeTags(results.slice(j, k));
		definitions = definitions+"\n"+maximumLength(def);
	    }
	    //console.log("3. "+definitions);
	    numResources++;
	    if(numResources==4)	getPOS();
}

function searchInR4(results){	
 	    if(results.indexOf("alert alert-danger")==-1){//if there are results
		j = results.indexOf("<span class='right_false'>")+26;//only one result

		if(j!=25){
			k= results.indexOf("</span>", j);
			def = removeTags(results.slice(j, k));
			if(def.indexOf("Sorry, this synset does not have a definition")==-1){
				definitions = definitions+"\n"+maximumLength(def)+".\n";
			}
		}
		else{
			j = results.indexOf('<p class="def">')+15;
			k = results.indexOf('</p>',j);
			while(j!=14){
				def = removeTags(results.slice(j, k));
				if(def.indexOf("Sorry, this synset does not have a definition")==-1){
					definitions = definitions+"\n"+maximumLength(def)+".\n";
				}
				j = results.indexOf('<p class="def">', j)+15;
				k = results.indexOf('</p>',j);
			}
		}
	   }
	    //console.log("4. "+definitions);
	    numResources++;
	    if(numResources==4)	getPOS();
}

function removeTags(str){
	var j, k, tag;
	j=str.indexOf("<");
	while(j !=-1){
		k=str.indexOf(">");
		tag = str.slice(j, k+1);
		str = str.replace(tag,"");
		j=str.indexOf("<", j);
	}
	str = str.replace(/&quot;/g, ""); 
	return str;
}

function maximumLength(def){
	var words = def.split(" ");
	if(words.length>70)	def=words[0, 69];
	return def;
}

function getPOS(){
	//console.log(definitions);
	listOfWords=[];
	if(definitions=="")	showResults();
	else{
		var data = "query="+definitions+"&parserSelect=English";
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'http://nlp.stanford.edu:8080/parser/index.jsp', true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onload = function(){
			var results = xhr.response;
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(results,"text/xml");
			results = xmlDoc.getElementsByClassName("parserOutputMonospace")[0];
			var taggedWords = results.getElementsByTagName("div");
			validWords(taggedWords);
		}
		xhr.send(data);
	}
}

/**
*The method deletes the words that do not belong to the selected categories, that coincide with the term searched or that belong to the verb “to be”.
*term is the term searched
*listOfWords[], an array that has in each position a frequency equal to one and the word tagged
*/
function validWords(taggedWords){
	listOfWords=[];
	var word, slash, tag;
	var wordsOfTerm = term.split(" ");//if the term is formed by more than one word, each one of them are stored in a position of the array “wordsOfTerm”

	var validTags = ["FW", "JJ", "NN", "NNS", "NNPS", "VB", "VBD", "VBG", "VBN", "VBP", "VBZ"]; //mirar cambios de categoría
	var toBe = ["be", "is", "are", "was", "were"];
	for(var i=0;i<taggedWords.length;i++){
		x = taggedWords[i].innerHTML;
		slash = x.indexOf("/");
		word = ((x.slice(0, slash)).trim()).toLowerCase();
		tag = x.slice(slash+1);
		if(validTags.indexOf(tag)!=-1 && toBe.indexOf(word)==-1 && wordsOfTerm.indexOf(word)==-1 && word.indexOf(wordsOfTerm)==-1 && originalTerm.indexOf(word)==-1)
			listOfWords.push({freq:1, word:word});
	}
	removeDuplicatesAndSortByFrequency();
}

/**
*The method sorts a list of words by descending frequency and merges the duplicate words, adding their frequencies.
*listOfWords[] is an array in which each element is an object with the frequency of the word, the word itself and the POS tag
*sortedListOfWords[], is the ordered array
*/
function removeDuplicatesAndSortByFrequency(){
	var i = 0;
	var j , value;
	while(i<listOfWords.length){
		value = listOfWords[i].word; // word selected for searching duplicates
		j = i+1;
		while(j< listOfWords.length){
			if(listOfWords[j].word == value){ 
				listOfWords[i].freq++;//increase frequency
				listOfWords.splice(j, 1);//delete row 
			} 
			else  j++;		
		}
		i++;
	}
	sortedListOfWords = listOfWords.sort(function(a, b) {return b.freq - a.freq;});
	listOfWords = sortedListOfWords;
	obtainKeywords();
}

/**
*The method obtains from the definitions a number of keywords as close as possible to ten.
*listOfWords[] is an array in which each element is an object with the frequency of the word and the word itself
*/
function obtainKeywords(){

	while(listOfWords.length > 11){
		var i = listOfWords.length-1;
		var lowestFreq = listOfWords[i].freq;
		while(i>=0 && listOfWords[i].freq == lowestFreq){
			listOfWords.splice(i, 1);
			i--;
		}
	}
	showResults();
}

/*The method creates a window for showing the results to the user, receives a message from it once it is created and sends the words to be showed
*listOfWords[] is an array in which each element is an object with the frequency of the word and the word itself
*/
function showResults(){
  var creating = browser.windows.create({
    url: browser.extension.getURL("popup/cloud.html"),
    type: "popup",
    height: 224,
    width: 297
  });

browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.loaded == "true")
      sendResponse({
        msg: listOfWords
      });
  });
}
