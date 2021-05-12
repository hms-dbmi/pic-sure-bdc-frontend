package dbmi.hms.harvard.edu.authentication;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
//import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;

public class AuthTypes {
	private static WebDriverWait wait;
	private static String username = System.getProperty("username");
	private static String password = System.getProperty("password");
	
	Map<String, String> authTypes = new HashMap<String, String>() {
		{
			put("HMS", "Harvard Medical School");

		}
	};

	public void doAuth(WebDriver driver, Map testPlan) throws InterruptedException, IOException {
		switch (testPlan.get("authmethod").toString()) {
		case "HMS":
			doHMSAuth(driver, testPlan);
		case "PUB":
			dopublicauth(driver, testPlan);
			break;
		case "GOOGLELOGIN":
			doGoogleLogin(driver, testPlan);
			break;
		case "ADMINLOGIN":
			doAdminLogin(driver, testPlan);
			break;
		case "ERACOMMON":
			doEraCommonLogin(driver, testPlan);
			break;
	
			
		}
	}

	private void doEraCommonLogin(WebDriver driver, Map testPlan) throws InterruptedException, IOException {
		
try {
			
			System.out.println("**********************Login with  eRA Common account***************");
			String usernamebox = "//input[@id='USER']";
			String passwordbox = "//input[@id='PASSWORD']";
			String signinButton = "//button[@type='submit']";
			String yesAuthorize ="//button[@id='yes']";
			String IAgree ="//input[@name='_eventId_proceed']";
				
			driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
			wait = new WebDriverWait(driver, 40);
			File file = ((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
			
			wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[@class='fence-login-btn']"))).click();
			
			
			FileUtils.copyFile(file, new File("screensusername.png"));
			
			wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(usernamebox))).sendKeys(username);
			
			File filePass = ((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
			
			FileUtils.copyFile(filePass, new File("screenpassword.png"));
					
			wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(passwordbox))).sendKeys(password);
			
			wait.until(ExpectedConditions.elementToBeClickable(By.xpath(signinButton))).click();
						
			/*Actions actions = new Actions(driver);
	    
			actions.keyDown(Keys.CONTROL).sendKeys(Keys.END).perform();
		*/    
		    wait.until(ExpectedConditions.elementToBeClickable(By.xpath(IAgree))).click();
		    
		    File IAgreeScreen = ((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
				
		    //((JavascriptExecutor) driver).executeScript("window.scrollTo(0, document.body.scrollHeight)");
		    FileUtils.copyFile(IAgreeScreen, new File("IAgree.png"));
		    
		    
			wait.until(ExpectedConditions.elementToBeClickable(By.xpath(yesAuthorize))).click();
					
			//actions.keyDown(Keys.CONTROL).sendKeys(Keys.HOME).perform();

			
		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}

	

	private void doAdminLogin(WebDriver driver, Map testPlan) throws InterruptedException {
		try {
			
			String usernamebox = ".//*[@id='j_username']";
			String passwordbox = ".//*[@id='j_password']";
			String submitbutton = ".//*[@id='loginButton']";
			//String analyzeMenu = ".//*[@id='menuLinks']/tbody/tr/th[3]";
			String analyzeMenu =".//*[@class='menuVisited']";
			driver.findElement(By.xpath(usernamebox)).sendKeys(testPlan.get("username").toString());
			driver.findElement(By.xpath(passwordbox)).sendKeys(testPlan.get("password").toString());
			//Thread.sleep(10000);
			driver.findElement(By.xpath(submitbutton)).click();
			Thread.sleep(20000);
			if (driver.findElements(By.xpath(".//span[text()='Comparison']")).size() != 0) {
				System.out.println("The default page is Dataset Explorer");
							}
			else{
			driver.findElement(By.xpath(analyzeMenu)).click();
			}
		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private void doGoogleLogin(WebDriver driver, Map testPlan) throws InterruptedException, IOException {

		try {
			
			System.out.println("**********************Login with  Google account***************");
			String usernamebox = ".//input[@type='email']";
		//	By nextButtonUser = By.xpath(".//*[@id='identifierNext']");
			String passwordbox = ".//input[@type='password']";
		//	String nextButtonPass = ".//*[@id='passwordNext']";
			String submitbutton = "//*[@id='ctl00_ContentPlaceHolder1_SubmitButton']";
	        
			driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);
			driver.manage().window().maximize();
			Thread.sleep(5000);
			wait = new WebDriverWait(driver, 40);
		/*	try{*/
			//wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//span[contains(text(),'LOGIN WITH GOOGLE')]")));
			Actions test = new Actions(driver);
			WebElement btn = driver.findElement(By.xpath("//span[contains(text(),'LOGIN WITH GOOGLE')]"));
			test.doubleClick(btn).perform();
			
			/*Action seriesOfActions = builder
					.moveToElement(driver.findElement(By.xpath("//span[contains(text(),'LOGIN WITH GOOGLE')]")))
					.click().build();
			*/			
			File file = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
	        FileUtils.copyFile(file, new File("screenshotclickLogin.png"));
			
			/*}
			
			catch(org.openqa.selenium.TimeoutException t)
			
			{
				File file=((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
				FileUtils.copyFile(file, new File("D:\\picsure\\screenshot.png"));				
				throw(t);
					
			}*/
			
			wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(usernamebox))).sendKeys(username);
		/*	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(usernamebox)));
			WebElement Email = driver.findElement(By.xpath(usernamebox));
			Actions email = new Actions(driver);
			email.sendKeys(Email, username);
		*/	
			
			
	        //test.click(wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(usernamebox)))).sendKeys(usernamebox);
			
			//File file=((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
			File capUserName = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			FileUtils.copyFile(capUserName, new File("usernamescreenshot.png"));
			
			WebElement NextUserNamebtn = driver.findElement(By.xpath(".//*[@id='identifierNext']"));			
			//driver.findElement(By.xpath(nextButtonUser)).click();
			test.click(NextUserNamebtn).perform();
			
			
	        //wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(passwordbox))).sendKeys(testPlan.get("password").toString());
	        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(passwordbox))).sendKeys(password);
	        
	        File capPasswd = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			FileUtils.copyFile(capPasswd, new File("passwordscreenshot.png"));
			
			WebElement nextButtonPass = driver.findElement(By.xpath(".//*[@id='passwordNext']"));
			
	        //driver.findElement(By.xpath(nextButtonPass)).click();
	        test.click(nextButtonPass).perform();
	        Thread.sleep(3000);
	        File checkLogin = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			FileUtils.copyFile(checkLogin, new File("checkLoginScreen.png"));
			
			Thread.sleep(7000);
			
			//Thread.sleep(30000);
			//driver.findElement(By.xpath("//span[contains(text(),'LOGIN')]")).click();
			//File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			//wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(text(),'LOGIN WITH GOOGLE')]"))).click();
			
		//	driver.findElement(By.xpath("//span[contains(text(),'LOGIN WITH GOOGLE')]")).click();
		//	wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(passwordbox)));
			 //Thread.sleep(5000);
			
		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	public void doHMSAuth(WebDriver driver, Map testPlan) {

		try {

			String usernamebox = ".//*[@id='ctl00_ContentPlaceHolder1_UsernameTextBox']";
			String passwordbox = "//*[@id='ctl00_ContentPlaceHolder1_PasswordTextBox']";
			String submitbutton = "//*[@id='ctl00_ContentPlaceHolder1_SubmitButton']";

			driver.findElement(By.xpath(usernamebox)).sendKeys(testPlan.get("username").toString());
			driver.findElement(By.xpath(passwordbox)).sendKeys(testPlan.get("password").toString());

		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		// driver.findElement(By.xpath("//*[@id='ctl00_ContentPlaceHolder1_PasswordTextBox']")).sendKeys(PASSWORD);
	}

	public void dopublicauth(WebDriver driver, Map testPlan) {
		try {

			String publicLogin = ".//*[@id='public']";
			driver.findElement(By.xpath(publicLogin)).click();

		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		// driver.findElement(By.xpath("//*[@id='ctl00_ContentPlaceHolder1_PasswordTextBox']")).sendKeys(PASSWORD);
	}

	public Map<String, String> getAuthTypes() {
		return authTypes;
	}

	public void setAuthTypes(Map<String, String> authTypes) {
		this.authTypes = authTypes;
	}

}
