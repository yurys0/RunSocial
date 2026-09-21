import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AvatarUseCase } from '../application/avatar.use-case';

@ApiTags('Профиль')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatar: AvatarUseCase) {}

  @ApiOperation({ summary: 'Файл аватарки; путь совпадает с ключом объекта в хранилище' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @Get(':userId/:fileId')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async get(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const etag = `"${fileId}"`;
    res.setHeader('ETag', etag);
    if (req.get('if-none-match') === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }

    const object = await this.avatar.open(userId, fileId);
    return new StreamableFile(object.body, { type: object.contentType, length: object.contentLength });
  }
}
