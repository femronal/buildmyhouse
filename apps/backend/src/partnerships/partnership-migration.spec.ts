import { readFileSync } from 'fs';
import { join } from 'path';

describe('partnership migration grants', () => {
  const sql = readFileSync(join(__dirname, '../../prisma/migrations/20261124013000_partnership_tracker/migration.sql'), 'utf8');

  function grants() {
    const block = sql.slice(sql.indexOf('INSERT INTO "hr_admin_role_permissions"'));
    return [...block.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => `${match[1]}:${match[2]}`);
  }

  it('gives each role the partnerships permissions from the prompt', () => {
    const pairs = grants();
    expect(pairs).toEqual(expect.arrayContaining([
      'partnership_development_executive:partnerships.view',
      'partnership_development_executive:partnerships.edit',
      'partnerships_admin:partnerships.view',
      'partnerships_admin:partnerships.edit',
      'partnerships_admin:partnerships.manage',
      'auditor_read_only:partnerships.view',
    ]));
    expect(pairs.filter((pair) => pair.startsWith('partnership_development_executive:'))).toEqual([
      'partnership_development_executive:partnerships.view',
      'partnership_development_executive:partnerships.edit',
    ]);
    expect(pairs.filter((pair) => pair.startsWith('auditor_read_only:'))).toEqual(['auditor_read_only:partnerships.view']);
    expect(pairs.some((pair) => pair === 'partnership_development_executive:partnerships.manage')).toBe(false);
  });
});
