export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

export const setCookie = (name, value, options = {}) => {
  if (typeof document === 'undefined') return;
  
  const defaultOptions = {
    path: '/',
    maxAge: 432000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  const opts = { ...defaultOptions, ...options };
  const cookieParts = [
    `${name}=${value}`,
    `path=${opts.path}`,
    `max-age=${opts.maxAge}`,
    `SameSite=${opts.sameSite}`,
  ];

  if (opts.secure) cookieParts.push('Secure');
  if (opts.httpOnly) cookieParts.push('HttpOnly');

  document.cookie = cookieParts.join('; ');
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}; 