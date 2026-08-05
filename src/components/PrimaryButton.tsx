import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'cream' | 'dark' | 'outline' | 'accent';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'dark',
  fullWidth = true,
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-sans font-medium rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    cream: "bg-[#F5EBE0] text-[#191715] hover:bg-[#F1E2CB] shadow-sm",
    accent: "bg-[#D9B98D] text-[#191715] hover:bg-[#E5C590] shadow-sm",
    dark: "bg-[#191715] text-[#F1E2CB] hover:bg-[#272320] border border-[#332E2A]",
    outline: "bg-transparent text-[#F1E2CB] border border-[#514940] hover:bg-[#272320]",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-xs gap-1.5 min-h-[36px]",
    md: "px-5 py-3 text-sm gap-2 min-h-[46px]",
    lg: "px-6 py-3.5 text-base gap-2 min-h-[52px]",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
};
