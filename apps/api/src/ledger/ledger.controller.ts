import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard, type AuthenticatedUser } from '../auth/oidc.guard';
import {
  LedgerService,
  type CreateTransactionInput,
  type TransferInput,
} from './ledger.service';

type AuthenticatedRequest = { user?: AuthenticatedUser };

@Controller('api/v1')
@UseGuards(OidcGuard)
export class LedgerController {
  constructor(@Inject(LedgerService) private readonly ledger: LedgerService) {}

  @Post('transactions')
  create(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') operationKey: string | undefined,
    @Body() body: CreateTransactionInput,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.ledger.create(request.user, operationKey, body);
  }

  @Post('transfers')
  transfer(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') operationKey: string | undefined,
    @Body() body: TransferInput,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.ledger.transfer(request.user, operationKey, body);
  }

  @Get('categories')
  categories(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.ledger.listCategories(request.user);
  }

  @Post('categories')
  createCategory(
    @Req() request: AuthenticatedRequest,
    @Body() body: { name?: string },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.ledger.createCategory(request.user, body.name ?? '');
  }

  @Get('transactions')
  list(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.ledger.list(request.user);
  }

  @Patch('transactions/:id')
  edit(
    @Req() request: AuthenticatedRequest,
    @Param('id') transactionId: string,
    @Headers('if-match-version') version: string | undefined,
    @Body()
    body: {
      note?: string;
      paymentMethod?: CreateTransactionInput['paymentMethod'];
      transactionDate?: string;
    },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    const expectedVersion = Number(version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1)
      throw new Error('If-Match-Version is required');
    return this.ledger.edit(request.user, transactionId, expectedVersion, body);
  }

  @Post('transactions/:id/archive')
  archive(
    @Req() request: AuthenticatedRequest,
    @Param('id') transactionId: string,
    @Headers('if-match-version') version: string | undefined,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    const expectedVersion = Number(version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1)
      throw new Error('If-Match-Version is required');
    return this.ledger.archive(request.user, transactionId, expectedVersion);
  }
}
