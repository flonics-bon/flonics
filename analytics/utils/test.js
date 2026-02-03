/**
 * 4D Flow MRI Test Utility
 * Basic test utilities for 4D Flow MRI data processing
 */

export class TestUtility {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run a test case
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  async runTest(name, testFn) {
    try {
      await testFn();
      this.testResults.push({ name, status: 'PASS' });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      console.error(`✗ ${name}: ${error.message}`);
    }
  }

  /**
   * Get test summary
   */
  getSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) : 0
    };
  }

  /**
   * Reset test results
   */
  reset() {
    this.testResults = [];
  }
}

/**
 * Assert utility functions
 */
export const assert = {
  equal: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}. ${message}`);
    }
  },

  notEqual: (actual, expected, message = '') => {
    if (actual === expected) {
      throw new Error(`Expected not to be ${expected}. ${message}`);
    }
  },

  isTrue: (value, message = '') => {
    if (value !== true) {
      throw new Error(`Expected true but got ${value}. ${message}`);
    }
  },

  isFalse: (value, message = '') => {
    if (value !== false) {
      throw new Error(`Expected false but got ${value}. ${message}`);
    }
  },

  isDefined: (value, message = '') => {
    if (value === undefined || value === null) {
      throw new Error(`Expected value to be defined. ${message}`);
    }
  }
};

export default TestUtility;