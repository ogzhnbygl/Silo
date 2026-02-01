import clientPromise from '../../lib/mongodb.js';

export async function verifyUser(req) {
    const cookieHeader = req.headers.cookie || '';

    // 1. Verify Identity with Apex
    const apexResponse = await fetch('https://wildtype.app/api/auth/me', {
        method: 'GET',
        headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json'
        }
    });

    if (!apexResponse.ok) {
        throw { status: apexResponse.status, message: 'Authentication failed' };
    }

    const userData = await apexResponse.json();
    const userEmail = userData.email;

    // 2. Verify Authorization with Database (Apex_db)
    const client = await clientPromise;
    const db = client.db('Apex_db');
    const user = await db.collection('users').findOne({ email: userEmail });

    if (!user) {
        throw { status: 403, message: 'Kullanıcı veritabanında bulunamadı.' };
    }

    // Check Permissions
    const isAdmin = user.role === 'admin';
    const hasAppAccess = Array.isArray(user.apps) && user.apps.some(app => app.toLowerCase() === 'silo');

    if (!isAdmin && !hasAppAccess) {
        throw { status: 403, message: 'Bu uygulamaya erişim yetkiniz bulunmamaktadır.' };
    }

    return {
        ...userData,
        role: user.role,
        apps: user.apps,
        db // Return db connection if needed, though usually new connection to Silo_db is needed
    };
}
