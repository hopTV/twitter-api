import { checkSchema } from "express-validator";
import { validate } from "~/utils/validation";

export const searchValidator = validate(
    checkSchema({
        content: {
            
        }
    })
)