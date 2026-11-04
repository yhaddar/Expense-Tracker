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
import { IdentityService } from './identity.service';

type AuthenticatedRequest = { user?: AuthenticatedUser };

@Controller('api/v1')
@UseGuards(OidcGuard)
export class IdentityController {
  constructor(
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Post('account')
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: { openingBalanceMinor?: string },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.createAccount(
      request.user,
      body.openingBalanceMinor ?? '0',
    );
  }

  @Get('account')
  get(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.getAccount(request.user);
  }

  @Get('account/balance')
  balance(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.getBalance(request.user);
  }

  @Get('wallet/members')
  members(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.listMembers(request.user);
  }

  @Get('wallet/roles')
  roles(@Req() request: AuthenticatedRequest) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.listRoles(request.user);
  }

  @Post('wallet/roles')
  createRole(
    @Req() request: AuthenticatedRequest,
    @Body() body: { name: string; permissions: unknown },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.createRole(request.user, body);
  }

  @Patch('wallet/members/:memberId/role')
  assignRole(
    @Req() request: AuthenticatedRequest,
    @Param('memberId') memberId: string,
    @Body() body: { roleId: string },
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.assignRole(request.user, memberId, body.roleId);
  }

  @Post('wallet/members/:memberId/revoke')
  revokeMember(
    @Req() request: AuthenticatedRequest,
    @Param('memberId') memberId: string,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.identity.revokeMember(request.user, memberId);
  }
}
