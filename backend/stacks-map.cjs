'use strict';

module.exports = (resource, logicalId) => {
  if (logicalId === 'ApiGatewayAuthorizer') {
    return { destination: 'ApiAuthorizer', force: true };
  }
  if (logicalId === 'ApiGatewayLogGroup' || logicalId === 'CustomApiGatewayAccountCloudWatchRole') {
    return { destination: 'ApiGatewayLogs', force: true };
  }
  return undefined;
};
