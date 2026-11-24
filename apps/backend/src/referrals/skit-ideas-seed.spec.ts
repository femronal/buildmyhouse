import { readFileSync } from 'fs';
import { join } from 'path';

describe('skit idea seed', () => {
  const sql = readFileSync(join(__dirname, '../../prisma/migrations/20261124120000_partner_dashboard_v2/migration.sql'), 'utf8');

  it('seeds the seven ideas once and leaves prices out', () => {
    expect(sql).toContain('ON CONFLICT ("slug") DO NOTHING;');
    for (const slug of ['almost-done', 'angry-voice-note', 'who-will-replace-the-money', 'cement-will-go-up-tomorrow', 'the-gate', 'rate-my-builders-excuse', 'tundes-house-in-ibadan']) {
      expect(sql).toContain(`'${slug}'`);
    }
    expect(sql.match(/gen_random_uuid\(\)::text/g)?.length).toBe(8);
    for (const title of ['"Almost done"', 'The angry voice note', '"Who will replace the money?"', '"Cement will go up tomorrow"', '"The gate"', '"Rate my builder\'s excuse"', '"Tunde\'s house in Ibadan, episode 1 of 5"']) {
      expect(sql).toContain(title);
    }
    expect(sql).not.toContain('6,700');
    expect(sql).not.toContain('13,900');
    expect(sql).not.toContain('Prices are real');
  });
});
