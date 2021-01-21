package dbmi.hms.harvard.edu.quickstartmodules;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

import org.apache.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class Module {
	private static final Logger LOGGER = Logger.getLogger(Module.class.getName());

	protected void enterText(WebDriver driver, String xpath, String text) {
		driver.findElement(By.xpath(xpath)).sendKeys(text);
	}

	protected void click(WebDriver driver, WebElement element) {
		Actions action = new Actions(driver);
		// action.click(element)..perform();
		action.click(new WebDriverWait(driver, 60).until(ExpectedConditions.visibilityOf(element))).perform();

	}

	protected void clickEnter(WebDriver driver, WebElement element, int value) {
		Actions action = new Actions(driver);
		action.click(element).perform();

	}

	protected void doubleClick(WebDriver driver, WebElement element) {
		Actions action = new Actions(driver);
		// action.doubleClick(element).perform();
		action.doubleClick(new WebDriverWait(driver, 60).until(ExpectedConditions.visibilityOf(element))).perform();
	}

	protected void navigateByNode(WebDriver driver, String node) {
		if (!node.isEmpty()) {
			try {

				doubleClick(driver, new WebDriverWait(driver, 60)
						.until(ExpectedConditions.presenceOfElementLocated(By.partialLinkText(node))));
				// doubleClick(driver, new WebDriverWait(driver,
				// 60).until(ExpectedConditions.presenceOfElementLocated(By.partialLinkText(node))));
				// doubleClick(driver, new WebDriverWait(driver,
				// 60).until(ExpectedConditions.presenceOfElementLocated(By.linkText(node))));
				// doubleClick(driver, new WebDriverWait(driver,
				// 60).until(ExpectedConditions.presenceOfElementLocated(By.xpath("//*[text()=
				// '"+node+"']"))));

			}
			// doubleClick(driver,new //
			// WebDriverWait(driver,30).until(ExpectedConditions.visibilityOfElementLocated(By.xpath(".//*[contains(text(),
			// '"+node+"')]"))));

			catch (Exception e) {
				System.err.println("Element not found: " + e.getMessage());
				LOGGER.error(e.getMessage());

			} finally {
			}
		}

	}

	protected void dragDrop(WebDriver driver, WebElement source, WebElement target) {
		Actions action = new Actions(driver);
		action.moveToElement(source).moveByOffset(-20, 0).clickAndHold().release(target).perform();

		// ** action.moveByOffset(-1, -1).dragAndDrop(source, target).perform();
		// action.moveToElement(source).build().perform();

	}

	protected List<String> getNodes(String path) {
		List<String> nodes = new ArrayList<String>();
		for (String node : path.split("\\\\")) {
			if (!node.isEmpty()) {
				nodes.add(node);
			}
		}
		return nodes;
	}

	protected List<String> getReverseNodes(String path) {
		List<String> nodes = new ArrayList<String>();
		for (String node : path.split("\\\\")) {
			if (!node.isEmpty()) {
				nodes.add(0, node);
			}
		}
		return nodes;
	}

	protected boolean isElementPresent(WebDriver driver, By by) {
		try {
			driver.findElement(by);
			return true;
		} catch (NoSuchElementException e) {
			return false;
		}
	}

}
