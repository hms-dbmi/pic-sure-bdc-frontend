package dbmi.hms.harvard.edu.quickstartmodules;

import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;

import org.apache.velocity.texen.util.FileUtil;
import java.io.File;

import org.apache.commons.io.FileUtils;

import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import com.opencsv.CSVReader;

public class QueryBuilder extends Module {
	
	private String subset1box = ".//div[@subset='1']/descendant::div[@class='panelBoxList']";
	private String subset2box = ".//div[@subset='2']/descendant::div[@class='panelBoxList']";
	private String subset1boxtwo = ".//div[@class='panelModel' and @subset='1'] //div[@class='panelBox' and @style='height: 49px;']";
	private String subset2boxtwo = ".//div[@class='panelModel' and @subset='2'] //div[@class='panelBox' and @style='height: 49px;']";
	private String navigationTab = ".//*[@id='ontPanel__navigateTermsPanel']/a[2]/em/span/span";
	private String exclude = ".//*[@id='queryTable']/tbody/tr[2]/td[1]/div[1]/div/div[4]/span[1]/label[2]/span";
	private String clear = "//button[@class='flatbutton clearbutton'][contains(text(),'Clear All Panels and Analysis')]";
	private String comparisonTab = "//span[contains(@class,'x-tab-strip-text')][contains(text(),'Comparison')]";
	private String setNoValue = ".//*[@id='ext-gen151']/div[1]/table/tbody/tr[2]/td[1]/input[1]";
	private String setLowHighFlagValue = ".//*[@id='ext-gen151']/div[1]/table/tbody/tr[2]/td[1]/input[2]";
	private String setValueNumeric = ".//*[@id='ext-gen139']/div[1]/table/tbody/tr[2]/td[1]/input[3]";
	private String setValueTextBox = ".//*[@id='tValueLowValue']";
	private String selectSetOperator = ".//*[@id='setValueOperator']";
	private String selectLowHighRange = ".//*[@id='setValueHighLowSelect']";
	private String subsetOKbutton = ".//*[@class='x-btn-text'  and @id='ext-gen117']";
	private String setValueTextBoxHigh = ".//*[@id='setValueHighValue']";
	private String searchedSubject = ".//span[contains(text(),'mexican')]";
	private String deleteButton = ".//*[@id='clearGroup1_1']";
	private String doRunquery = "//span[@class='btn constrain-apply-btn']";
	private String saveSubSetButton = ".//*[@id='ext-gen59']/div[1]/button[1]";
	private String txtBoxSaveSubset = ".//*[@id='txtSubsetDescription']";
	private String saveSubSets = ".//*[@value='Save Subsets']";
	private static String downloadedFileColumn;
	private String fractalisTab = ".//*[@id='resultsTabPanel__fractalisPanel']/a[2]/em/span/span";
	String okexlude = "html/body/div[28]/div[2]/div[2]/div/div/div/div/div/table/tbody/tr/td[1]/table/tbody/tr/td[2]";
	private String chartSize = ".//*[@class='fjs-tm-chart-size']/button[3]";
	public static String textSubsetBoxValue;
	private String fractalisScatterPlot = "//button[@value='scatterplot']";
	private String fractalisBoxPlot = "//button[@value='boxplot']";
	private String fractalisPca = "//button[@value='pca']";
	private String fractalisHistogram = "//button[@value='histogram']";
	private String fractalisSurvivalPlot = "//button[@value='survivalplot']";
	private String fractalisBox = "//div[@class='fjs-tm-concept-box']";
	private String resetView = "//button[contains(text(),'Clear View')]";
	private String clearAnalysisCache = "//button[contains(text(),'Clear Cache')]";
	private String ScatterCorrelationMethods = ".//input[@data-v-6f4ce107=''and @type='radio']";
	private String SurvivalEstimatorMethods = ".//input[@data-v-adc7a632=''and @type='radio']";
	private String BoxPlotDataTransformation = ".//*[@class='fjs-transformation-select']";
	private String DataAnalysisClickSelect = ".//*[@class='fjs-tm-charts']/div[2]/div/div[1]/div/span";
	private String QueryBuilderSearchBox = ".//*[@id='filter-list']/div/div/div[1]/div[1]/div[2]/input";
	private String NumericValueOneTextBox = "//input[contains(@class,'constrain-value constrain-value-one form-control value-operator')]";
	private String NumericValueTwotextBox = "//input[@class='constrain-value constrain-value-two form-control value-operator']";
	private String deleteQuery = ".//*[@id='filter-list']/div[1]/div/div[1]/div[2]/div[2]/div[2]/a";
	private String constraintSearchButton = ".//*[@id='filter-list']/div/div/div[2]/div/div[2]/span";
	private String editQueryButton = "div.container:nth-child(2) div.col-md-8 ul.container:nth-child(3) div.filter-list-entry.row.saved:nth-child(1) div.filter-row.container div.filter-search-row.row:nth-child(1) div.filter-saved > div.edit.btn.btn-default.col-md-1";
	private String selectDataForExport = ".//*[@id='select-btn']";
	private String prepareDownload = ".//*[@id='prepare-btn']";
	private String downloadButton = ".//*[@id='download-btn']";
	private String dataTree = "//a[@id='j1_1_anchor']";
	
	
	public void enterTextInQueryBox(WebDriver driver, String text) {
	driver.findElement(By.xpath(QueryBuilderSearchBox)).sendKeys(text);

	}

