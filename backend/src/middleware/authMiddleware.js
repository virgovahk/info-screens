function authMiddleware(socket, next) {
    const { key, role } = socket.handshake.auth;
    
    if (!key || !role) {
        return next(new Error('Missing credentials'));
    }
    
    let correctKey;
    if (role === 'receptionist') correctKey = process.env.RECEPTIONIST_KEY;
    else if (role === 'observer') correctKey = process.env.OBSERVER_KEY;
    else if (role === 'safety') correctKey = process.env.SAFETY_KEY;
    else return next(new Error('Invalid role'));
    
    if (key === correctKey) {
        socket.data.role = role;
        next();
    } else {
        setTimeout(() => {
            console.log('❌ Authentication failed: ', socket.id);
            next(new Error('Invalid access key'));
        }, 500);
    }
};

module.exports = { authMiddleware };