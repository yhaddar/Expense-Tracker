import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard, type AuthenticatedUser } from '../auth/oidc.guard';
import { AttachmentService } from './attachment.service';

type AuthenticatedRequest = { user?: AuthenticatedUser };

@Controller('api/v1')
@UseGuards(OidcGuard)
export class AttachmentController {
  constructor(
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
  ) {}

  @Post('transactions/:transactionId/attachments')
  upload(
    @Req() request: AuthenticatedRequest,
    @Param('transactionId') transactionId: string,
    @Body() body: { filename: string; contentBase64: string },
    @Headers('idempotency-key') operationKey: string | undefined,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    return this.attachments.upload(
      request.user,
      transactionId,
      body,
      operationKey,
    );
  }

  @Get('attachments/:attachmentId/download')
  async download(
    @Req() request: AuthenticatedRequest,
    @Param('attachmentId') attachmentId: string,
  ) {
    if (!request.user) throw new Error('Authenticated user context is missing');
    const result = await this.attachments.download(request.user, attachmentId);
    return new StreamableFile(result.bytes, {
      type: result.contentType,
      disposition: `attachment; filename="${result.filename.replace(/"/g, '')}"`,
    });
  }
}
