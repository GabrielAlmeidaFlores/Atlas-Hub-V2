'use strict';

const AUTHORIZER_LOGICAL_IDS = new Set([
  'ApiAuthorizerLambdaFunction',
  'ApiAuthorizerLambdaRole',
  'ApiAuthorizerLogGroup',
  'ApiAuthorizerLambdaPermission',
  'ApiGatewayAuthorizer',
]);

module.exports = (resource, logicalId) => {
  if (AUTHORIZER_LOGICAL_IDS.has(logicalId)) return false;
  return undefined;
};
