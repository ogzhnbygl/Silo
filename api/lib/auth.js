import { verifyAuthWithStatus } from '../../lib/auth.js';

export async function verifyUser(req) {
    const { user, status, error } = await verifyAuthWithStatus(req, 'silo');
    if (!user) {
        throw { status: status || 401, message: error || 'Authentication failed' };
    }
    return {
        ...user,
        name: user.name || user.email.split('@')[0]
    };
}
