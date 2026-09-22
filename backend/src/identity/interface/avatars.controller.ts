import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { ErrorResponseDto } from '../../shared/errors/error-response.dto';
import { AvatarUseCase } from '../application/avatar.use-case';

@ApiTags('Профиль')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatar: AvatarUseCase) {}

  @ApiOperation({ summary: 'Файл аватарки' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiOkResponse({ description: 'Картинка; заголовки Cache-Control и ETag, на If-None-Match — 304' })
  @ApiNotFoundResponse({ description: 'Такой аватарки нет или она заменена', type: ErrorResponseDto })
  @Get(':userId/:fileId')
  async get(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const etag = `"${fileId}"`;

    if (req.get('if-none-match') === etag) {
      this.setCacheHeaders(res, etag);
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }

    const object = await this.avatar.open(userId, fileId);
    this.setCacheHeaders(res, etag);
    return new StreamableFile(object.body, { type: object.contentType, length: object.contentLength });
  }

  private setCacheHeaders(res: Response, etag: string): void {
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}
