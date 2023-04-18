let startBtn = document.getElementById("startBotting");
//let ipTextBox = document.getElementById("serverIP");
let infoBox = document.getElementById("userInfo");
let loopInfBox = document.getElementById("repeatInfinite");
let sameTaskBox = document.getElementById("staySameTask");
let wrongAnswersBox = document.getElementById("wrongAnswers");
let saveSettingsBtn = document.getElementById("submit");

/* saveSettingsBtn.onclick = async function(){
	studyMode = null;
	if (wrongAnswersBox.value == true){studyMode = "WrongAnswers";}
	else{studyMode = "Adaptive";}
	settings = {
		"OnlyCompleteOne": !loopInfBox.value,
		"RepeatSameSection": sameTaskBox.value,
		"StudyMode": studyMode
	}
	let [tab] = await chrome.tabs.query({active: true, currentWindow:true});
	if (tab){chrome.scripting.executeScript({
		target: {tabId: tab.id},
		func: storeSettings,
		args: [settings]
	});}
} */
function storeSettings(settings){
	localStorage.setItem("SenecaBotSettings", JSON.stringify(settings));
}
startBtn.onclick = injectScript;
async function injectScript() {
	studyMode = null;
	if (wrongAnswersBox.checked == true){studyMode = "WrongAnswers";}
	else{studyMode = "Adaptive";}
	settings = {
		"OnlyCompleteOne": !loopInfBox.checked,
		"RepeatSameSection": sameTaskBox.checked,
		"StudyMode": studyMode
	}
	let [tab] = await chrome.tabs.query({active: true, currentWindow:true, url:"https://app.senecalearning.com/*"});
	if (!tab) 
	{
		infoBox.innerHTML = "Please make sure that you are on Seneca";
		infoBox.className = "neg";
		return;
	}
	chrome.scripting.executeScript({
		target: {tabId: tab.id},
		files: ["inject.js"]
	});
	chrome.scripting.executeScript({
		target: {tabId: tab.id},
		func: storeSettings,
		args: [settings]
	});
}