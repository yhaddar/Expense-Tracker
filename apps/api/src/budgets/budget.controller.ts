import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard, type AuthenticatedUser } from '../auth/oidc.guard';
import { BudgetService } from './budget.service';

type AuthenticatedRequest = { user?: AuthenticatedUser };

@Controller('api/v1')
@UseGuards(OidcGuard)
export class BudgetController {
  constructor(@Inject(BudgetService) private readonly budgets: BudgetService) {}

  @Post('budgets')
  create(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      monthStart: string;
      limitMadMinor: string;
      categoryId?: string;
      thresholdPercent?: number;
    },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.budgets.create(request.user, body);
  }

  @Post('budgets/:id/evaluate')
  evaluate(
    @Req() request: AuthenticatedRequest,
    @Param('id') budgetId: string,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.budgets.evaluate(request.user, budgetId);
  }

  @Get('budgets')
  list(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.budgets.list(request.user);
  }

  @Get('notifications')
  notifications(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.budgets.notificationsFor(request.user);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @Req() request: AuthenticatedRequest,
    @Param('id') notificationId: string,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.budgets.markNotificationRead(request.user, notificationId);
  }
}
