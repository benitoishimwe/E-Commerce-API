const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');

const productSchema = Joi.object({
  name: Joi.string().max(100).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().max(1000).required(),
  image: Joi.string(),
  category: Joi.string().valid('office', 'kitchen', 'bedroom').required(),
  company: Joi.string().valid('ikea', 'liddy', 'marcos').required(),
  colors: Joi.array().items(Joi.string()).min(1),
  featured: Joi.boolean(),
  freeShipping: Joi.boolean(),
  inventory: Joi.number().min(0),
});

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
      error: {},
    });
  }
  next();
};

module.exports = {
  validateProduct: validate(productSchema),
  validateRegister: validate(registerSchema),
};
