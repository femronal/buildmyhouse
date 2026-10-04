import { artisanProblemWhere } from './artisan-search';

describe('artisan problem search', () => {
  it('matches a tagged problem and an untagged listing in the trade that owns it', () => {
    expect(artisanProblemWhere('water-pump-not-working')).toEqual({
      OR: [
        {
          capabilities: {
            some: { capability: { kind: 'problem', key: 'water-pump-not-working', isActive: true } },
          },
        },
        {
          AND: [
            { capabilities: { none: { capability: { kind: 'problem', isActive: true } } } },
            {
              primaryTrade: {
                capabilities: { some: { kind: 'problem', key: 'water-pump-not-working', isActive: true } },
              },
            },
          ],
        },
      ],
    });
  });
});
