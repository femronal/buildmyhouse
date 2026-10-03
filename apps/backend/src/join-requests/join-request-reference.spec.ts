import { formatJoinReference } from './join-request-reference';

describe('formatJoinReference', () => {
  it('uses the path letter', () => {
    expect(formatJoinReference('cleaning', 421)).toBe('BMH-JC-0421');
    expect(formatJoinReference('repairs', 7)).toBe('BMH-JR-0007');
  });
});
