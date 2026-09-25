import { ApolloServerPlugin, BaseContext, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

export const MAX_QUERY_COMPLEXITY = 1000;

@Plugin()
export class QueryComplexityPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(QueryComplexityPlugin.name);

  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const { schema } = this.schemaHost;

    return {
      didResolveOperation: async ({ request, document }) => {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
        });

        if (complexity > MAX_QUERY_COMPLEXITY) {
          throw new GraphQLError(
            `Запрос слишком сложный: ${complexity} при лимите ${MAX_QUERY_COMPLEXITY}`,
            { extensions: { code: 'QUERY_TOO_COMPLEX' } },
          );
        }
        this.logger.debug(`${request.operationName ?? 'без имени'}: сложность ${complexity}`);
      },
    };
  }
}
