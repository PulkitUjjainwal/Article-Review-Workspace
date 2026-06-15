// Validation errors and results
export interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validator interface
export interface Validator {
  validate(value: any): ValidationResult;
}

// Required field validator
export class RequiredFieldValidator implements Validator {
  constructor(private fieldName: string) {}

  validate(value: any): ValidationResult {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return {
        valid: false,
        error: `${this.fieldName} is required`,
      };
    }
    return { valid: true };
  }
}

// PMID validator (7-9 digits)
export class PMIDValidator implements Validator {
  validate(value: any): ValidationResult {
    if (!value || value === "") return { valid: true }; // Optional

    const pmidStr = String(value).trim();

    // Must be numeric
    if (!/^\d+$/.test(pmidStr)) {
      return {
        valid: false,
        error: "PMID must contain only digits",
      };
    }

    // Length check (PubMed IDs are typically 7-9 digits)
    if (pmidStr.length < 7 || pmidStr.length > 9) {
      return {
        valid: false,
        error: "PMID must be 7-9 digits long",
      };
    }

    return { valid: true };
  }
}

// DOI validator
export class DOIValidator implements Validator {
  private doiRegex = /^10\.\d{4,}\/[^\s]+$/;

  validate(value: any): ValidationResult {
    if (!value || value === "") return { valid: true }; // Optional

    const doiStr = String(value).trim();

    if (!this.doiRegex.test(doiStr)) {
      return {
        valid: false,
        error: "DOI must match format: 10.xxxx/...",
      };
    }

    return { valid: true };
  }
}

// Publication year validator
export class YearValidator implements Validator {
  validate(value: any): ValidationResult {
    if (!value || value === "") return { valid: true }; // Optional

    const yearStr = String(value).trim();

    // Must be 4 digits
    if (!/^\d{4}$/.test(yearStr)) {
      return {
        valid: false,
        error: "Publication year must be a 4-digit number",
      };
    }

    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    // Reasonable range: 1900 to current year + 1
    if (year < 1900 || year > currentYear + 1) {
      return {
        valid: false,
        error: `Publication year must be between 1900 and ${currentYear + 1}`,
      };
    }

    return { valid: true };
  }
}

// Validation pipeline
export class ValidationPipeline {
  private validators: Map<string, Validator[]> = new Map();

  addValidator(field: string, validator: Validator) {
    if (!this.validators.has(field)) {
      this.validators.set(field, []);
    }
    this.validators.get(field)!.push(validator);
  }

  validate(data: Record<string, any>, row: number): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, validators] of this.validators.entries()) {
      const value = data[field];

      for (const validator of validators) {
        const result = validator.validate(value);
        if (!result.valid) {
          errors.push({
            row,
            field,
            value,
            error: result.error!,
          });
          break; // Stop at first error for this field
        }
      }
    }

    return errors;
  }
}

// Create validation pipeline for articles
export function createArticleValidationPipeline(): ValidationPipeline {
  const pipeline = new ValidationPipeline();

  // Required fields
  pipeline.addValidator("title", new RequiredFieldValidator("Title"));

  // Format validators
  pipeline.addValidator("pmid", new PMIDValidator());
  pipeline.addValidator("doi", new DOIValidator());
  pipeline.addValidator("publicationYear", new YearValidator());

  return pipeline;
}
