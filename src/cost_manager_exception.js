// cost_manager_exception.js
// Defined to comply with the rule of using project-specific exception objects.

/**
 * Constructor function for custom exceptions in the Cost Manager application.
 * @param {string} message - The error message describing the malfunction.
 */
function CostManagerException(message) {
    this.message = message;
} // End of function

// Export the exception for use in other modules.
export default CostManagerException;