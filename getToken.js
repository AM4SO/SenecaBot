const puppeteer = require("puppeteer");
const fs = require("fs");

const getToken = async () => {
  const browser = await puppeteer.launch({ headless: false, args:['--user-data-dir=%userprofile%\\AppData\\Local\\Chromium\\User Data\\Profile 1','--window-size=10,10']});
  const page = await browser.newPage();
  await page.goto("https://app.senecalearning.com/login");

  page.on("response", async (response) => {
	token = "";

	headers = response.request().headers();
	if (headers["access-key"]){
		token = headers["access-key"];
		fileWrite = fs.writeFile("access-key.txt", token, function(err){
			if(err){console.log(err);}
			else console.log("Saved token to file");
			browser.close();
		});
	}
  });
};
getToken();