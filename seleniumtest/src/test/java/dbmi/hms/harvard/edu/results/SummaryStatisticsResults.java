package dbmi.hms.harvard.edu.results;

import java.util.Map;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

import dbmi.hms.harvard.edu.reporter.Reporter;

public class SummaryStatisticsResults extends Results {

	public String patientCountSubset1 = "//td[@colspan='2']//table[@width='100%']//tbody//tr//td[@align='center']//table[@class='analysis']//tbody//tr//td[1]";
	private String patientCountSubset2 = "//td[@colspan='2']//table[@width='100%']//tbody//tr//td[@align='center']//table[@class='analysis']//tbody//tr//td[3]";
	private String patientCountCommon = ".//*[@id='ext-gen56']/div/table[1]/tbody/tr[4]/td/table/tbody/tr/td/table/tbody/tr[2]/td[2]";
	// private String patientCountSubset1 =
	// ".//*[@class='analysis']/table[1]/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr[2]/td[1]";
	// public String patientCountSubset1 =
	// ".//*[@id='ext-gen157']/div/table/tbody/tr[4]/td/table/tbody/tr/td/table/tbody/tr[2]/td[1]";
	// private String patientCountSubset2 =
	// ".//*[@class='analysis']/table[1]/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr[2]/td[3]";
	// private String patientCountCommon =
	// ".//*[@id='ext-gen157']/div/table/tbody/tr[4]/td/table/tbody/tr/td/table/tbody/tr[2]/td[2]";
	// private String patientCountCommon
	// =".//*[@id='ext-gen62']/div/table[1]/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr[2]/td[2]";
	// private String patientCountCommon
	// =".//*[@id='ext-gen56']/div/table[1]/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr[2]/td[2]";


	public void test() {
		System.out.println();
	}

	/**
	 * Simple console output
	 */
	public void doResultsCheck(WebDriver driver, String successType, String successVal) {

		WebDriverWait wait = new WebDriverWait(driver, 30);
		wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(), 'Subject Totals')]")));
		// wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//*[contains(text(),
		// 'Subject Totals')]")));
		System.out.println("The value of successType" + successType);
		switch (successType) {
		case "patientcountsubset1":
			doVerifyPatientCountSubset1(driver, successVal);
			break;
		case "patientcountsubset2":
			doVerifyPatientCountSubset2(driver, successVal);
			break;
		case "patientCountCommon":
			doVerifypatientCountCommon(driver, successVal);
			break;

		}
	}

	private void doVerifyPatientCountSubset1(WebDriver driver, String successVal) {
		String resultBox = driver.findElement(By.xpath(patientCountSubset1)).getText();
		// System.out.println("Check the PatientCountSubset1");
		if (resultBox.equals(successVal)) {
			System.out.println("Success!");
		} else {
			System.out.println("Fail");
		}
		;

	}

	private void doVerifyPatientCountSubset2(WebDriver driver, String successVal) {
		String resultBox = driver.findElement(By.xpath(patientCountSubset2)).getText();

		if (resultBox.equals(successVal)) {
			System.out.println("Success!");
		} else {
			System.out.println("Fail");
		}
		;

	}

	private void doVerifypatientCountCommon(WebDriver driver, String successVal) {
		String resultBox = driver.findElement(By.xpath(patientCountCommon)).getText();

		if (resultBox.equals(successVal)) {
			System.out.println("Success!");
		} else {
			System.out.println("Fail");
		}
		;

	}

	/**
	 * Use reporting object to output to console
	 */
	public void doResultsCheck(WebDriver driver, Map testPlan, Reporter reporter) {
		String successType = testPlan.get("success").toString();
		// WebDriverWait wait = new WebDriverWait(driver, 0);
		WebDriverWait wait = new WebDriverWait(driver, 30);
		wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(), 'Subject Totals')]")));
		// wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//*[contains(text(),//
		// 'Subject Totals')]")));
		switch (successType) {
		case "patientcountsubset1":
			doVerifyPatientCountSubset1(driver, testPlan, reporter);
			break;
		case "patientcountsubset2":
			doVerifyPatientCountSubset2(driver, testPlan, reporter);
			break;

		case "patientCountCommon":
			doVerifypatientCountCommon(driver, testPlan, reporter);
			break;

		}
	}

	public void doAssertResultTrue(WebDriver driver, Map testPlan, Reporter reporter) {
		// String successType = testPlan.get("success").toString();
		reporter.appendTestResults(testPlan, "passed");
	}

	public void doAssertResultFalse(WebDriver driver, Map testPlan, Reporter reporter) {
		// String successType = testPlan.get("success").toString();
		reporter.appendTestResults(testPlan, "failed");
	}

	private void doVerifyPatientCountSubset1(WebDriver driver, Map testPlan, Reporter reporter) {
		String successVal = testPlan.get("successvalue").toString();
		String resultBox = driver.findElement(By.xpath(patientCountSubset1)).getText();

		if (resultBox.equals(successVal)) {
			reporter.appendTestResults(testPlan, "passed");
		} else {
			reporter.appendTestResults(testPlan, "failed");
		}
		;
	}

	private void doVerifyPatientCountSubset2(WebDriver driver, Map testPlan, Reporter reporter) {
		String successVal = testPlan.get("successvalue").toString();
		String resultBox = driver.findElement(By.xpath(patientCountSubset2)).getText();

		if (resultBox.equals(successVal)) {
			if (testPlan.containsKey("expected")) {
				if (testPlan.get("expected").toString().equalsIgnoreCase("pass")) {
					reporter.appendTestResults(testPlan, "passed");
				} else {
					reporter.appendTestResults(testPlan, "failed");
				}
			} else {
				reporter.appendTestResults(testPlan, "passed");
			}
		} else {
			if (testPlan.containsKey("expected")) {
				if (testPlan.get("expected").toString().equalsIgnoreCase("fail")) {
					reporter.appendTestResults(testPlan, "passed");
				} else {
					reporter.appendTestResults(testPlan, "failed");
				}
			} else {
				reporter.appendTestResults(testPlan, "failed");
			}
		}
		;

		try {
			Assert.assertEquals(resultBox, successVal);
		} catch (AssertionError e) {
			System.out.println("Assertion error. ");
		}

	}

	private void doVerifypatientCountCommon(WebDriver driver, Map testPlan, Reporter reporter) {
		String successVal = testPlan.get("successvalue").toString();
		String resultBox = driver.findElement(By.xpath(patientCountCommon)).getText();

		if (resultBox.equals(successVal)) {
			if (testPlan.containsKey("expected")) {
				if (testPlan.get("expected").toString().equalsIgnoreCase("pass")) {
					reporter.appendTestResults(testPlan, "passed");
				} else {
					reporter.appendTestResults(testPlan, "failed");
				}
			} else {
				reporter.appendTestResults(testPlan, "passed");
			}
		} else {
			if (testPlan.containsKey("expected")) {
				if (testPlan.get("expected").toString().equalsIgnoreCase("fail")) {
					reporter.appendTestResults(testPlan, "passed");
				} else {
					reporter.appendTestResults(testPlan, "failed");
				}
			} else {
				reporter.appendTestResults(testPlan, "failed");
			}
		}

		try {
			Assert.assertEquals(resultBox, successVal);
		} catch (AssertionError e) {
			System.out.println("Sub Totals on the report is not matching to expected ");
			// reporter.appendTestResults(testPlan, "failed");
		}

		// System.out.println("Test Completed.");

	}

	public void doResultCheckGraph(WebDriver driver, Map testPlan, Reporter reporter) {
		// TODO Auto-generated method stub

	}
}
