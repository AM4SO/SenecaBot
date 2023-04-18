AUTOSTART_BOT = true;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Running");
});
async function wait(time){
	return new Promise(r => setTimeout(r, time));
}
async function getActiveTab(){
	let [tab] = await chrome.tabs.query({active: true});
	return tab;
}
var Console = {
	log: function (message, tabID){
		chrome.scripting.executeScript({
			target: {tabId: tabID},
			func: function(string){console.log(string);},
			args: [message]
		})
	}
}
autoStart = async function(tab){ // tabId, windowId
	if (!AUTOSTART_BOT)return;
	if (tab.pendingUrl.includes("section-overview")){
		await wait(5000);
		injectScript(tab);
	}
};
chrome.tabs.onCreated.addListener(autoStart);
function storeSettings(settings){
	localStorage.setItem("SenecaBotSettings", JSON.stringify(settings));
}
async function injectScript(tab) {
	studyMode = "Adaptive";
	settings = {
		"OnlyCompleteOne": false,
		"RepeatSameSection": true,
		"StudyMode": studyMode
	}
	if (!tab){
		let [tab] = await chrome.tabs.query({active: true, currentWindow:true, url:"https://app.senecalearning.com/*"});
		if (!tab) return;	
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
//thing();