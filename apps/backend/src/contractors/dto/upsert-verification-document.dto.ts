import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { GC_VERIFICATION_REQUIRED_DOCUMENTS } from '../constants/gc-verification-documents';

const documentTypes = GC_VERIFICATION_REQUIRED_DOCUMENTS.map((doc) => doc.type);

export class UpsertVerificationDocumentDto {
  @IsIn(documentTypes)
  documentType: (typeof documentTypes)[number];

  @IsString()
  @MaxLength(1000)
  fileUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  expiryYear?: string;
}
