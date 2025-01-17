import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffcc03', // Keep yellow as primary
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#000000',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
    button: {
      textTransform: 'none',
    },
    code: {
      fontFamily: 'var(--font-geist-mono)',
      fontSize: 14,
      lineHeight: 1.7,
      letterSpacing: '-0.01em',
      fontWeight: 600,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      padding: '2px 4px',
      borderRadius: 4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        :root {
          --gray-rgb: 255, 255, 255;
          --gray-alpha-200: rgba(var(--gray-rgb), 0.145);
          --gray-alpha-100: rgba(var(--gray-rgb), 0.06);
          --button-primary-hover: #ffd633;
          --button-secondary-hover: #1a1a1a;
        }
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          background-color: #000000;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          color: #ededed;
        }
        #__next {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        * {
          box-sizing: border-box;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          height: '48px',
          padding: '0 20px',
          fontSize: '16px',
          lineHeight: '20px',
          fontWeight: 500,
          transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          '@media (max-width: 600px)': {
            fontSize: '14px',
            height: '40px',
            padding: '0 16px',
          },
        },
        contained: {
          backgroundColor: '#ffcc03',
          color: '#000000',
          '&:hover': {
            backgroundColor: 'var(--button-primary-hover)',
          },
        },
        outlined: {
          borderColor: '#ffcc03',
          color: '#ffcc03',
          '&:hover': {
            backgroundColor: 'rgba(255, 204, 3, 0.1)',
            borderColor: '#ffcc03',
          },
        },
        text: {
          color: '#ffcc03',
          '&:hover': {
            backgroundColor: 'rgba(255, 204, 3, 0.1)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          '&:hover': {
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#ededed',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ededed',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffffff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffffff',
          },
          '& input': {
            color: '#ededed',
          },
        },
      },
    },
  },
});

export default darkTheme;