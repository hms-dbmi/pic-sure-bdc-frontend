package dbmi.hms.harvard.edu.quickstartmodules;

import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class SearchBySubjectna extends Module {
	// private String searchBySubjectTab =
	// ".//*[@id='ontPanel__ontFilterPanel']/a[2]/em/span/span";
	private String searchBySubjectTab = "//*[contains(text(), 'Search by Subject')]";
	//private String searchBox = ".//*[@id='ontsearchterm']";
	private String searchBox =".//*[@id='search-ac']";
	private String typeDropDown = ".//*[@id='tagtype']";
	//private String searchButton = ".//*[@id='ontSearchButton']";
	
	private String clearSearch=".//*[@id='clearbutton']/a";
	private String searchResult = ".//*[@id='searchresultstext']";
	//private String searchClearButton = ".//input[@class='searchform' and @value='CLEAR']";
	public static String result;

	public void doSelectNavigationTab(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(searchBySubjectTab)));
	}

	public void doSearch(WebDriver driver, String searchTerm) {
		enterText(driver, searchBox, searchTerm);
		//click(driver, driver.findElement(By.xpath(searchButton)));
	}

	public void getSearchResult(WebDriver driver)

	{
		WebElement resultSearchSub = driver.findElement(By.xpath(searchResult));
		result = resultSearchSub.getText();
		
	}
	public void doClearSearchBox(WebDriver driver)

	{
		click(driver, driver.findElement(By.xpath(clearSearch)));
	}

	
	/*public void docheckAlertText(WebDriver driver) {
		Alert alert = driver.switchTo().alert();
		
		alert.accept();

	}
*/
}
