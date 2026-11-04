import { Controller, Get, Module, Req, UseGuards } from '@nestjs/common';
import { OidcGuard, type AuthenticatedUser } from './auth/oidc.guard';
import { createDatabase } from '@expense-tracker/db';
import { IdentityController as AccountController } from './identity/identity.controller';
import { IdentityService } from './identity/identity.service';
import { LedgerController } from './ledger/ledger.controller';
import { LedgerService } from './ledger/ledger.service';
import { RefundRecurringController } from './ledger/refund-recurring.controller';
import { RefundRecurringService } from './ledger/refund-recurring.service';
import { BudgetController } from './budgets/budget.controller';
import { BudgetService } from './budgets/budget.service';
import { AttachmentController } from './attachments/attachment.controller';
import { AttachmentService } from './attachments/attachment.service';
import {
  LocalPrivateAttachmentStore,
  S3PrivateAttachmentStore,
} from './attachments/attachment.store';
import {
  ClamAvScanner,
  type AttachmentScanner,
} from './attachments/clamav.scanner';

@Controller('api/v1/health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'expense-tracker-api', version: 'v1' };
  }
}

@Controller('api/v1/me')
export class IdentityController {
  @Get()
  @UseGuards(OidcGuard)
  me(@Req() request: { user?: AuthenticatedUser }) {
    const user = request.user;
    if (!user) throw new Error('Authenticated user context is missing');
    return {
      subject: user.subject,
      ...(user.email ? { email: user.email } : {}),
    };
  }
}

@Module({
  controllers: [
    HealthController,
    IdentityController,
    AccountController,
    LedgerController,
    RefundRecurringController,
    BudgetController,
    AttachmentController,
  ],
  providers: [
    IdentityService,
    LedgerService,
    RefundRecurringService,
    BudgetService,
    AttachmentService,
    ClamAvScanner,
    LocalPrivateAttachmentStore,
    S3PrivateAttachmentStore,
    {
      provide: 'ATTACHMENT_STORE',
      useFactory: () => {
        const driver = process.env.ATTACHMENT_STORAGE_DRIVER ?? 's3';
        if (driver === 'local') return new LocalPrivateAttachmentStore();
        if (driver === 's3') return new S3PrivateAttachmentStore();
        throw new Error(`Unsupported attachment storage driver: ${driver}`);
      },
    },
    {
      provide: 'ATTACHMENT_SCANNER',
      useFactory: (): AttachmentScanner => {
        const driver = process.env.ATTACHMENT_SCANNER_DRIVER ?? 'clamav';
        if (driver === 'clamav') return new ClamAvScanner();
        if (driver === 'test' && process.env.NODE_ENV === 'test')
          return {
            scan: async (bytes) =>
              bytes.includes(Buffer.from('EICAR')) ? 'infected' : 'clean',
          };
        throw new Error(`Unsupported attachment scanner driver: ${driver}`);
      },
    },
    {
      provide: 'DB',
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        return connectionString ? createDatabase(connectionString).db : null;
      },
    },
  ],
})
export class AppModule {}
