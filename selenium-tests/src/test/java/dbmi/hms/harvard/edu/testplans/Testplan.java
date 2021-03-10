package dbmi.hms.harvard.edu.testplans;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dbmi.hms.harvard.edu.reporter.Reporter;
import dbmi.hms.harvard.edu.results.SuccessTypes;

public abstract class Testplan {
	public static final List<String> REQUIRED_FIELDS = new ArrayList<String>() {
		{
			add("name");
			add("url");
			// add("authmethod");
		}
	};

	public static Map testPlan;

	public void setTestPlan(Map testPlan) {
		try {
			validateTestPlan(testPlan);
		} catch (Exception e) {
			this.testPlan = testPlan;
			e.printStackTrace();
		} finally {
			this.testPlan = testPlan;
		}
	}

	public void doPlan() throws InterruptedException {
	};

	public void validateTestPlan(Map testPlan) throws Exception {
		for (String reqField : REQUIRED_FIELDS) {
			if (!testPlan.containsKey(reqField))
				throw new Exception("Required field " + reqField + " is missing!");
		}
		if (testPlan.get("name") == null) {
			throw new Exception("Invalid Test Plan - Name field is null");
		} else if (testPlan.get("url") == null) {
			throw new Exception("Invalid Test Plan - url field is null");
		}
		/*
		 * else if (testPlan.get("authmethod") == null) { throw new Exception(
		 * "Invalid Test Plan - authMethod field is null"); }
		 */
		/*else if (testPlan.get("successtype") != null && testPlan.get("successval") == null) {
			throw new Exception("Invalid Test Plan - if success is expected a success value must be given");
		} else if (validateSuccessType(testPlan.get("success").toString()) != true) {
			throw new Exception("Invalid Test Plan - Success Type: " + testPlan.get("success") + " is not valid");
		}*/
		;
	}

	protected Boolean validateSuccessType(String success) {
		for (SuccessTypes successType : SuccessTypes.values()) {
			if (successType.toString().equals(success)) {
				return true;
			}
		}
		return false;
	}

	/*
	 * public void loginSite() throws InterruptedException { // TODO
	 * Auto-generated method stub
	 * 
	 * }
	 */

	public void closeDriver() {
	}

	public void verifyPicsureUILaunch(Reporter reporter) throws InterruptedException, Exception {
		// TODO Auto-generated method stub

	}

	public void launchApp() throws InterruptedException {
		// TODO Auto-generated method stub

	}

	public void verifyAutoSuggestionInSearchBox(Reporter reporter)
			throws InterruptedException, Exception, IllegalAccessException {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderNoValue(Reporter reporter)
			throws InterruptedException, Exception, IllegalAccessException {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericLessThan(Reporter reporter) throws Exception, Throwable {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericValueBetween(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderANDCondition(Reporter reporter) throws InterruptedException, Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderEditing(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderDeletion(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderSearchInvalidData(Reporter reporter)
			throws InterruptedException, InstantiationException, IllegalAccessException, Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderSearchIsCaseInsensitive(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderSearchInCaseSensitivity(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifyTheLoadedData(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyDownloading(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyAutoSuggestionForConceptTerm(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifySearchFunctionalityForConceptTerm(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifyAutoSuggestionInSearch(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericGreaterThan(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyTheLoadedDataforMultipleConceptsAnd(Reporter reporter) throws InterruptedException, Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericdecimalvalues(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericNoValueMessage(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericInBtnValidationForTextBoxMessage(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderExportManualSelectionFromDataTree(Reporter reporter) {
		// TODO Auto-generated method stub

	}

	public void verifySuccessfulLoginPicsureUILaunch(Reporter reporter) throws InterruptedException, Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderBack(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub

	}

	public void verifyQueryBuilderByNumericValidation(Reporter reporter) throws InterruptedException, Exception, Throwable {
		// TODO Auto-generated method stub
		
	}

	public void verifyQueryBuilderRestrictByValue(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyQueryBuilderSelectDataForExport(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyUserProfile(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyBDCAutoInclusionColumnReport(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyDataaccessDashboard(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	
	public void verifyHelpContactusPageload(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyLogoutPicsure(Reporter reporter) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyAndLabel(Reporter reporter) throws InterruptedException, Exception {
		// TODO Auto-generated method stub
		
	}

	public void verifyDataaccessExplore(Reporter reporter) throws Exception, IllegalAccessException {
		// TODO Auto-generated method stub
		
	}
	
	
	

	/*
	*//**
		 * Unit test for simple App.
		 */
	/*
	 * public class TestPlan extends TestCase {
	 *//**
		 * Create the test case
		 *
		 * @param testName
		 *            name of the test case
		 */
	/*
	 * public TestPlan( String testName ) { super( testName ); }
	 * 
	 *//**
		 * @return the suite of tests being tested
		 */
	/*
	 * public static Test suite() { return new TestSuite( TestPlan.class ); }
	 * 
	 *//**
		 * Rigourous Test :-)
		 */
	/*
	 * public void testApp() { assertTrue( true ); }
	 */}
