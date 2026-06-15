import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-lg border-2 border-gray-300
            bg-white px-4 py-3
            text-base font-medium text-gray-900
            placeholder-gray-500
            shadow-sm transition-all duration-200
            hover:border-gray-400
            focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${error ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}
            ${className}
          `}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1.5 text-sm text-gray-600">{helpText}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  rows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helpText, className = "", rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            block w-full rounded-lg border-2 border-gray-300
            bg-white px-4 py-3
            text-base font-medium text-gray-900
            placeholder-gray-500
            shadow-sm transition-all duration-200
            hover:border-gray-400
            focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${error ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}
            ${className}
          `}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1.5 text-sm text-gray-600">{helpText}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, className = "", children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border-2 border-gray-300
            bg-white px-4 py-3
            text-base font-medium text-gray-900
            shadow-sm transition-all duration-200
            hover:border-gray-400
            focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${error ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {helpText && !error && (
          <p className="mt-1.5 text-sm text-gray-600">{helpText}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
