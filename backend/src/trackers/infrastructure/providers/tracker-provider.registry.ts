import { Injectable } from '@nestjs/common';
import { TrackerProviderName } from '@prisma/client';

import { TrackerProvider } from '../../domain/tracker-provider.interface';
import { PacerProvider } from './pacer.provider';
import { RuntasticProvider } from './runtastic.provider';
import { StravaProvider } from './strava.provider';

@Injectable()
export class TrackerProviderRegistry {
  private readonly providers: Map<TrackerProviderName, TrackerProvider>;

  constructor(strava: StravaProvider, runtastic: RuntasticProvider, pacer: PacerProvider) {
    this.providers = new Map<TrackerProviderName, TrackerProvider>(
      [strava, runtastic, pacer].map((provider) => [provider.provider, provider]),
    );
  }

  get(name: TrackerProviderName): TrackerProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Провайдер ${name} не зарегистрирован`);
    }
    return provider;
  }
}
