import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isPassword?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  isPassword = false,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col space-y-1.5 w-full text-left">
      <label htmlFor={inputId} className="text-[13px] font-sans font-medium text-[#272320]">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={currentType}
          className={`w-full px-4 py-3 text-sm font-sans bg-[#EFE6D8]/60 border border-[#D5C6B1] rounded-2xl text-[#191715] placeholder-[#9A8C7A] focus:outline-none focus:border-[#8C7660] focus:ring-1 focus:ring-[#8C7660] transition-colors ${
            isPassword ? 'pr-11' : ''
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 text-[#7A6B5A] hover:text-[#272320] transition-colors p-1"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
