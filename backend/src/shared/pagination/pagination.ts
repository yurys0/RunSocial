import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Request, Response } from 'express';

export type Pagination = { limit: number; offset: number };

export const MAX_PAGE_SIZE = 50;

// @Type нужен, потому что из query всё приходит строками
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

// prev/next в заголовке Link; count не считаем — next есть, пока страница полная
export function setPaginationLinks(
  req: Request,
  res: Response,
  page: Pagination,
  returned: number,
): void {
  const prefix = req.get('x-forwarded-prefix') ?? '';
  const path = prefix + req.originalUrl.split('?')[0];

  const link = (offset: number, rel: string) => {
    const query = new URLSearchParams(req.query as Record<string, string>);
    query.set('limit', String(page.limit));
    query.set('offset', String(offset));
    return `<${path}?${query.toString()}>; rel="${rel}"`;
  };

  const links: string[] = [];
  if (page.offset > 0) {
    links.push(link(Math.max(0, page.offset - page.limit), 'prev'));
  }
  if (returned === page.limit) {
    links.push(link(page.offset + page.limit, 'next'));
  }
  if (links.length > 0) {
    res.setHeader('Link', links.join(', '));
  }
}
