BooleanObject = class{
	constructor(initVal, data=null){
		this.val = initVal;
		this.success = false;
		this.data = data;
	}
}
String.prototype.hashCode = function(){
	var hash = 0, len = this.length;
	if ( len === 0 ) return hash;
	for( var i = 0; i < len; ++i ) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

stopBtn = document.createElement("button");
stopBtn.setAttribute("class", "sc-fzppip");// lbQUBS SidebarHeaderButtonWrapper_button__8oGPo SidebarHeaderExitButton_button__16sig SidebarHeaderUpper_exit__7pCCq
stopBtn.setAttribute("data-test", "ExitButtonIcon");
stopBtn.setAttribute("style", "background-color: red;width: 4pc;position: fixed;right:1vw;bottom:1vh;z-index:10;");
stopBtn.innerHTML = "STOP BOT";
stopBtn.addEventListener("click", ()=>{
	webSocket.close();
	stopBtn.remove();
	throw "THROWING AN ERROR TO FORCE CRAP TO STOP";
})
document.body.appendChild(stopBtn);//getElementsByClassName("SidebarHeaderUpper_upperWrapper__2UHMJ")[0];
/* async function init(){
	console.log("Thing");
	(await waitForElement("SidebarHeaderUpper_upperWrapper__2UHMJ",document, 10000)).appendChild(stopBtn);
	console.log("Thing1");
	main();
} */
//document.getElementsByClassName("SidebarHeaderUpper_upperWrapper__2UHMJ")[0].appendChild(stopBtn);

var webSocket;
ret = 0;
connectedToServer = false;
triedToConnect = new BooleanObject(false);//{"val": false};
togglesRegex = new RegExp("[0-9]+, [0-9]+, [0-9]+");
togglesCorrectColor = [71, 228, 193];
toggleWaitTime = 300; //ms. It looks cool when its slower.
badWords = [" ", "THE", "A", "AN"];//
mainBtn = "Button_button__1Q4K4 PrimaryButton_primaryButton__14UD2 PrimaryButtonTypes_medium__3jJgQ";
goToNextSection = false;

function onopen(){
	console.log("SenecaCheat: CONNECTED TO SERVER");
	//connectedToServer = true;
	triedToConnect.val = true;
	triedToConnect.success = true;
}
function onclose(){
	console.log("SenecaCheat: DISCONNECTED FROM SERVER");
	//connectedToServer = false; 
	triedToConnect.val = true;
	triedToConnect.success = false;
}
async function startWebSocket(){
	try{
		webSocket = new WebSocket("ws://localhost:8000/");
		webSocket.onopen = onopen;
		webSocket.onclose = onclose;
	} catch (error) {console.log(error);}
	return webSocket;
}

Request = class{
	constructor(requestType, answers=[], question=""){
		this.RequestType = requestType;
		this.Question = question;
		this.Answers = answers;
	}
}

async function waitForTrue(val){
	while(!val.val){
		await new Promise(r => setTimeout(r, 40));
	}
	return val;
}

async function wait(time){
	return new Promise(r => setTimeout(r, time));
}

function getContinueBtn(){
	var x = document.getElementsByClassName(mainBtn)[0];
	if (!x.className.includes("PrimaryButtonTypes_check__cNVnz")){
		var txt = x.getElementsByTagName("span")[0].textContent.toUpperCase();
		if (txt == "CONTINUE" || txt == "START LEARNING" || txt == "CONTINUE ASSIGNMENT"){return x;}
	}else if (x.getElementsByTagName("span")[0].textContent.toUpperCase() == "SKIP"){return x;}
}

function changeBoolObj(boolObj){// writes function which changes boolObj.val & boolObj.success
	return function(message){ //// depending on the argument the function recieves.
		boolObj.val = true;
		if (message.data.toUpperCase() == "DONE"){
			boolObj.success = true;
		}
	}
}
function sanitize(txt){
	badChars = ["'",'"',"`"];
	badChars.forEach(v => txt = txt.replaceAll(v,""));
	return txt;
}
function sendKeyboardInputRequest(answerList){
	try{
	req = new Request("KeyboardInput", answers=answerList);
	
	var actionDone = new BooleanObject(false);
	webSocket.onmessage = changeBoolObj(actionDone);
	
	webSocket.send(JSON.stringify(req));
	
	return waitForTrue(actionDone);
	}catch(e){console.log(e);}
}
function sendStoreAnswerRequest(questionText, answerList){
	try{
		questionText = sanitize(questionText);
		req = new Request("StoreAnswer", answerList, questionText);
		
		var requestDone = new BooleanObject(false);
		webSocket.onmessage = changeBoolObj(requestDone);
		
		webSocket.send(JSON.stringify(req));
		return waitForTrue(requestDone);
	}catch (e){console.log(e);}
}
function sendGetAnswerRequest(questionText){
	try{
		questionText = sanitize(questionText);
		req = new Request("GetAnswer");
		req.Question = questionText;
		
		var requestDone = new BooleanObject(false);
		webSocket.onmessage = response => {
			requestDone.data = response.data;
			requestDone.success = response.data != "UNKNOWN";
			requestDone.val = true;
		};
		webSocket.send(JSON.stringify(req));
		return waitForTrue(requestDone);
	}catch(e){console.log(e);}
}

function extractAnswersFromElementList(list){// list= list of elements.
//												Elements contain 1 element which contains ans.
	try{
	Answers = [];
	for (i = 0; i < list.length; i++){
		Answers.push(list[i].children[0].textContent);
	}
	return Answers
	}catch(e){console.log(e);}
}

async function completeWordFill(questionElement){
	try{//
	answersElements = await waitForElements("TestedWord_word_placeholder__2xuzY",questionElement);// questionElement.getElementsByClassName("TestedWord_word_placeholder__2xuzY");
	Answers = extractAnswersFromElementList(answersElements);
	
	return sendKeyboardInputRequest(Answers);
	}catch(e) {console.log(e);}
}
async function completeWorkedExample(questionElement){
	try{
		temp = await waitForElement("ProgressIndicator__wrapper", questionElement)//questionElement.getElementsByClassName("ProgressIndicator__wrapper")[0];
		numAnswers = parseInt(temp.getElementsByTagName("sub")[0].textContent);
		numAnswersDone = 0;
		while (numAnswersDone < numAnswers){
			answersElements = questionElement.getElementsByClassName("TestedWord_word_placeholder__2xuzY");
			Answers = extractAnswersFromElementList(answersElements);
			numAnsAvailable = Answers.length;
			
			newAnswers = [];
			for (j = 0; j < numAnsAvailable - numAnswersDone; j++){
				newAnswers.push(Answers.pop());
			}
			Answers = newAnswers.reverse();

			await sendKeyboardInputRequest(Answers);
			await wait(200);
			numAnswersDone = parseInt(temp.getElementsByTagName("sup")[0].textContent);
		}
		return true;
	}catch(e){console.log(e);}
}

async function completeStatementList(questionElement){
	try{
		answersElements = await waitForElements("BlurredWord__word BlurredWord__word--blurred", questionElement);//questionElement.getElementsByClassName("BlurredWord__word BlurredWord__word--blurred");
		Answers = extractAnswersFromElementList(answersElements);
		return sendKeyboardInputRequest(Answers);
	}catch(e){console.log(e);}
}

async function completeToggles(questionElement){
	try{
	buttons = questionElement.getElementsByTagName("button");
	color = JSON.parse("[" + questionElement.style.backgroundImage.match(togglesRegex) + "]")
	gVal = color[1]
	for (i = 0; i < buttons.length; i++){
		btn = buttons[i];
		btn.click();
		await wait(toggleWaitTime);
		color = JSON.parse("[" + questionElement.style.backgroundImage.match(togglesRegex) + "]")
		newGVal = color[1]
		if (color == togglesCorrectColor){
			return true;
		}
		if (newGVal < gVal){
			btn.click();
			await wait(toggleWaitTime);
		}
		gVal = newGVal;
	}
	return true;
	}catch(e){console.log(e);}
}

async function completeFlashCard(question){
	try{
	question.children[0].click();
	await wait(100);
	question.getElementsByTagName("button")[0].click();
	return true;
	}catch(e){console.log(e);}
}

async function completeWrongWord(question){
	try{
	answerElements = [].slice.call(question.getElementsByClassName("SelectableWord SelectableWord--selectable"));
	questionText = "";
	answerWords = [];
	clickingCandidates = [];
	for (i = 0; i < answerElements.length; i++){
		word = answerElements[i].children[0].innerHTML.toUpperCase();
		if (word == "&NBSP;") {word = " ";}
		questionText += word;
		if (!badWords.includes(word)){
			answerWords.push(word);
			clickingCandidates.push(answerElements[i]);
		}
	}
	/// Request to server. Server knows or maybe not.
	correctUnknown = true;
	correctAns = "";
	serverResponse = await sendGetAnswerRequest(questionText);
	if (serverResponse.success){
		correctUnknown = false;
		answers = JSON.parse(serverResponse.data); // data = "['abc','def']" : type = string
		correctAns = answers[0];//.toUpperCase();
		multChoiceAns = answers[1].toUpperCase();
	}
	///
	if (correctUnknown){
		//await wait(200);
		clickingCandidates[0].click();
		await wait(100);
		correctAns = answerElements.findIndex(v => {
			return v.className.includes("SelectableWord SelectableWord--crossedOut");
		}); //question.getElementsByClassName("SelectableWord SelectableWord--crossedOut")[0];
		//correctAns = correctElement.children[0].innerHTML.toUpperCase();
		//Next part of question
		multChoice = question.getElementsByClassName("MultipleChoiceQuestion_answerAndImageContainer__1v5KG")[0];
		multChoice.getElementsByTagName("button")[0].click();
		await wait(100);
		correctElement = multChoice.getElementsByClassName("MultipleChoiceButton_button__1qyXJ MultipleChoiceButton_button--correct__1bjmT")[0];
		multChoiceAns = correctElement.getElementsByTagName("div")[0].children[0].textContent.toUpperCase();
		// Tell server what the correct answer is
		return sendStoreAnswerRequest(questionText, [correctAns, multChoiceAns]);
		///
	}else{
		//correctElement = clickingCandidates.find(v => {
		//	return v.children[0].innerHTML.toUpperCase() == correctAns;
		//});
		correctElement = answerElements[correctAns];
		correctElement.click();
		await wait(100);
		multChoice = question.getElementsByClassName("MultipleChoiceQuestion_answerAndImageContainer__1v5KG")[0];
		buttons = [].slice.call(multChoice.getElementsByTagName("button"));
		correctButton = buttons.find(v => {
			return v.getElementsByTagName("div")[0].children[0].textContent.toUpperCase() == multChoiceAns;
		})
		correctButton.click();
		return true;
	}
	}catch (e){console.log(e);}
}

async function completeExactList(question){
	try{
		questionText = question.getElementsByClassName("ExactList_statement__2RyZh")[0].children[0].textContent.toUpperCase();
		/// Ask server for answer.
		ansKnown = false;
		correctAns = [];
		serverResponse = await sendGetAnswerRequest(questionText);
		if (serverResponse.success){
			ansKnown = true;
			correctAns = JSON.parse(serverResponse.data.toUpperCase());
		}
		///
		if (!ansKnown){
			document.getElementsByClassName("Button_button__1Q4K4 PrimaryButton_primaryButton__14UD2 PrimaryButtonTypes_medium__3jJgQ PrimaryButtonTypes_check__cNVnz ControlBarButton_button__2PkIJ")[0].click();
			correctElements = (await waitForElement("ExactList_userAnswersWrapper__30_Y7",question)).children;// question.getElementsByClassName("ExactList_userAnswersWrapper__30_Y7")[0].children;
			await wait(100);
			for (i = 0; i < correctElements.length; i++){
				correctAns.push(correctElements[i].children[0].textContent.toUpperCase());
			}
			/// send correct ans to server
			return sendStoreAnswerRequest(questionText, correctAns);
			///
		}else{
			return sendKeyboardInputRequest(correctAns);
		}
	}catch(e){console.log(e);}
}

async function completeMultChoice(question){
	try{
		questionText = question.getElementsByClassName("MultipleChoiceQuestion_text__IlrFA")[0].children[0].textContent.toUpperCase().replaceAll(/\s+/g, '');
		possibleAnswers = [];
		buttons = [].slice.call(question.getElementsByClassName("MultipleChoiceButton_button__1qyXJ"));
		buttons.forEach(btn => possibleAnswers.push(btn.getElementsByTagName("div")[0].children[0].textContent.toUpperCase().replaceAll(/\s+/g, '')));
		possibleAnswers = possibleAnswers.sort();
		possibleAnswers.forEach(ans => questionText += ans);
		if ((img = question.getElementsByTagName("img")[0]) != null){questionText += img.src;}
		questionText = questionText.hashCode().toString();
		/// Send request to server
		ansKnown = false;
		correctAns = [];
		serverResponse = await sendGetAnswerRequest(questionText);
		if (serverResponse.success){
			ansKnown = true;
			correctAns = JSON.parse(serverResponse.data.toUpperCase());
		}
		///
		if (ansKnown){
			correctBtns = buttons.filter(btn => {
				return correctAns.includes(btn.getElementsByTagName("div")[0].children[0].textContent.toUpperCase().hashCode());
			});
			correctBtns.forEach(v => v.click());
			return true;
		}else{
			temp = question.parentElement.getElementsByClassName("ProgressIndicator__wrapper ProgressIndicator__wrapper--background")[0];
			numAnswers = parseInt(temp.children[0].children[1].textContent);
			for (i = 0; i < numAnswers; i++){
				buttons[i].click();
			}
			await wait(200);
			correctBtns = buttons.filter(btn => btn.className.includes("MultipleChoiceButton_button--correct__1bjmT"));
			correctBtns.forEach(btn => {
				correctAns.push(btn.getElementsByTagName("div")[0].children[0].textContent.toUpperCase());
			})
			hashedCorrect = [];
			correctAns.forEach(v => hashedCorrect.push(v.hashCode()));
			/// Send answers to server
			return sendStoreAnswerRequest(questionText, hashedCorrect);
			///
		}
	}catch(e) {console.log(e);}
}
async function completeImageMultiChoice(question){
	try{
		questionText = question.getElementsByClassName("ImageMultiChoice_title__3HDeI")[0].children[0].textContent;
		imgs = [].slice.call(question.getElementsByTagName("img"));
		imgUrls = [];
		imgs.forEach(v => {
			imgUrls.push(v.src);
			//questionText += v.src;
		});
		imgUrls = imgUrls.sort();
		imgUrls.forEach(v => questionText += v);
		questionText = questionText.hashCode().toString();
		
		answerKnown = false;
		answer = "";
		serverResponse = await sendGetAnswerRequest(questionText);
		if (serverResponse.success){
			answerKnown = true;
			answer = JSON.parse(serverResponse.data)[0];
		}
		if (answerKnown){
			imgs.forEach(v => {
				if (answer == v.src){v.click();}
			});
		}else{
			imgs[0].click();
			await wait(100);
			temp = question.getElementsByClassName("ImageWithMask_mask__1XcaJ ImageMultiChoiceImage_correctAnswer__1PxPt")[0];
			correctElement = temp.parentElement.getElementsByTagName("img")[0];
			answer = [correctElement.src];
			return sendStoreAnswerRequest(questionText, answer);
		}
		
	}catch(e){console.log(e);}
}

function clickIfExists(btn){
	if(btn){btn.click();}
}
async function waitForElement(className, childOf, timeout=1000){
	return (await waitForElements(className, childOf, timeout))[0];
}
async function waitForElements(className, childOf, timeout=1000){
	i = 0;
	x = null;
	const waitTime = 50;
	while((x = childOf.getElementsByClassName(className)) == null && waitTime * i < timeout){
		await wait(waitTime);
		i++;
	}
	return x;
}
//<button id="submit">Save settings</button>
async function getMoreQuestions(){
	
	
	settings = JSON.parse(localStorage.getItem("SenecaBotSettings"));
	className = "";
	if (!settings){
		settings = {
			"RepeatSameSection": true,
			"StudyMode": "Adaptive" // Adaptive, WrongAnswers, Quiz
		}
	}
	if (settings["OnlyCompleteOne"]){return false;}
	if (!settings["RepeatSameSection"]){
		await waitForElement("Overlay_overlay__wqRiU Overlay_clickable__XCLw5",document, 3000).then(clickIfExists);
		await wait(500);
		await waitForElement("PrimaryButtonTypes_malibu__c64jt ControlBarButton_button__2PkIJ", document, 1000).then(clickIfExists);
		await wait(500);
	}else{
		str = "LocationTransitionWrapper ModalWrapper_transitionWrapper__Do74C EndSessionModalRouter_wrapper__3hwdx";
		waitForElement(str, document, 8000).then(v => {
			if (v){
				if ((x=v.getElementsByTagName("a")[1]) !=null){x.click();}
				else if ((x=v.getElementsByTagName("button")[1]) != null){x.click();}
			}
		});
		
		str = "Card__outer Card__white Card__outer--clickable Card__outer--rounded Card__outer--growOnHover LocationButton"
		waitForElement(str, document, 8000).then(clickIfExists).then(async function(){
			str = "LocationTransitionWrapper ModalWrapper_transitionWrapper__Do74C EndSessionModalRouter_wrapper__3hwdx LocationTransitionWrapper-enter-done";
			div = await waitForElement(str, document);
			if(div){
			div.getElementsByTagName("a")[0].click();
			}
		});
		await wait(1000);//sc-fzowVh LWapK
	}//sc-fzowVh bDVafF    - bad

	//if(!settings["RepeatSameSection"]){
	//	await waitForElement("sc-fznNTe gSJlTx", document, 2000).then(clickIfExists);//click next section
	//	await wait(1000);
	//}
	if ((x=document.getElementsByClassName(mainBtn)[0]) != null){return true;}
	x = settings["StudyMode"];
	if (x == "Adaptive"){className = "Adaptively_background__1EQwT";}
	else if (x == "WrongAnswers"){className = "Adaptively_background__1EQwT";}
	else if (x == "Quiz"){className = "Quiz_background__1YLhU";}
	
	await waitForElement(className, document, 5000).then(function(btn){
		if (btn){
			if (btn.className.includes("Card__outer--clickable")){
				btn.click();
			}else{
				document.getElementsByClassName("Adaptively_background__1EQwT")[0].click();
			} /// Adaptive always exists
		}
	});
	if ((x=document.getElementsByClassName(mainBtn)[0]) == null){return true;}
	return true;
}

main();
async function main(){
	try{
	startWebSocket();
	await waitForTrue(triedToConnect); // waits until triedToConnect.val == true
	await wait(1000);
	await waitForElement("SessionScrollView__wrapper",document, 2000);
	if (!document.getElementsByClassName("SessionScrollView__wrapper")[0]){await getMoreQuestions(); await wait(500);}
	questionsDiv = document.getElementsByClassName("SessionScrollView__wrapper")[0].children[0];
	while (triedToConnect.success){
		window.scrollBy(0,10000);
		await wait(1500);
	
		btn0 = await waitForElement(mainBtn, document, 2500);
		cont = false;
		brk = false;
		while (!btn0){
			window.scrollBy(0,10000);
			console.log("Getting more questions....");
			if (!await getMoreQuestions()){brk = true; break;}
			await wait(100);
			questionsDiv = document.getElementsByClassName("SessionScrollView__wrapper")[0].children[0];
			btn0 = await waitForElement(mainBtn, document, 1000);
			cont = true;
		}if (brk){break;}
		if (cont){continue;}
		continueBtn = getContinueBtn();
		if (continueBtn) {continueBtn.click(); continue;}
		
		var thisQ = questionsDiv.children[questionsDiv.children.length-1];
		if ((question = thisQ.getElementsByClassName("Wordfill_container__3fT6S")[0]) != null){
			//Qtype = wordFill
			await completeWordFill(question);
			continue;
		}else if ((question = thisQ.getElementsByClassName("PretestWrapper__outer")[0]) != null){
			// Qtype = StatementList
			await completeStatementList(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("Toggles__wrapper")[0]) != null){
			// Qtype = Toggles
			await completeToggles(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("Flashcard__card")[0]) != null){
			await completeFlashCard(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("WorkedExample_outer__1YIwa")[0]) != null){
			await completeWorkedExample(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("WrongWord")[0]) != null){
			await completeWrongWord(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("ExactList_wrapper__6RFC9")[0]) != null){
			await completeExactList(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("MultipleChoiceQuestion_question__3MmgM")[0]) != null){
			await completeMultChoice(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("Grid_container__IVYoJ")[0]) != null){
			await completeWordFill(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("Flow__wrapper")[0]) != null){
			document.getElementsByClassName("Button_button__1Q4K4 PrimaryButtonTypes_medium__3jJgQ")[0].click();
			continue;
		} else if ((question = thisQ.getElementsByClassName("ImageLabel_container__vwO7b")[0]) != null){
			await completeWordFill(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("ImageDescription_container__2Hwrn")[0]) != null){
			await completeWordFill(question);
			continue;
		} else if ((question = thisQ.getElementsByClassName("ImageMultiChoice_imageMultiChoice_outer__1Q2Sk ImageMultiChoice_backgroundIncorrect__11FNX")[0]) != null){
			await completeImageMultiChoice(question);
			continue;
		}
	}
	
	}catch(e){console.log(e);}
}
// CheckBtn:    Button_button__1Q4K4 PrimaryButton_primaryButton__14UD2 PrimaryButtonTypes_medium__3jJgQ PrimaryButtonTypes_check__cNVnz ControlBarButton_button__2PkIJ
// ContinueBtn: Button_button__1Q4K4 PrimaryButton_primaryButton__14UD2 PrimaryButtonTypes_medium__3jJgQ ControlBarButton_button__2PkIJ
//
// EACH Question is contained in: withModuleFeedback_wrapper__3gyla
//
//Question identifiers:
// Toggles:       Toggles__wrapper
// Mult Choice:   MultipleChoiceCardContents_contents__2YA0v
// Word Fill:     Wordfill_container__3fT6S
// Word Inp List: ExactList_wrapper__6RFC9
// StatementList: PretestWrapper__outer



// Answer Finders:

// Toggles:                      
//   Toggles__wrapper --> Toggles__singletoggles-container --> 
//   Toggles__single__toggle Toggles__single__toggle-active (Button)
// Toggles__wrapper: 
//       contains: style=background-image: linear-gradient(rgb(250, 222, 97), rgb(247, 160, 28));
///                        Read g val of first arg for lin-grad: increases as ans is more correct
//  x = document.getElementsByClassName("Toggles__wrapper")[0]
//  reg = new RegExp("[0-9]+, [0-9]+, [0-9]+")
//  color = "[" + x.style.backgroundImage.match(reg) + "]"
//  gVal = JSON.parse(col)[1]
// NOTE: color changes to (71, 228, 193) when ans correct.

// Mult Choice:
//   MultipleChoiceCardContents_contents__2YA0v --> MultipleChoiceQuestion_question__3MmgM -->
//>     MultipleChoiceQuestion_answerAndImageContainer__1v5KG --> sc-AxirZ eieZKi --> sc-AxirZ fOjphG * 4 --> div --> div --> div --> button ;
//>     MultipleChoiceQuestion_text__IlrFA --> span: innerHTML = Question ; 


// Word inp list:
//		ExactList_wrapper__6RFC9 --> 
// >      ExactList_statement__2RyZh --> <p> = Question
// >      ExactList_userAnswersWrapper__30_Y7 --> div * numAns --> span=correctAns ||Appears after


// StatementList:
///     PretestWrapper__outer --> 
// >      div --> List__answersContainer --> div * numAns --> List__valueContainer --> div -->
///       BlurredWord__word BlurredWord__word--blurred --> span=correctAns


