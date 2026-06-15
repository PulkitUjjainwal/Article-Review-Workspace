// Utility function tests

describe('String Utilities', () => {
  // Slug generation (from organization creation)
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  describe('generateSlug', () => {
    test('should convert uppercase to lowercase', () => {
      expect(generateSlug('HELLO WORLD')).toBe('hello-world');
    });

    test('should replace spaces with hyphens', () => {
      expect(generateSlug('hello world')).toBe('hello-world');
    });

    test('should remove special characters', () => {
      expect(generateSlug('hello@world!')).toBe('helloworld');
    });

    test('should handle multiple spaces', () => {
      expect(generateSlug('hello    world')).toBe('hello-world');
    });

    test('should handle leading/trailing spaces', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world');
    });

    test('should handle multiple hyphens', () => {
      expect(generateSlug('hello---world')).toBe('hello-world');
    });

    test('should preserve existing hyphens', () => {
      expect(generateSlug('hello-world')).toBe('hello-world');
    });

    test('should handle mixed case and special chars', () => {
      expect(generateSlug('Hello World! 2024')).toBe('hello-world-2024');
    });

    test('should handle underscores', () => {
      expect(generateSlug('hello_world')).toBe('hello_world');
    });

    test('should handle numbers', () => {
      expect(generateSlug('project123')).toBe('project123');
    });
  });
});

