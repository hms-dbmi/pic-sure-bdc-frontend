package dbmi.hms.harvard.edu.testdrivers;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

import org.apache.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
//import static org.junit.Assert.assertThat;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import com.esotericsoftware.yamlbeans.YamlException;
import com.esotericsoftware.yamlbeans.YamlReader;

import dbmi.hms.harvard.edu.reporter.Reporter;
import dbmi.hms.harvard.edu.testplans.Testplan;


public class TestDriver {
 
	public static final String TESTPLANS = "dbmi.hms.harvard.edu.testplans.";
	public static final String REPORTS = "dbmi.hms.harvard.edu.reporter.";
	private static Properties configProperties = new Properties();
	private static String baseURI = System.getProperty("pathtoconfigtest");
	
	// Read data from Properties file using Java Selenium

	static {

		try {
			final Logger LOGGER = Logger.getLogger(TestDriver.class.getName());
			String pathToConfigFile = baseURI + "Config.properties";
			configProperties.load(new FileInputStream(new File(pathToConfigFile)));
		} catch (FileNotFoundException e) {

			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static final Logger LOGGER = Logger.getLogger(TestDriver.class.getName());
	WebDriver driver;

	public static Testplan testPlan = null;
	static Reporter reporter = null;

	public static void readFile(String fileName) {
		try {
			YamlReader reader1 = new YamlReader(new FileReader(fileName));

			Map testConfig = (Map) reader1.read();
			if (testConfig != null) {

				if (testPlan == null)
					testPlan = initTestPlan(testConfig.get("type").toString(), testConfig);
				testPlan.setTestPlan(testConfig);
				if (reporter == null)
					reporter = initReporter(testConfig.get("reporter").toString());
			}
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (YamlException e) {
			e.printStackTrace();
		}
	}

	@BeforeTest

	public void setup() throws InterruptedException {

		LOGGER.info(
		
				"______________________________________Setting up the application PicsureUI ALL ______________________________________\n");
		readFile(configProperties.getProperty("intial.setup.picsureuiall"));
		testPlan.launchApp();
		LOGGER.info(
				"______________________________________Initial Setting up of PicsureUI  is Done______________________________________\n");

	}

	
		
	@Test(priority = 1)

	public void verify_loading_of_PicsureUI() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify that Picsure UI site loaded  is running-------------------------");
		readFile(configProperties.getProperty("verify.loadingofpicsureui"));
		testPlan.verifyPicsureUILaunch(reporter);
		LOGGER.info(
				"---------------------------------The test case verify that PicsureUI site loaded is completed-------------------------");

	}

	@Test(priority = 2)

	public void verify_successful_Login_To_PicsureUI() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify if user is logged in Picsure UI  is running-------------------------");
		readFile(configProperties.getProperty("verify.authorization.ofpicsureui"));
		testPlan.verifySuccessfulLoginPicsureUILaunch(reporter);
		LOGGER.info(
				"---------------------------------The test case verify if user is logged in Picsure UI  is completed-----------------------");

	}

@Test (priority=3)

	public void verify_QueryBuilder_ByNoValue() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNoValue is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.novalue"));
		testPlan.verifyQueryBuilderNoValue(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNoValue is completed-------------------------");

	}

@Test(priority=4)

	public void verify_QueryBuilder_ByNumericValue_LessThan() throws Throwable {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueLessthan is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.lessthan"));
		testPlan.verifyQueryBuilderByNumericLessThan(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueLessthan is completed-------------------------");

	}

 
@Test (priority=5)

	public void verify_QueryBuilder_ByNumericValue_GreaterThan() throws Throwable {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueGreaterThan is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.greaterthan"));
		testPlan.verifyQueryBuilderByNumericGreaterThan(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueGreaterThan is completed-------------------------");

	}

@Test (priority=6)
	public void verify_QueryBuilder_ByNumericValue_Between() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueBetween is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.inbetween"));
		testPlan.verifyQueryBuilderByNumericValueBetween(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericValueBetween is completed-------------------------");

	}


@Test (priority=7)

	public void verify_QueryBuilder_ANDCondition() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderANDCondition is running-------------------------");

		readFile(configProperties.getProperty("verify.queryresultandcondition"));
		testPlan.verifyQueryBuilderANDCondition(reporter);

		
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderANDCondition is completed-------------------------");

	}

@Test (priority=8)

	public void verify_QueryBuilder_Deletion() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderDeletion is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.deletion"));
		testPlan.verifyQueryBuilderDeletion(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderDeletion is completed-------------------------");

	}

	
@Test (priority=9)

		public void verify_QueryBuilder_BackButton() throws Exception {
			LOGGER.info(
					"---------------------------------The test case verifyQueryBuilder Back Button Functionality-------------------------");
			readFile(configProperties.getProperty("verify.backbutton.functionality"));
			testPlan.verifyQueryBuilderBack(reporter);
			LOGGER.info(
					"------------------------The test case verifyQueryBuilder Back Button Functionality is done-------------------------");

		}

@Test (priority=10)

	public void verify_QueryBuilder_Editing() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderEditing is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.editing"));
		testPlan.verifyQueryBuilderEditing(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderEditing is completed-------------------------");
	}

@Test(priority = 11)

	public void verify_QueryBuilder_SearchInvalidData() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderSearchInvalidData is running-------------------------");

		readFile(configProperties.getProperty("verify.queryresult.invaliddata"));
		testPlan.verifyQueryBuilderSearchInvalidData(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderSearchInvalidData is completed--------------(priority = 13)-----------");

	}

@Test(priority = 12)

	public void verify_QueryBuilder_Search_InCaseSensitivity() throws Exception {
		
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderSearchInCaseSensitivity is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.caseinsensitive"));
		testPlan.verifyQueryBuilderSearchInCaseSensitivity(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderSearchInCaseSensitivity is completed-------------------------");

	}

//@Test (priority = 13)

		public void verify_Downloading_ofData() throws Exception {
			LOGGER.info(
					"---------------------------------The test case verifyDownloading is running-------------------------");
			readFile(configProperties.getProperty("verify.queryresult.downloading.data"));
			testPlan.verifyDownloading(reporter);
			LOGGER.info(
					"---------------------------------The test case verifyDownloading is completed-------------------------");

		}
	//@Test (priority = 14)
			 //dependsOnMethods={"verifyDownloadingofData"})

		public void verify_TheLoadedData() throws Exception {
		 
		 readFile(configProperties.getProperty("verify.queryresult.downloading.data"));
		 
			LOGGER.info(
					"---------------------------------The test case verifyTheLoadedData is running-------------------------");

			testPlan.verifyTheLoadedData(reporter);
			LOGGER.info(
					"---------------------------------The test case verifyTheLoadedData is completed-------------------------");

		}
		
		
		//@Test (priority = 15)dependsOnMethods={"verifyDownloadingofData"})

		public void verify_TheLoadedData_ForMultipleConcetps() throws Exception {
			 
			 readFile(configProperties.getProperty("verify.queryresult.verify.multiple.concepts.downloadeddata"));
			 
				LOGGER.info(
						"---------------------------------The test case verify TheLoadedData For MultipleConcetps with AND condition is running-------------------------");

				testPlan.verifyTheLoadedDataforMultipleConceptsAnd(reporter);
				LOGGER.info(
						"---------------------------------The test case verify TheLoadedData For MultipleConcetps with AND condition  is completed-------------------------");

			}
		
@Test (priority = 16)
		public void verifypresenceOfANDLabel() throws Exception {
			 

			 
				LOGGER.info(
						"---------------------------------The test case verify presence of AND LABEL  is running-------------------------");
				readFile(configProperties.getProperty("verify.presenceof.andlabel"));
				testPlan.verifyAndLabel(reporter);
				LOGGER.info(
						"---------------------------------The test case verify presence of AND LABEL  is completed-------------------------");

			}
@Test (priority=17)

			public void verifyQueryBuilder_ByNumericValue_Decimal() throws Exception {
				LOGGER.info(
						"---------------------------------The test case verifyQueryBuilderByNumericValueDecimal is running-------------------------");
				readFile(configProperties.getProperty("verify.queryresult.bynumeric.decimalvalue"));
				testPlan.verifyQueryBuilderByNumericdecimalvalues(reporter);
				LOGGER.info(
						"---------------------------------The test case verifyQueryBuilderByNumericValueDecimal is completed-------------------------");

			}

@Test(priority=18)

			public void verify_QueryBuilder_ByNumericValue_OutOfRangeValidation() throws Throwable {
				LOGGER.info(
						"---------------------------------The test case verify QueryBuilderByNumericValue validation -------------------------");
				readFile(configProperties.getProperty("verify.validation.outofrange"));
				testPlan.verifyQueryBuilderByNumericValidation(reporter);
				LOGGER.info(
						"---------------------------------The test case verify QueryBuilderByNumericValue is completed-------------------------");

			}


@Test (priority=19)

	public void verify_QueryBuilder_ByNumeric_NoValue_Message() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericNoValueMessage is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.noinputvalue.message"));
		testPlan.verifyQueryBuilderByNumericNoValueMessage(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericNoValueMessage is completed-------------------------");

	}


//@Test (priority=20)

	public void verify_QueryBuilder_ByNumeric_InBtnValidation_ForTextBox() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericInBtnValidationForTextBox is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.between.validation.message"));
		testPlan.verifyQueryBuilderByNumericInBtnValidationForTextBoxMessage(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderByNumericInBtnValidationForTextBox is completed-------------------------");

	}

//@Test (priority=21)


	public void verify_QueryBuilder_Export_Manual_Selection_DataTree() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderExportManualSelectionFromDataTree is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.between.validation.message"));
		testPlan.verifyQueryBuilderExportManualSelectionFromDataTree(reporter);
		LOGGER.info(
				"---------------------------------The test case verifyQueryBuilderExportManualSelectionFromDataTree is completed-------------------------");

	}

	//@Test (priority=22)

	public void verify_QueryBuilder_Restrict_By_Value() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify Restrict By Value is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.lessthan"));
		testPlan.verifyQueryBuilderRestrictByValue(reporter);
		LOGGER.info(
				"---------------------------------The test case  verify Restrict By Value is completed-------------------------");

	}

	//@Test (priority=23)

	public void verify_SelectDataForExport() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify Restrict By Value is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.bynumeric.lessthan"));
		testPlan.verifyQueryBuilderSelectDataForExport(reporter);
		LOGGER.info(
				"---------------------------------The test case The test case verify Restrict By Value is completed-------------------------");
	}

@Test (priority=24)

