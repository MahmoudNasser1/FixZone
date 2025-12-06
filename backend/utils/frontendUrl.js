/**
 * Get Frontend URL for generating public links (tracking, invoices, etc.)
 * Priority:
 * 1. FRONTEND_URL environment variable
 * 2. REACT_APP_FRONTEND_URL environment variable
 * 3. Request origin (if available from req object)
 * 4. Default production URL (https://fixzzone.com)
 * 5. Fallback to localhost (development only)
 */
function getFrontendUrl(req = null) {
  // Priority 1: FRONTEND_URL env var
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/+$/, '');
  }

  // Priority 2: REACT_APP_FRONTEND_URL env var
  if (process.env.REACT_APP_FRONTEND_URL) {
    return process.env.REACT_APP_FRONTEND_URL.replace(/\/+$/, '');
  }

  // Priority 3: Request origin (if available)
  if (req && req.headers && req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] || 
                     (req.secure ? 'https' : 'http') || 
                     'https';
    const host = req.headers.host;
    return `${protocol}://${host}`.replace(/\/+$/, '');
  }

  // Priority 4: Default production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://fixzzone.com';
  }

  // Priority 5: Fallback to localhost (development only)
  return 'http://localhost:3000';
}

module.exports = { getFrontendUrl };

