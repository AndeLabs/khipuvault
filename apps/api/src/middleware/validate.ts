import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

/**
 * Zod validation middleware that validates and transforms request data
 * Applies Zod transformations (.default(), .transform()) back to the request
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Apply transformed values back to request
      if (validated.body !== undefined) {
        req.body = validated.body;
      }
      if (validated.query !== undefined) {
        req.query = validated.query;
      }
      if (validated.params !== undefined) {
        req.params = validated.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
