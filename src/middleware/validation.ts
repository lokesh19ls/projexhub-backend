import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({ 
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
      return;
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('student', 'developer', 'admin').required(),
    college: Joi.string().max(255).optional(),
    department: Joi.string().max(255).optional(),
    yearOfStudy: Joi.number().integer().min(1).max(10).optional(),
    skills: Joi.array().items(Joi.string()).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createProject: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(20).required(),
    technology: Joi.array().items(Joi.string()).min(1).required(),
    budget: Joi.number().positive().required(),
    deadline: Joi.date().greater('now').required()
  }),

  createProposal: Joi.object({
    price: Joi.number().positive().required(),
    timeline: Joi.number().integer().positive().required(),
    technology: Joi.array().items(Joi.string()).optional(),
    message: Joi.string().max(1000).optional()
  }),

  createPayment: Joi.object({
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet').required(),
    paymentType: Joi.string().valid('advance', 'full', 'milestone').required(),
    milestonePercentage: Joi.number().integer().valid(20, 50, 100).optional()
  }),

  createReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(500).optional()
  }),

  withdraw: Joi.object({
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('bank', 'upi').required(),
    accountDetails: Joi.string().required()
  })
};

