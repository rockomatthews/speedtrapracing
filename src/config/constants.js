export const FIREBASE_FUNCTIONS_URL = process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net'
    : 'http://localhost:3000';