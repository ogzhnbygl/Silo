import { verifyUser } from '../lib/auth.js';
import { clearSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
    if (req.method === 'DELETE' || req.method === 'POST') {
        clearSessionCookie(req, res);
        return res.status(200).json({ message: 'Logged out' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const user = await verifyUser(req);
        const { db, ...cleanUser } = user;
        res.status(200).json(cleanUser);
    } catch (error) {
        console.error('Session API Error:', error);
        res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
}
