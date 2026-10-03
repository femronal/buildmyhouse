import { ARTISAN_TRADES } from './artisan-taxonomy';

describe('ARTISAN_TRADES', () => {
  it('keeps unique keys and includes cleaning plus fumigation', () => {
    const keys = ARTISAN_TRADES.map((trade) => trade.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('cleaning-upkeep');
    expect(ARTISAN_TRADES).toHaveLength(25);
    const pest = ARTISAN_TRADES.find((trade) => trade.key === 'pest-treatment');
    expect(pest?.services).toContain('Fumigation');
    for (const trade of ARTISAN_TRADES) {
      const services = new Set(trade.services);
      for (const problem of trade.problems) {
        for (const service of problem.services) {
          expect(services.has(service)).toBe(true);
        }
      }
    }
  });
});
