import { verifyUser } from '../lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const user = await verifyUser(req);
        // Remove db object if it was returned
        const { db, ...cleanUser } = user;
        res.status(200).json(cleanUser);
    } catch (error) {
        console.error('Session API Error:', error);
        res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
}
