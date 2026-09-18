import { randomUUID } from 'node:crypto';

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRESIGNED_URL_TTL_SECONDS = 300;

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  /** Для presigned-ссылок нужен публичный адрес: хост входит в подпись и подменить его нельзя. */
  private readonly presignClient: S3Client;
  private readonly bucket: string;
  private readonly publicOrigin: string;
  private readonly publicPathPrefix: string;

  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>('S3_ENDPOINT');
    this.bucket = config.getOrThrow<string>('S3_BUCKET');

    // S3_PUBLIC_URL может содержать путь (/s3 у своего MinIO) — origin и префикс нужны врозь
    const publicUrl = new URL(config.get<string>('S3_PUBLIC_URL') ?? endpoint);
    this.publicOrigin = publicUrl.origin;
    this.publicPathPrefix = publicUrl.pathname.replace(/\/+$/, '');

    const common = {
      region: config.get<string>('S3_REGION') ?? 'us-east-1',
      // MinIO и большинство S3-совместимых провайдеров работают в path-style
      forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') !== 'false',
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      },
    };

    this.client = new S3Client({ ...common, endpoint });
    this.presignClient = new S3Client({ ...common, endpoint: this.publicOrigin });
  }

  /** Дописывает префикс в готовую ссылку: подписан путь без него — ровно тот, что дойдёт до хранилища. */
  private withPathPrefix(url: string): string {
    if (!this.publicPathPrefix) {
      return url;
    }
    return this.publicOrigin + this.publicPathPrefix + url.slice(this.publicOrigin.length);
  }

  /** Размер входит в подпись, иначе по ссылке можно залить файл любого объёма. */
  async createAvatarUploadUrl(userId: string, contentType: string, contentLength: number) {
    const key = `avatars/${userId}/${randomUUID()}`;
    const uploadUrl = await getSignedUrl(
      this.presignClient,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      { expiresIn: PRESIGNED_URL_TTL_SECONDS },
    );
    return { uploadUrl: this.withPathPrefix(uploadUrl), key, publicUrl: this.publicUrl(key) };
  }

  async headObject(key: string): Promise<{ contentType?: string; contentLength?: number } | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { contentType: result.ContentType, contentLength: result.ContentLength };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicOrigin}${this.publicPathPrefix}/${this.bucket}/${key}`;
  }
}
