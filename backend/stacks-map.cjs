'use strict';

module.exports = (resource, logicalId) => {
  if (logicalId === 'ApiGatewayAuthorizer') {
    return { destination: 'ApiAuthorizer', force: true };
  }
  return undefined;
};
