import { verifyAuth } from '../../lib/auth.js';

export async function verifyUser(req) {
    const user = await verifyAuth(req, 'silo');
    if (!user) {
        throw { status: 401, message: 'Authentication failed' };
    }
    return {
        ...user,
        name: user.name || user.email.split('@')[0]
    };
}
