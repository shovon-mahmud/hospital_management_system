// Verification code utilities

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get expiry time for verification code (default 15 minutes from now)
 * @param {number} minutes - Minutes until expiry
 * @returns {Date} Expiry timestamp
 */
export const getCodeExpiry = (minutes = 15) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if verification code is valid (matches and not expired)
 * @param {string} inputCode - Code provided by user
 * @param {string} storedCode - Code stored in database
 * @param {Date} expiry - Code expiry timestamp
 * @returns {boolean} True if valid
 */
export const isCodeValid = (inputCode, storedCode, expiry) => {
  if (!inputCode || !storedCode) return false;
  if (inputCode !== storedCode) return false;
  if (!expiry || new Date() > new Date(expiry)) return false;
  return true;
};
