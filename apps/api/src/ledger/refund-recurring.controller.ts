import {
  Body,
  Controller,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard, type AuthenticatedUser } from '../auth/oidc.guard';
import { RefundRecurringService } from './refund-recurring.service';

type AuthenticatedRequest = { user?: AuthenticatedUser };

@Controller('api/v1')
@UseGuards(OidcGuard)
export class RefundRecurringController {
  constructor(
    @Inject(RefundRecurringService)
    private readonly service: RefundRecurringService,
  ) {}

  @Post('transactions/:id/refunds')
  refund(
    @Req() request: AuthenticatedRequest,
    @Param('id') originalId: string,
    @Headers('idempotency-key') operationKey: string | undefined,
    @Body()
    body: {
      amountMinor: string;
      amountMadMinor: string;
      transactionDate: string;
      paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment';
      note?: string;
    },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.service.refund(request.user, originalId, body, operationKey);
  }

  @Post('recurring')
  createRecurring(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      transactionType: 'income' | 'expense';
      amountMinor: string;
      currency: string;
      amountMadMinor: string;
      exchangeRate: string;
      paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment';
      transactionDate: string;
      frequency: 'daily' | 'weekly' | 'monthly';
    },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.service.createRecurring(request.user, body);
  }

  @Post('recurring/generate')
  generate(
    @Req() request: AuthenticatedRequest,
    @Body() body: { asOfDate: string },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.service.generate(request.user, body.asOfDate);
  }
}
