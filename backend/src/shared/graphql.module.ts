import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';

import { QueryComplexityPlugin } from './graphql/query-complexity.plugin';

/** Code-first: схема генерируется из декораторов. Нужен только API-процессу. */
@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      // res нужен guard'у SuperTokens: он обновляет куки сессии прямо в ответе
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
  ],
  providers: [QueryComplexityPlugin],
})
export class GraphqlModule {}
