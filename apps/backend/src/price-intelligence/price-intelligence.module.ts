import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PriceCatalogueAdminController } from './price-catalogue-admin.controller';
import { PriceCatalogueAdminService } from './price-catalogue-admin.service';
import { ResearchDiagnosticsController } from './research/research-diagnostics.controller';
import { ResearchDiagnosticsService } from './research/research-diagnostics.service';
import { PriceCheckerController } from './consumer/price-checker.controller';
import { PriceCheckerCatalogueService } from './consumer/price-checker-catalogue.service';
import { PriceCheckerUsageService } from './consumer/price-checker-usage.service';
import { PriceCheckerResearchService } from './consumer/price-checker-research.service';
import { PriceCheckerReportService } from './consumer/price-checker-report.service';
import { PriceCheckerQuoteService } from './payments/quote.service';
import { PriceCheckerPaymentService } from './payments/payment.service';
import { PriceCheckerFulfilmentService } from './payments/fulfilment.service';
import { PriceCheckerUnitEconomicsService } from './payments/unit-economics.service';
import { PriceCheckerRecoveryService } from './payments/recovery.service';
import { PriceCheckerRefundService } from './payments/refund.service';
import { AdminPricePaymentsService } from './payments/admin-price-payments.service';
import { PaystackProvider, PRICE_CHECKER_PAYMENT_PROVIDER } from './payments/paystack.provider';
import { PriceCheckerPaymentsController } from './payments/price-checker-payments.controller';
import { AdminPricePaymentsController } from './payments/admin-price-payments.controller';
import { PriceIntelligenceOpsController } from './ops/price-intelligence-ops.controller';
import { PriceIntelligenceAuditService } from './ops/audit.service';
import { PriceIntelligenceOverviewService } from './ops/overview.service';
import { ReviewQueueService } from './ops/review-queue.service';
import { ReviewCaseService } from './ops/review-case.service';
import { ManualEntryService } from './ops/manual-entry.service';
import { MerchantSubmissionService } from './ops/merchant-submission.service';
import { MerchantListExtractorService } from './ops/merchant-list-extractor.service';
import { SourceHealthService } from './ops/source-health.service';
import { CatalogueWriteService } from './ops/catalogue-write.service';
import { SearchDemandService } from './ops/search-demand.service';
import { PriceIntelligenceSettingsService } from './ops/settings.service';
import { PriceIntelligenceReviewerService } from './ops/reviewer.service';
import { ReportCorrectionService } from './ops/report-correction.service';
import { ExceptionIntakeService } from './ops/exception-intake.service';
import { InternalObservationService } from './research/internal-observation.service';

@Module({
  imports: [AuthModule],
  controllers: [
    PriceCatalogueAdminController,
    ResearchDiagnosticsController,
    PriceCheckerController,
    PriceCheckerPaymentsController,
    AdminPricePaymentsController,
    PriceIntelligenceOpsController,
  ],
  providers: [
    PriceCatalogueAdminService,
    ResearchDiagnosticsService,
    PriceCheckerCatalogueService,
    PriceCheckerUsageService,
    PriceCheckerResearchService,
    PriceCheckerReportService,
    PriceCheckerQuoteService,
    PriceCheckerPaymentService,
    PriceCheckerFulfilmentService,
    PriceCheckerUnitEconomicsService,
    PriceCheckerRecoveryService,
    PriceCheckerRefundService,
    AdminPricePaymentsService,
    PaystackProvider,
    { provide: PRICE_CHECKER_PAYMENT_PROVIDER, useExisting: PaystackProvider },
    // Stage 8 ops
    PriceIntelligenceAuditService,
    PriceIntelligenceOverviewService,
    ReviewQueueService,
    ReviewCaseService,
    ManualEntryService,
    MerchantSubmissionService,
    MerchantListExtractorService,
    InternalObservationService,
    SourceHealthService,
    CatalogueWriteService,
    SearchDemandService,
    PriceIntelligenceSettingsService,
    PriceIntelligenceReviewerService,
    ReportCorrectionService,
    ExceptionIntakeService,
  ],
  exports: [
    PriceCatalogueAdminService,
    ResearchDiagnosticsService,
    ExceptionIntakeService,
  ],
})
export class PriceIntelligenceModule {}
