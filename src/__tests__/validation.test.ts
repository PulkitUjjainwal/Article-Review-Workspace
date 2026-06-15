import {
  RequiredFieldValidator,
  PMIDValidator,
  DOIValidator,
  YearValidator,
  ValidationPipeline,
  createArticleValidationPipeline,
} from '../server/services/validation';

describe('RequiredFieldValidator', () => {
  const validator = new RequiredFieldValidator('Test Field');

  test('should reject empty string', () => {
    const result = validator.validate('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Test Field is required');
  });

  test('should reject whitespace-only string', () => {
    const result = validator.validate('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Test Field is required');
  });

  test('should reject null', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Test Field is required');
  });

  test('should reject undefined', () => {
    const result = validator.validate(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Test Field is required');
  });

  test('should accept valid string', () => {
    const result = validator.validate('Valid Value');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should accept non-empty string with spaces', () => {
    const result = validator.validate('  Valid  ');
    expect(result.valid).toBe(true);
  });
});

describe('PMIDValidator', () => {
  const validator = new PMIDValidator();

  test('should accept empty value (optional field)', () => {
    const result = validator.validate('');
    expect(result.valid).toBe(true);
  });

  test('should accept null (optional field)', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(true);
  });

  test('should accept valid 7-digit PMID', () => {
    const result = validator.validate('1234567');
    expect(result.valid).toBe(true);
  });

  test('should accept valid 8-digit PMID', () => {
    const result = validator.validate('12345678');
    expect(result.valid).toBe(true);
  });

  test('should accept valid 9-digit PMID', () => {
    const result = validator.validate('123456789');
    expect(result.valid).toBe(true);
  });

  test('should reject PMID with less than 7 digits', () => {
    const result = validator.validate('123456');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PMID must be 7-9 digits long');
  });

  test('should reject PMID with more than 9 digits', () => {
    const result = validator.validate('1234567890');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PMID must be 7-9 digits long');
  });

  test('should reject PMID with letters', () => {
    const result = validator.validate('abc12345');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PMID must contain only digits');
  });

  test('should reject PMID with special characters', () => {
    const result = validator.validate('1234-567');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('PMID must contain only digits');
  });

  test('should accept numeric value as number', () => {
    const result = validator.validate(12345678);
    expect(result.valid).toBe(true);
  });

  test('should handle PMID with leading/trailing spaces', () => {
    const result = validator.validate('  12345678  ');
    expect(result.valid).toBe(true);
  });
});

describe('DOIValidator', () => {
  const validator = new DOIValidator();

  test('should accept empty value (optional field)', () => {
    const result = validator.validate('');
    expect(result.valid).toBe(true);
  });

  test('should accept null (optional field)', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(true);
  });

  test('should accept valid DOI format', () => {
    const result = validator.validate('10.1234/example.doi');
    expect(result.valid).toBe(true);
  });

  test('should accept DOI with complex suffix', () => {
    const result = validator.validate('10.1234/journal.pone.0123456');
    expect(result.valid).toBe(true);
  });

  test('should accept DOI with long prefix', () => {
    const result = validator.validate('10.123456/test');
    expect(result.valid).toBe(true);
  });

  test('should reject DOI without 10. prefix', () => {
    const result = validator.validate('11.1234/test');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DOI must match format: 10.xxxx/...');
  });

  test('should reject DOI without slash', () => {
    const result = validator.validate('10.1234test');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DOI must match format: 10.xxxx/...');
  });

  test('should reject DOI with short prefix', () => {
    const result = validator.validate('10.123/test');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DOI must match format: 10.xxxx/...');
  });

  test('should reject DOI with whitespace', () => {
    const result = validator.validate('10.1234/test doi');
    expect(result.valid).toBe(false);
  });

  test('should handle DOI with leading/trailing spaces', () => {
    const result = validator.validate('  10.1234/test  ');
    expect(result.valid).toBe(true);
  });
});

