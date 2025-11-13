const authorizeMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated (authMiddleware should run before this)
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        console.log('User object in authorizeMiddleware:', req.user);
        console.log('User role in authorizeMiddleware:', req.user.role);

        // Check if the user's role is included in the allowedRoles
        // Support both 'role' and 'roleId' properties
        const userRole = req.user.role || req.user.roleId;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        // If authorized, proceed to the next middleware/route handler
        next();
    };
};

module.exports = authorizeMiddleware;
