'use client';

import React from 'react';
import { FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface Option {
  value: string;
  label: string;
}

interface MaterialSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function MaterialSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = '',
}: MaterialSelectProps) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <FormControl fullWidth size="small" className={className}>
      {label && (
        <label className="text-[#4a4a4a] font-semibold uppercase text-[10px] block mb-1">
          {label}
        </label>
      )}
      <Select
        value={value || ''}
        onChange={handleChange}
        displayEmpty
        sx={{
          fontSize: '12px',
          color: '#4a4a4a',
          backgroundColor: '#ffffff',
          borderRadius: '5px !important',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbcbcb',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6d8196',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6d8196',
          },
          '& .MuiSelect-select': {
            padding: '6px 10px',
          },
        }}
        MenuProps={{
          slotProps: {
            paper: {
              sx: {
                borderRadius: '5px !important',
                border: '1px solid #cbcbcb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                maxHeight: 250,
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  color: '#4a4a4a',
                  padding: '6px 12px',
                  '&:hover': {
                    backgroundColor: '#ffffe3',
                    color: '#4a4a4a',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#6d8196',
                    color: '#ffffff',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#5b6f84',
                    },
                  },
                },
              },
            },
          },
        }}
      >
        {placeholder && (
          <MenuItem value="">
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
