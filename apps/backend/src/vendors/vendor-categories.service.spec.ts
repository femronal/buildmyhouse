import { ConflictException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { VendorCategoriesService } from './vendor-categories.service';

describe('VendorCategoriesService', () => {
  it('refuses to delete a category that vendors still use', async () => {
    const prisma = {
      vendorCategory: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cat-paint', name: 'Paint', slug: 'paint' }),
        count: jest.fn().mockResolvedValue(0),
      },
      vendorCategoryLink: { count: jest.fn().mockResolvedValue(3) },
    };
    const service = new VendorCategoriesService(prisma as any);
    await expect(service.remove('cat-paint', 'admin-1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('vendor category migration', () => {
  const sql = readFileSync(
    join(__dirname, '../../prisma/migrations/20260927233000_admin_vendor_categories/migration.sql'),
    'utf8',
  );
  const catalog = readFileSync(join(__dirname, 'vendor-catalog.ts'), 'utf8');
  const slugs = Array.from(catalog.matchAll(/slug: '([^']+)'/g), (match) => match[1]);

  it('seeds every current category slug and fails if a categorized vendor is left unlinked', () => {
    expect(slugs.length).toBeGreaterThan(20);
    for (const slug of slugs) {
      expect(sql).toContain(`'${slug}'`);
    }
    expect(sql).toContain('RAISE EXCEPTION');
    expect(sql).toContain('RAISE NOTICE');
    expect(sql).toContain('pop-ceilings');
  });
});
