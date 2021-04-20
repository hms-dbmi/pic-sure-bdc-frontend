package dbmi.hms.harvard.edu.reporter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

public class ConsoleReporter extends Reporter {
	int successes = 0;
	int failures = 0;
	private static final Logger LOGGER = Logger.getLogger(ConsoleReporter.class.getName());
	static final Logger resultLog = Logger.getLogger("reportsLogger");
	
	public void doReport() {
		doDelimitedReportToConsole();
	}

	public void doDelimitedReportToConsole() {
	
		String lineSeparator = System.lineSeparator();
		Map<String, Integer> summaryResults = doCalcResults(getTestResults());
		//Integer TotalExecuted;
		System.out.println("Total Executed:" + Integer.sum(summaryResults.get("successes") , summaryResults.get("failures")));
		resultLog.info(
				"===========================================================Test Result Summary=============================================================");
		resultLog.info("\n");
		resultLog.info("Total Cases Executed:    " + Integer.sum(summaryResults.get("successes") , summaryResults.get("failures")) + "\t\t\t\t" + "Total Passed: " + summaryResults.get("successes") + "\t\t\t\t\t" +"Total Failed: "+ summaryResults.get("failures"));
		resultLog.info("\n");
		resultLog.info("-------------------------------------------------------------Test Results-------------------------------------------------------------");
		resultLog.info("\n");
		for (Map testResult : getTestResults()) {
			String sTestPlanName = testResult.get("name").toString();
			String TestCaseDescription=String.format("%-100s",sTestPlanName);
			//String sTestPlanName = testResult.get("name").toString().format("%80s","0" );
			String sTestPlanResult = testResult.get("TestResult").toString();
			// Object[] args = new Object[] {testResult.get("name").toString() +
			// ":",testResult.get("TestResult").toString()};
			resultLog.info("TestCaseName: " + TestCaseDescription + "\t\t"+ "Test case Result:" + "\t"+ sTestPlanResult);
			
			//resultLog.info((String.format("TestCaseName: %20s", sTestPlanName))+"\t\t"+ "Test case Result:" + "\t"+ sTestPlanResult);
			
			
			resultLog.info("\n");

			// sTestPlanResult);
			// System.out.printf ("%-20s : %-20s\n", sTestPlanName,
			// sTestPlanResult );
		}
	}

	private Map<String, Integer> doCalcResults(List<Map> testResults) {
		Map<String, Integer> results = new HashMap<String, Integer>();

		for (Map testResult : testResults) {
			String result = testResult.get("TestResult").toString();
			Integer totalExecuted;
			switch (result) {
			case "passed":
				successes++;
				break;
			case "failed":
				failures++;
				break;
			}
			
		}

		results.put("successes", successes);
		results.put("failures", failures);
		
		return results;
	}
}