describe('YearValidator', () => {
  const validator = new YearValidator();
  const currentYear = new Date().getFullYear();

  test('should accept empty value (optional field)', () => {
    const result = validator.validate('');
    expect(result.valid).toBe(true);
  });

  test('should accept null (optional field)', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(true);
  });

  test('should accept year 1900', () => {
    const result = validator.validate('1900');
    expect(result.valid).toBe(true);
  });

  test('should accept year 2000', () => {
    const result = validator.validate('2000');
    expect(result.valid).toBe(true);
  });

  test('should accept current year', () => {
    const result = validator.validate(currentYear.toString());
    expect(result.valid).toBe(true);
  });

  test('should accept next year (for upcoming publications)', () => {
    const result = validator.validate((currentYear + 1).toString());
    expect(result.valid).toBe(true);
  });

  test('should reject year before 1900', () => {
    const result = validator.validate('1899');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be between 1900 and');
  });

  test('should reject year too far in future', () => {
    const result = validator.validate((currentYear + 2).toString());
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be between 1900 and');
  });

  test('should reject non-numeric year', () => {
    const result = validator.validate('abcd');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Publication year must be a 4-digit number');
  });

  test('should reject 2-digit year', () => {
    const result = validator.validate('20');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Publication year must be a 4-digit number');
  });

  test('should reject 3-digit year', () => {
    const result = validator.validate('200');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Publication year must be a 4-digit number');
  });

  test('should reject 5-digit year', () => {
    const result = validator.validate('20000');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Publication year must be a 4-digit number');
  });

  test('should accept numeric value as number', () => {
    const result = validator.validate(2020);
    expect(result.valid).toBe(true);
  });

  test('should handle year with leading/trailing spaces', () => {
    const result = validator.validate('  2020  ');
    expect(result.valid).toBe(true);
  });
});

describe('ValidationPipeline', () => {
  test('should validate multiple fields', () => {
    const pipeline = new ValidationPipeline();
    pipeline.addValidator('title', new RequiredFieldValidator('Title'));
    pipeline.addValidator('pmid', new PMIDValidator());

    const data = { title: 'Valid Title', pmid: '12345678' };
    const errors = pipeline.validate(data, 1);

    expect(errors).toHaveLength(0);
  });

  test('should collect errors from multiple fields', () => {
    const pipeline = new ValidationPipeline();
    pipeline.addValidator('title', new RequiredFieldValidator('Title'));
    pipeline.addValidator('pmid', new PMIDValidator());

    const data = { title: '', pmid: 'abc' };
    const errors = pipeline.validate(data, 1);

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({
      row: 1,
      field: 'title',
      error: 'Title is required',
    });
    expect(errors[1]).toMatchObject({
      row: 1,
      field: 'pmid',
      error: 'PMID must contain only digits',
    });
  });

  test('should stop at first error per field', () => {
    const pipeline = new ValidationPipeline();
    pipeline.addValidator('title', new RequiredFieldValidator('Title'));
    pipeline.addValidator('title', new RequiredFieldValidator('Title Again'));

    const data = { title: '' };
    const errors = pipeline.validate(data, 1);

    // Should only get one error, not two
    expect(errors).toHaveLength(1);
  });

  test('should track row numbers correctly', () => {
    const pipeline = new ValidationPipeline();
    pipeline.addValidator('title', new RequiredFieldValidator('Title'));

    const errors = pipeline.validate({ title: '' }, 42);

    expect(errors[0]?.row).toBe(42);
  });
});

describe('createArticleValidationPipeline', () => {
  const pipeline = createArticleValidationPipeline();

  test('should validate complete valid article', () => {
    const data = {
      title: 'Research Article Title',
      pmid: '12345678',
      doi: '10.1234/journal.2020.001',
      publicationYear: '2020',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors).toHaveLength(0);
  });

  test('should reject article without title', () => {
    const data = {
      title: '',
      pmid: '12345678',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.field).toBe('title');
  });

  test('should validate article with only required fields', () => {
    const data = {
      title: 'Minimal Article',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors).toHaveLength(0);
  });

  test('should reject article with invalid PMID', () => {
    const data = {
      title: 'Valid Title',
      pmid: 'invalid',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.field === 'pmid')).toBeDefined();
  });

  test('should reject article with invalid DOI', () => {
    const data = {
      title: 'Valid Title',
      doi: 'invalid-doi',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.field === 'doi')).toBeDefined();
  });

  test('should reject article with invalid year', () => {
    const data = {
      title: 'Valid Title',
      publicationYear: '1899',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.field === 'publicationYear')).toBeDefined();
  });

  test('should collect multiple validation errors', () => {
    const data = {
      title: '',
      pmid: 'abc',
      doi: 'bad-doi',
      publicationYear: '99',
    };

    const errors = pipeline.validate(data, 1);
    expect(errors.length).toBe(4);
  });
});