describe('Array Utilities', () => {
  // Chunk array for batch processing
  function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  describe('chunk', () => {
    test('should chunk array into specified size', () => {
      const result = chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('should handle empty array', () => {
      const result = chunk([], 2);
      expect(result).toEqual([]);
    });

    test('should handle size larger than array', () => {
      const result = chunk([1, 2, 3], 10);
      expect(result).toEqual([[1, 2, 3]]);
    });

    test('should handle size of 1', () => {
      const result = chunk([1, 2, 3], 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    test('should handle exact division', () => {
      const result = chunk([1, 2, 3, 4], 2);
      expect(result).toEqual([[1, 2], [3, 4]]);
    });
  });

  // Remove duplicates
  function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  describe('unique', () => {
    test('should remove duplicate numbers', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    test('should remove duplicate strings', () => {
      expect(unique(['a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    test('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    test('should handle array with no duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test('should preserve order', () => {
      expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });
  });
});

describe('Date Utilities', () => {
  // Format date for display
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
    });

    test('should handle different months', () => {
      const date = new Date('2024-06-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('June');
    });

    test('should handle year boundaries', () => {
      const date = new Date('2023-12-31');
      const formatted = formatDate(date);
      expect(formatted).toContain('2023');
      expect(formatted).toContain('December');
    });
  });

  // Check if date is in range
  function isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  describe('isDateInRange', () => {
    test('should return true for date within range', () => {
      const date = new Date('2024-06-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    test('should return false for date before range', () => {
      const date = new Date('2023-12-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    test('should return false for date after range', () => {
      const date = new Date('2025-01-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    test('should return true for start date', () => {
      const date = new Date('2024-01-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    test('should return true for end date', () => {
      const date = new Date('2024-12-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });
  });
});

describe('Review Decision Utilities', () => {
  type ReviewDecision = 'PENDING' | 'INCLUDE' | 'EXCLUDE' | 'MAYBE';

  // Get status color
  function getStatusColor(status: ReviewDecision): string {
    const colors: Record<ReviewDecision, string> = {
      PENDING: 'gray',
      INCLUDE: 'green',
      EXCLUDE: 'red',
      MAYBE: 'yellow',
    };
    return colors[status];
  }

  describe('getStatusColor', () => {
    test('should return gray for PENDING', () => {
      expect(getStatusColor('PENDING')).toBe('gray');
    });

    test('should return green for INCLUDE', () => {
      expect(getStatusColor('INCLUDE')).toBe('green');
    });

    test('should return red for EXCLUDE', () => {
      expect(getStatusColor('EXCLUDE')).toBe('red');
    });

    test('should return yellow for MAYBE', () => {
      expect(getStatusColor('MAYBE')).toBe('yellow');
    });
  });

  // Calculate completion percentage
  function calculateCompletion(reviewed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((reviewed / total) * 100);
  }

  describe('calculateCompletion', () => {
    test('should calculate 0% for no reviews', () => {
      expect(calculateCompletion(0, 100)).toBe(0);
    });

    test('should calculate 100% for all reviews', () => {
      expect(calculateCompletion(100, 100)).toBe(100);
    });

    test('should calculate 50% for half reviews', () => {
      expect(calculateCompletion(50, 100)).toBe(50);
    });

    test('should handle 0 total', () => {
      expect(calculateCompletion(0, 0)).toBe(0);
    });

    test('should round to nearest integer', () => {
      expect(calculateCompletion(33, 100)).toBe(33);
      expect(calculateCompletion(67, 100)).toBe(67);
    });

    test('should handle small numbers', () => {
      expect(calculateCompletion(1, 3)).toBe(33);
      expect(calculateCompletion(2, 3)).toBe(67);
    });
  });

  // Count by status
  function countByStatus(
    articles: { reviewDecision: ReviewDecision }[]
  ): Record<ReviewDecision, number> {
    const counts: Record<ReviewDecision, number> = {
      PENDING: 0,
      INCLUDE: 0,
      EXCLUDE: 0,
      MAYBE: 0,
    };

    articles.forEach(article => {
      counts[article.reviewDecision]++;
    });

    return counts;
  }

  describe('countByStatus', () => {
    test('should count articles by status', () => {
      const articles = [
        { reviewDecision: 'PENDING' as ReviewDecision },
        { reviewDecision: 'PENDING' as ReviewDecision },
        { reviewDecision: 'INCLUDE' as ReviewDecision },
        { reviewDecision: 'EXCLUDE' as ReviewDecision },
        { reviewDecision: 'MAYBE' as ReviewDecision },
      ];

      const counts = countByStatus(articles);

      expect(counts.PENDING).toBe(2);
      expect(counts.INCLUDE).toBe(1);
      expect(counts.EXCLUDE).toBe(1);
      expect(counts.MAYBE).toBe(1);
    });

    test('should handle empty array', () => {
      const counts = countByStatus([]);

      expect(counts.PENDING).toBe(0);
      expect(counts.INCLUDE).toBe(0);
      expect(counts.EXCLUDE).toBe(0);
      expect(counts.MAYBE).toBe(0);
    });

    test('should handle single status', () => {
      const articles = [
        { reviewDecision: 'INCLUDE' as ReviewDecision },
        { reviewDecision: 'INCLUDE' as ReviewDecision },
        { reviewDecision: 'INCLUDE' as ReviewDecision },
      ];

      const counts = countByStatus(articles);

      expect(counts.INCLUDE).toBe(3);
      expect(counts.PENDING).toBe(0);
      expect(counts.EXCLUDE).toBe(0);
      expect(counts.MAYBE).toBe(0);
    });
  });
});

describe('Pagination Utilities', () => {
  // Calculate total pages
  function getTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  describe('getTotalPages', () => {
    test('should calculate exact pages', () => {
      expect(getTotalPages(100, 10)).toBe(10);
    });

    test('should round up for partial page', () => {
      expect(getTotalPages(105, 10)).toBe(11);
    });

    test('should handle 0 items', () => {
      expect(getTotalPages(0, 10)).toBe(0);
    });

    test('should handle 1 item', () => {
      expect(getTotalPages(1, 10)).toBe(1);
    });

    test('should handle page size of 1', () => {
      expect(getTotalPages(5, 1)).toBe(5);
    });
  });

  // Get page range
  function getPageRange(page: number, pageSize: number, total: number): { start: number; end: number } {
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, total);
    return { start, end };
  }

  describe('getPageRange', () => {
    test('should calculate first page range', () => {
      const range = getPageRange(0, 10, 100);
      expect(range.start).toBe(1);
      expect(range.end).toBe(10);
    });

    test('should calculate middle page range', () => {
      const range = getPageRange(5, 10, 100);
      expect(range.start).toBe(51);
      expect(range.end).toBe(60);
    });

    test('should calculate last page range', () => {
      const range = getPageRange(9, 10, 100);
      expect(range.start).toBe(91);
      expect(range.end).toBe(100);
    });

    test('should handle partial last page', () => {
      const range = getPageRange(10, 10, 105);
      expect(range.start).toBe(101);
      expect(range.end).toBe(105);
    });
  });
});
