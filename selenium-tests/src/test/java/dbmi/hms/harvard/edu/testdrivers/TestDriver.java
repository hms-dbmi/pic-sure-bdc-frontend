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

	@Test (priority=32)
	public void verify_queryscope_study_openaccess() throws Exception {
		LOGGER.info(
				"---------------------------------The test case verify that study should have accessed in open access is running-------------------------");
		readFile(configProperties.getProperty("verify.bdc.queryscope.study.openaccess"));
		testPlan.verifyQueryScopeStudyOpenAccess(reporter);
		LOGGER.info(
				"---------------------------------The test case verify that study should have accessed in open access is running is completed-------------------------");

	}


@Test (priority=33)
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