	public void enterByNumericValue(WebDriver driver, String enterNumber) {
		driver.findElement(By.xpath(NumericValueOneTextBox)).clear();
		driver.findElement(By.xpath(NumericValueOneTextBox)).sendKeys(enterNumber);

	}

	public void editingQuery(WebDriver driver) {
		click(driver, driver.findElement(By.cssSelector(editQueryButton)));
	}

	public void enterByNumericBetween(WebDriver driver, String LowerRange, String HigherRange) {
		driver.findElement(By.xpath(NumericValueOneTextBox)).sendKeys(LowerRange);
		driver.findElement(By.xpath(NumericValueTwotextBox)).sendKeys(HigherRange);

	}

	public void doSelectConstraintSearch(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(constraintSearchButton)));
	}

	public void doSelectExport(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(selectDataForExport)));
	}

	public void downloadButton(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(downloadButton)));
	}

/*	public void clickPrepareDownload(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(prepareDownload)));
	}
*/
	public void doubleClickPrepareDownload(WebDriver driver) {
		Actions action = new Actions(driver);
		// action.doubleClick(element).perform();
		action.doubleClick(new WebDriverWait(driver, 10).until(ExpectedConditions.visibilityOf(driver.findElement(By.xpath(prepareDownload))))).perform();
	}
	
	public void doSelectNavigationTab(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(navigationTab)));
		
		
	}

	public void enterFromKeyborad() throws AWTException
	{
		Robot r = new Robot();
		r.keyPress(KeyEvent.VK_ENTER);
		r.keyRelease(KeyEvent.VK_ENTER);
		
	}
	
	public void doClickOK(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(okexlude)));
	}

	public void doRunQuery(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(doRunquery)));
	}
	public void doClickSelect(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(DataAnalysisClickSelect)));
	}

	public void doClickChartSize(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(chartSize)));
	}
	

	public void doSaveComparison(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(saveSubSetButton)));
	}

	public void doEnterSubsetName(WebDriver driver, String subsetName) {
		// click(driver, driver.findElement(By.xpath(txtBoxSaveSubset)));
		driver.findElement(By.xpath(txtBoxSaveSubset)).sendKeys(subsetName);
	}

	public void deleteButton(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(saveSubSetButton)));
	}

	

	public void deleteButtonQuery(WebDriver driver) {
		click(driver, driver.findElement(By.cssSelector("div.container:nth-child(2) div.col-md-8 ul.container:nth-child(3) div.filter-list-entry.row.saved:nth-child(1) div.filter-row.container div.filter-search-row.row:nth-child(1) div.filter-saved > div.delete.btn.btn-default.col-md-2")));
	}
	public void saveSubsets(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(saveSubSets)));
	}

	public void doDelete(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(deleteButton)));
	}

	public void doCheckSubsetBox(WebDriver driver) {
		WebElement subsetBoxValue = driver.findElement(By.xpath(subset1box));
		textSubsetBoxValue = subsetBoxValue.getText();

	}

	public void doSelectExclude(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(exclude)));
	}

	public void doSelectComparison(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(comparisonTab)));
	}

	public void doSelectByLowHighFlag(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(setLowHighFlagValue)));
	}

	public void doubleclickData(WebDriver driver) {

		Actions actions = new Actions(driver);
		WebElement data = driver.findElement(By.xpath(dataTree));
		actions.doubleClick(data).perform();
		
	}

	public void doSelectByNumericValue(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(setValueNumeric)));
	}

	public void doSelectNoValue(WebDriver driver) {
		driver.findElement(By.xpath(subsetOKbutton)).click();
	}

	public void doDeleteQuery(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(deleteQuery)));
	}

	public void doSelectFlagRange(WebDriver driver, Integer i) {
		Select oSelect = new Select(driver.findElement(By.xpath(selectLowHighRange)));
		oSelect.selectByIndex(i);
	}

	public void doSelectOpeartor(WebDriver driver, Integer i) {
		Select oSelect = new Select(driver.findElement(By.xpath(selectSetOperator)));
		oSelect.selectByIndex(i);
	}

	public void enterValue(WebDriver driver, String subsetValue) {
		driver.findElement(By.xpath(setValueTextBox)).sendKeys(subsetValue);
		driver.findElement(By.xpath(subsetOKbutton)).click();
	}

	public void enterBetweenValue(WebDriver driver, String subsetLowValue, String subsetHighValue) {
		driver.findElement(By.xpath(setValueTextBox)).sendKeys(subsetLowValue);
		driver.findElement(By.xpath(setValueTextBoxHigh)).sendKeys(subsetHighValue);
		driver.findElement(By.xpath(subsetOKbutton)).click();
	}

	public void doNavigateByPath(WebDriver driver, String path) {

		List<String> nodes = getNodes(path);
		for (String node : nodes) {

			navigateByNode(driver, node);

		}
	}

	public void doReverseNavigateByPath(WebDriver driver, String path) {
		List<String> nodes = getReverseNodes(path);
		for (String node : nodes) {
			navigateByNode(driver, node);
		}
	}

	public void doDragAndDrop(WebDriver driver, String path, String subset) {
		List<String> nodes = getNodes(path);
		try {
			WebElement source = driver.findElement(By.partialLinkText(nodes.get(nodes.size() - 1)));
			// WebElement source =
			// driver.findElement(By.linkText(nodes.get(nodes.size() - 1)));
			String targetStr = null;
			if (subset.equalsIgnoreCase("subset1"))
				targetStr = subset1box;
			if (subset.equalsIgnoreCase("subset2"))
				targetStr = subset2box;
			if (subset.equalsIgnoreCase("subsetmul1"))
				targetStr = subset1boxtwo;
			if (subset.equalsIgnoreCase("subsetmul2"))
				targetStr = subset2boxtwo;
			if (subset.equalsIgnoreCase("fractConCate1"))
				targetStr = fractalisBox;
			if (subset.equalsIgnoreCase("fractConCate2"))
				targetStr = fractalisBox;
			if (subset.equalsIgnoreCase("fractConNum1"))
				targetStr = fractalisBox;
			if (subset.equalsIgnoreCase("fractConNum2"))
				targetStr = fractalisBox;
			// if (subset.equalsIgnoreCase("relation"))
			// targetStr = relationbox;
			WebElement target = driver.findElement(By.xpath(targetStr));
			dragDrop(driver, source, target);
		} catch (Exception e) {
			System.out.println("Unable to find the element" + e.getMessage());
		}
	}

	public void doClearAnalysis(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(comparisonTab)));
		click(driver, driver.findElement(By.xpath(clear)));

		Alert alert = driver.switchTo().alert();
		alert.accept();

	}

	public void doSelectFractalisAnalysis(WebDriver driver, String ChartType) throws InterruptedException {
		// Select oSelect = new
		// Select(driver.findElement(By.xpath(selectAnalysisType)));
		// oSelect.selectByIndex(i);

		System.out.println("Charttype is " + ChartType);
		String ChatType = ChartType.toString();
		Actions action = new Actions(driver);
		switch (ChartType) {
		case "ScatterPlot":
			System.out.println("Selecting ScatterPlot Analysis");
			click(driver, driver.findElement(By.xpath(fractalisScatterPlot)));

			Thread.sleep(5000);
			break;

		case "BoxPlot":
			click(driver, driver.findElement(By.xpath(fractalisBoxPlot)));
			break;
		case "PCA":
			click(driver, driver.findElement(By.xpath(fractalisPca)));
			break;
		case "Histogram":
			click(driver, driver.findElement(By.xpath(fractalisHistogram)));
			break;
		case "SurvivalPlot":
			click(driver, driver.findElement(By.xpath(fractalisSurvivalPlot)));
			break;
		default:
			System.err.println("Something is missing  ");
			break;

		}
		;

	}

	public void doSearchDoDragAndDrop(WebDriver driver, String path, String subset) {
		WebElement source = driver.findElement(By.xpath(searchedSubject));
		String targetStr = null;
		if (subset.equalsIgnoreCase("subset1"))
			targetStr = subset1box;
		if (subset.equalsIgnoreCase("subset2"))
			targetStr = subset2box;
		if (subset.equalsIgnoreCase("subset1mul"))
			targetStr = subset1boxtwo;
		/*
		 * if (subset.equalsIgnoreCase("relation")) targetStr = relationbox;
		 */
		WebElement target = driver.findElement(By.xpath(targetStr));
		dragDrop(driver, source, target);
	}

	public void doSelectFractlis(WebDriver driver) throws InterruptedException {

		driver.findElement(By.xpath(fractalisTab)).click();
		Thread.sleep(10000);
	}

	public void checkState(WebDriver driver) throws InterruptedException {
		WebDriverWait wait = new WebDriverWait(driver, 70);
		wait.until(ExpectedConditions
				.presenceOfElementLocated(By.xpath(".//*[@class='fjs-item-label' and @data-state='SUCCESS']")));

		// Thread.sleep(10000);
	}

	/*
	 * public void addAnalysis(WebDriver driver) { click(driver,
	 * driver.findElement(By.xpath(addAnalysisType))); }
	 */

	public void resetReview(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(resetView)));
	}

	public void clearAnalysisCache(WebDriver driver) {
		click(driver, driver.findElement(By.xpath(clearAnalysisCache)));
	}

	public void doSelectSubMethod(WebDriver driver, Integer i) throws InterruptedException {
		// Select oSelect = new
		// Select(driver.findElement(By.xpath(selectAnalysisType)));
		// oSelect.selectByIndex(i);
		List<WebElement> correlationRadioBtn = driver.findElements(By.xpath(ScatterCorrelationMethods));

		System.out.println("Number of Radio buttons are :" + correlationRadioBtn.size());

		correlationRadioBtn.get(i).click();

		// Create a boolean variable which will hold the value (True/False)
		// boolean bValue = false;

		// This statement will return True, in case of first Radio button is
		// selected
		// bValue = CorrelationRadioBtn.get(0).isSelected();

		// This will check that if the bValue is True means if the first radio
		// button is selected

		/*
		 * if(bValue == true){
		 * 
		 * for(WebElement radio : CorrelationRadioBtn) { if(radio.isSelected())
		 * { String selectedValue
		 * =radio.findElement(By.xpath("./parent::label")).getText(); } }
		 */

	}

	public void doSelectSubMethodSurvival(WebDriver driver, Integer i) throws InterruptedException {

		List<WebElement> estimatorRadioBtn = driver.findElements(By.xpath(SurvivalEstimatorMethods));

		System.out.println("Number of Radio buttons are :" + estimatorRadioBtn.size());

		estimatorRadioBtn.get(i).click();
	}

	public void doSelectBoxPlotDataTransformation(WebDriver driver, int i) throws InterruptedException {
		// Select oSelect = new
		// Select(driver.findElement(By.xpath(selectAnalysisType)));
		// oSelect.selectByIndex(i);
		Select oSelect = new Select(driver.findElement(By.xpath(BoxPlotDataTransformation)));
		List<WebElement> elementCount = oSelect.getOptions();
		// System.out.println(elementCount.size());

		for (int j = 0; j < elementCount.size(); j++) {
			String sValue = elementCount.get(j).getText();
			// System.out.println(sValue);
		}

		elementCount.get(i).click();

	}

	public boolean isFileDownloaded(String downloadPath, String fileName) {
		boolean flag = false;
		File dir = new File(downloadPath);
		File[] dir_contents = dir.listFiles();

		for (int i = 0; i < dir_contents.length; i++) {
			if (dir_contents[i].getName().equals(fileName))
				/*
				 * { dir_contents[i].delete(); return true; }
				 */ 
				return flag = true;
						
		}

		return flag;
	}

	public void DeleteAFile(String downloadPath, String filename) throws IOException {
		// get current project path
		// String filePath = System.getProperty("user.dir");
		// create a new fileah
		File file = new File(downloadPath + "\\" + filename);
		if (!file.exists()) {
			// file.createNewFile();
			System.out.println("File is created");

		} else {
			// delete a file
			System.out.println("File already exist");
			file.delete();
		}
	}

	public static void takeSnapShot(WebDriver webdriver, String fileWithPath) throws Exception {

		// Convert web driver object to TakeScreenshot

		TakesScreenshot scrShot = ((TakesScreenshot) webdriver);

		// Call getScreenshotAs method to create image file

		File SrcFile = scrShot.getScreenshotAs(OutputType.FILE);

		// Move image file to new destination

		File DestFile = new File(fileWithPath);

		// Copy file at destination

		FileUtils.copyFile(SrcFile, DestFile);

	}

	// return downloadedFileColumn;

	// this will load content into list
	/*
	 * List<String[]> li = reader.readAll(); System.out.println(
	 * "Total rows which we have is " + li.size());
	 * 
	 * // create Iterator reference Iterator<String[]> i1 = li.iterator();
	 * 
	 */ // Iterate all values
	/*
	 * while (i1.hasNext()) {
	 * 
	 * String[] str = i1.next();
	 * 
	 * System.out.print(" Values are ");
	 * 
	 * for (int i = 0; i < str.length; i++) {
	 * 
	 * System.out.print(" " + str[i]);
	 * 
	 * } System.out.println("   ");
	 * 
	 * }
	 */
	// }

}
