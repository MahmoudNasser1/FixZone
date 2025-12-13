const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authMiddleware = (req, res, next) => {
    // Allow public print requests with phone verification
    if (req.path && req.path.includes('/print') && req.query.public === 'true' && req.query.phoneNumber && req.query.repairRequestId) {
        // Phone verification will be handled in the route handler
        return next();
    }
    
    // Try multiple sources for the token: Cookie, Authorization Bearer, x-auth-token
    let token = null;

    // 1) httpOnly cookie set by backend on login
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // 2) Authorization: Bearer <token>
    if (!token && req.headers && typeof req.headers.authorization === 'string') {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            token = parts[1];
        }
    }

    // 3) x-auth-token header (legacy)
    if (!token && req.header('x-auth-token')) {
        token = req.header('x-auth-token');
    }

    if (!token) {
        console.warn('⚠️ [AUTH] No token found in request');
        console.warn('⚠️ [AUTH] URL:', req.originalUrl);
        console.warn('⚠️ [AUTH] Method:', req.method);
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        // #region agent log
        const fs = require('fs');
        const logPath = '/opt/lampp/htdocs/FixZone/.cursor/debug.log';
        try {
          fs.appendFileSync(logPath, JSON.stringify({location:'authMiddleware.js:42',message:'Token verified',data:{userId:decoded?.id,roleId:decoded?.roleId,role:decoded?.role,decodedKeys:Object.keys(decoded||{}),url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
        } catch(e){}
        // #endregion
        // console.log('✅ [AUTH] Token verified successfully for user:', { id: decoded.id, role: decoded.role });
        next();
    } catch (error) {
        console.error('❌ [AUTH] Token verification failed:', error.message);
        console.error('❌ [AUTH] URL:', req.originalUrl);
        console.error('❌ [AUTH] Method:', req.method);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
