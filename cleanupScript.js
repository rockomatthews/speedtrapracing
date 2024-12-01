const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
});

async function cleanupUsers() {
    const db = getFirestore();
    const usersRef = db.collection('Users');
    
    try {
        const snapshot = await usersRef.where('isAdmin', '==', true).get();
        
        console.log(`Found ${snapshot.size} users with admin privileges`);
        
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            if (doc.data().email !== 'speedtrapracing@gmail.com') {
                // Remove admin privileges
                batch.update(doc.ref, {
                    isAdmin: false,
                    role: 'user'
                });
                console.log(`Removing admin from: ${doc.data().email}`);
            }
        });
        
        await batch.commit();
        console.log('Cleanup complete');
    } catch (error) {
        console.error('Error cleaning up users:', error);
    }
}

cleanupUsers().then(() => process.exit());