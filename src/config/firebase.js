import { app, db } from '../lib/firebase-init';
import { getAuth } from 'firebase/auth';

const auth = getAuth(app);

export { db, auth };