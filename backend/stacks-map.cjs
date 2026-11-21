'use strict';

module.exports = (resource, logicalId) => {
  if (logicalId === 'ApiGatewayAuthorizer') {
    return { destination: 'ApiAuthorizer', force: true };
  }
  if (logicalId === 'PublicoProjetosListarLogGroup' || logicalId === 'PublicoProjetoDetalheLogGroup') {
    return { destination: 'MiscLogs', force: true };
  }
  return undefined;
};