	public void verify_userProfile() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify user Profile  is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.userprofile"));
		testPlan.verifyUserProfile(reporter);
		LOGGER.info(
				"---------------------------------The test verify userProfile is completed-------------------------");

	}

	//@Test (priority=25)
	public void verify_AutoBDCColumnReport() throws Exception {
		LOGGER.info(
				"---------------------------------The test case Auto BDC column  is running-------------------------");
		readFile(configProperties.getProperty("verify.datareportbdccolumn"));
		testPlan.verifyBDCAutoInclusionColumnReport(reporter);
		LOGGER.info(
				"---------------------------------The test auto BDC column is completed-------------------------");

	}


	@Test (priority=26)
	public void verify_dataaccessdashboard() throws Exception {
		LOGGER.info(
				"---------------------------------The test case dataaccess page load  is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.dataaccess"));
		testPlan.verifyDataaccessDashboard(reporter);
		LOGGER.info(
				"---------------------------------The test case dataaccess page load  is completed-------------------------");

	}

	
	@Test (priority=27)
	public void verify_dataaccessExploreButtonOpenAccess() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verifying Explore button  is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.dataaccess.explore"));
		testPlan.verifyDataaccessExploreOpenAccess(reporter);
		LOGGER.info(
				"---------------------------------The test case verifying Explore button  is completed-------------------------");

	}

	@Test (priority=28)
	public void verify_helpcontactus() throws Exception {
		LOGGER.info(
				"---------------------------------The test case helpContactUS is running-------------------------");
		readFile(configProperties.getProperty("verify.queryresult.helpcontactus"));
		testPlan.verifyHelpContactusPageload(reporter);
		LOGGER.info(
				"---------------------------------The test case helpContactUS is completed-------------------------");

	}


	@Test (priority=29)
	public void verify_authorized_access_page_dataexport() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page displays Data Export button is running-------------------------");
		readFile(configProperties.getProperty("verify.bdc.authorizedaccess.dataexport"));
		testPlan.verifyAuthorizedAccessPageDataExport(reporter);
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page displays Data Export button is completed-------------------------");

	}


	@Test (priority=30)
	public void verify_authorized_access_page() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page loads is running-------------------------");
		readFile(configProperties.getProperty("verify.bdc.authorizedaccess.pageload"));
		testPlan.verifyAuthorizedAccessPageload(reporter);
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page loads is completed-------------------------");

	}

	
	
	@Test (priority=31)
	public void verify_authorized_NoExportButton_default() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page doesn't have default Export Button  is running-------------------------");
		readFile(configProperties.getProperty("verify.bdc.authorizedaccess.pageload.noexportbutton"));
		testPlan.verifyAuthorizedAccessdefaultNoExportButton(reporter);
		LOGGER.info(
				"---------------------------------The test case verify  Authorized page doesn't have default Export Button is completed-------------------------");

	}

	@Test (priority=30)
	public void verify_logout() throws Exception {
		LOGGER.info(
				"---------------------------------The test case logout is running-------------------------");
		readFile(configProperties.getProperty("verify.logout.picsure"));
		testPlan.verifyLogoutPicsure(reporter);
		LOGGER.info(
				"---------------------------------The test case logout is completed-------------------------");

	}


	@AfterClass
	public void closeApplication() {

		reporter.doReport();
	//	testPlan.closeDriver();
		System.out.println("BDC PICSUREUI Test Automation Testing is finished...");
		LOGGER.info(
				"===========================BDC PICSUREUI Test Automation is completed :Closing the Browser ===========================");

	}

	@SuppressWarnings("finally")
	private static Testplan initTestPlan(String testType, @SuppressWarnings("rawtypes") Map map) {
		Testplan newInstance = null;
		try {
			Class<?> resourceInterfaceClass = Class.forName(TESTPLANS + testType);

			newInstance = (Testplan) resourceInterfaceClass.newInstance();
			// newInstance.setTestPlan(map);
		} catch (SecurityException | InstantiationException | IllegalAccessException | ClassNotFoundException e) {
			System.out.println(e);
			e.printStackTrace();
			return null;
		} catch (Exception e) {
			System.out.println(e);
			e.printStackTrace();
			return null;
		} finally {

			return newInstance;
		}
	}

	@SuppressWarnings("finally")
	private static Reporter initReporter(String reporterType) {
		Reporter newInstance = null;

		try {
			Class<?> resourceInterfaceClass = Class.forName(REPORTS + reporterType);
			newInstance = (Reporter) resourceInterfaceClass.newInstance();
		} catch (SecurityException | InstantiationException | IllegalAccessException | ClassNotFoundException e) {
			e.printStackTrace();
			return null;
		} finally {
			return newInstance;
		}
	}

}
/*
 * // @Atul public static Testplan testPlan = null; static Reporter reporter =
 * null;
 * 
 * public static void readFile(String fileName) { try { YamlReader reader1 = new
 * YamlReader(new FileReader(fileName));
 * 
 * Map testConfig = (Map) reader1.read(); if (testConfig != null) {
 * 
 * if (testPlan == null) testPlan =
 * initTestPlan(testConfig.get("type").toString(), testConfig);
 * testPlan.setTestPlan(testConfig); if (reporter == null) reporter =
 * initReporter(testConfig.get("reporter").toString()); } } catch
 * (FileNotFoundException e) { e.printStackTrace(); } catch (YamlException e) {
 * e.printStackTrace(); } }
 * 
 */
/**
 * Unit test for simple App.
 */
/*
 * public class TestDriver extends TestCase {
 *//**
	 * Create the test case
	 *
	 * @param testName
	 *            name of the test case
	 */
/*
 * public TestDriver( String testName ) { super( testName ); }
 * 
 *//**
	 * @return the suite of tests being tested
	 */
/*
 * public static Test suite() { return new TestSuite( TestDriver.class ); }
 * 
 *//**
	 * Rigourous Test :-)
	 *//*
	 * public void testApp() { assertTrue( true ); } }
	 */