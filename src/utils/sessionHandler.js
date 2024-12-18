// src/utils/sessionHandler.js
export const setSession = (sessionData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('adminSession', JSON.stringify({
            token: sessionData.sessionCookie,
            user: {
                uid: sessionData.uid,
                email: sessionData.email,
                isAdmin: true
            },
            expiresAt: Date.now() + (5 * 24 * 60 * 60 * 1000) // 5 days
        }));
    }
};

export const getSession = () => {
    if (typeof window !== 'undefined') {
        try {
            const session = localStorage.getItem('adminSession');
            if (session) {
                const parsedSession = JSON.parse(session);
                if (parsedSession.expiresAt > Date.now()) {
                    return parsedSession;
                }
                localStorage.removeItem('adminSession');
            }
        } catch (error) {
            console.error('Error reading session:', error);
            localStorage.removeItem('adminSession');
        }
    }
    return null;
};

export const clearSession = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('adminSession');
    }
};