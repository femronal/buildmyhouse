import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminProfessionalWriteDto } from './professionals.dto';

async function parse(body: object) {
  const dto = plainToInstance(AdminProfessionalWriteDto, body);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('AdminProfessionalWriteDto', () => {
  it('turns a blank email into null', async () => {
    const { dto, errors } = await parse({ email: '' });
    expect(errors).toHaveLength(0);
    expect(dto.email).toBeNull();
  });

  it('turns a whitespace email into null', async () => {
    const { dto, errors } = await parse({ email: '   ' });
    expect(errors).toHaveLength(0);
    expect(dto.email).toBeNull();
  });

  it('rejects an address that is not an email', async () => {
    const { errors } = await parse({ email: 'not-an-email' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('keeps a phone number', async () => {
    const { dto, errors } = await parse({ phone: '08030000000' });
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe('08030000000');
  });
});
