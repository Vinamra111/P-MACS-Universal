import fs from 'fs';
import path from 'path';

// Get local timestamp in YYYY-MM-DD HH:mm:ss format
function getLocalTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Log user access and activity to access_logs.csv
 *
 * @param empId - Employee ID of the user
 * @param action - Action type (LOGIN, FAILED_LOGIN, BLOCKED_LOGIN, QUERY)
 * @param role - User role (Nurse, Pharmacist, Master)
 * @param details - Additional details about the action
 */
export function logAccess(
  empId: string,
  action: 'LOGIN' | 'FAILED_LOGIN' | 'BLOCKED_LOGIN' | 'QUERY',
  role: string = '',
  details: string = ''
): void {
  try {
    const dataPath = path.join(process.cwd(), '../api/data');
    const accessLogsPath = path.join(dataPath, 'access_logs.csv');

    // Create file with header if it doesn't exist
    if (!fs.existsSync(accessLogsPath)) {
      fs.writeFileSync(accessLogsPath, 'timestamp,emp_id,action,role,details\n');
    }

    const timestamp = getLocalTimestamp();

    // Sanitize details to prevent CSV injection and limit length
    const sanitizedDetails = details
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .replace(/[",]/g, '') // Remove quotes and commas
      .substring(0, 200); // Limit to 200 characters

    const logLine = `${timestamp},${empId},${action},${role},${sanitizedDetails}\n`;
    fs.appendFileSync(accessLogsPath, logLine);
  } catch (error) {
    console.error('Failed to log access:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}
