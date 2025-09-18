import { body, validationResult } from "express-validator";

// Check for validation errors
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Password strength validation
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors;
};

// Registration validation
export const validateRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  body('contactNumber')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact number must be between 10 and 15 characters')
    .matches(/^[+]?[\d\s\-().]+$/)
    .withMessage('Contact number can only contain numbers, spaces, hyphens, parentheses, dots, and optional + prefix'),

  body('emailAddress')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((password) => {
      const errors = validatePasswordStrength(password);
      if (errors.length > 0) {
        throw new Error(`${errors.join(', ')}`);
      }
      return true;
    }),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Login validation
export const validateLogin = [
  body('emailAddress')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateSearch = (req, res, next) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({
            error: 'Invalid search query. Must be at least 2 characters.'
        });
    }

    next();
};
