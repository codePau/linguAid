/*Send a message to the background page (linguAid.js) and shows the response in cloud.html*/
browser.runtime.sendMessage({
	loaded: "true"
    },
    function(response) {
	var listOfWords = response.msg;
	if(listOfWords.length==0)	listOfWords.push({freq:1, word: "No help available"});
	for(var i=0;i<listOfWords.length;i++){
		document.getElementById(i).textContent = listOfWords[i].word;
	}

    });
/*Close the window when click on it*/
window.addEventListener('click', function(event) {
	window.close();
});
