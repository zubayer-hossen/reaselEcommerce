import { ApiError } from '../utils/ApiError.js';

// validate(zodSchema, 'body' | 'query' | 'params')
// details = { <topField>: [messages], '<a.b.c>': [messages] }
//   - top-level keys keep older admin forms working (errors.name)
//   - full-path keys let long forms show the message under the exact input (errors['customer.phone'])
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = { ...result.error.flatten().fieldErrors };
    for (const issue of result.error.issues) {
      if (issue.path.length > 1) {
        const key = issue.path.join('.');
        (details[key] ||= []).push(issue.message);
      }
    }
    return next(new ApiError(400, 'Validation failed', details));
  }
  req[source] = result.data;
  next();
};
