// Form validation utilities
const validation = {
  // Required field validation
  required: (value) => {
    if (!value || value.trim() === "") {
      return "هذا الحقل مطلوب";
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "البريد الإلكتروني غير صالح";
    }
    return null;
  },

  // Number validation
  number: (value) => {
    if (!value) return null;
    if (isNaN(value) || value < 0) {
      return "يجب أن يكون رقماً موجباً";
    }
    return null;
  },

  // Date validation
  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "التاريخ غير صالح";
    }
    return null;
  },

  // Min length validation
  minLength: (value, min) => {
    if (!value) return null;
    if (value.length < min) {
      return `يجب أن يحتوي على الأقل ${min} أحرف`;
    }
    return null;
  },

  // Max length validation
  maxLength: (value, max) => {
    if (!value) return null;
    if (value.length > max) {
      return `يجب أن لا يتجاوز ${max} حرف`;
    }
    return null;
  },

  // Validate form fields
  validateForm: (fields, values) => {
    const errors = {};
    Object.keys(fields).forEach((field) => {
      const fieldRules = fields[field];
      const value = values[field];

      if (fieldRules.required && !value) {
        errors[field] = "هذا الحقل مطلوب";
      } else if (value) {
        if (fieldRules.email) {
          const emailError = validation.email(value);
          if (emailError) errors[field] = emailError;
        }
        if (fieldRules.number) {
          const numberError = validation.number(value);
          if (numberError) errors[field] = numberError;
        }
        if (fieldRules.date) {
          const dateError = validation.date(value);
          if (dateError) errors[field] = dateError;
        }
        if (fieldRules.minLength) {
          const minLengthError = validation.minLength(
            value,
            fieldRules.minLength
          );
          if (minLengthError) errors[field] = minLengthError;
        }
        if (fieldRules.maxLength) {
          const maxLengthError = validation.maxLength(
            value,
            fieldRules.maxLength
          );
          if (maxLengthError) errors[field] = maxLengthError;
        }
      }
    });
    return errors;
  },
};

export default validation;
