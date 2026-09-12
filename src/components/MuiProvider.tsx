'use client';

import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6d8196',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4a4a4a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#4a4a4a',
      secondary: '#6d8196',
    },
  },
  typography: {
    fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    fontSize: 12,
  },
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          border: '1px solid #cbcbcb',
          boxShadow: '0 1px 3px rgba(74, 74, 74, 0.06)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#6d8196',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '10.5px',
          textTransform: 'uppercase',
          padding: '6px 10px',
        },
        body: {
          padding: '6px 10px',
          fontSize: '11.5px',
          color: '#4a4a4a',
        },
      },
    },
  },
});

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
