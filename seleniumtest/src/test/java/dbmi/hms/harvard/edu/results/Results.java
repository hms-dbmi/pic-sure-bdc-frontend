package dbmi.hms.harvard.edu.results;

import java.util.Map;

import org.openqa.selenium.WebDriver;

import dbmi.hms.harvard.edu.reporter.Reporter;

public abstract class Results {

	public void doResults(WebDriver driver, Map testPlan) {
		doResultsCheck(driver, testPlan.get("success").toString(), testPlan.get("successvalue").toString());
	}

	public void doResults(WebDriver driver, Map testPlan, Reporter reporter) {
		doResultsCheck(driver, testPlan, reporter);
	}

	public void doResultsCheck(WebDriver driver, String successType, String successVal) {
	};

	public void doResultsCheck(WebDriver driver, Map testPlan, Reporter reporter) {
	};
}
