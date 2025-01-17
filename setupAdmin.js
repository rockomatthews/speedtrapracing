const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./functions/serviceAccount.json'); // You'll need your service account JSON

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const setupAdmin = async () => {
    try {
        // Create the user in Firebase Auth
        const userRecord = await getAuth().createUser({
            email: 'andrew@speedtrapracing.com',
            password: 'TrentStone69!',
            emailVerified: true
        }).catch(error => {
            if (error.code === 'auth/email-already-exists') {
                return getAuth().getUserByEmail('andrew@speedtrapracing.com');
            }
            throw error;
        });

        // Set up admin document in Firestore
        await admin.firestore().collection('Users').doc(userRecord.uid).set({
            email: 'andrew@speedtrapracing.com',
            isAdmin: true,
            role: 'admin',
            createdAt: new Date().toISOString(),
            displayName: 'Andrew Admin',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('Admin user created/updated successfully:', userRecord.uid);

        // Clean up other admin users
        const usersSnapshot = await admin.firestore().collection('Users')
            .where('isAdmin', '==', true)
            .get();

        for (const doc of usersSnapshot.docs) {
            if (doc.id !== userRecord.uid) {
                await admin.firestore().collection('Users').doc(doc.id).update({
                    isAdmin: false,
                    role: 'user'
                });
                console.log('Removed admin privileges from:', doc.id);
            }
        }

        console.log('Admin setup complete!');
    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        process.exit();
    }
};

setupAdmin();