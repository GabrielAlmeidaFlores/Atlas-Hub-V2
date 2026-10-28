'use strict';

const REMOVED_LOG_GROUPS = [
  'HealthLogGroup',
  'AdminDashboardMetricasLogGroup',
  'PublicoFinanceiroExtratoLogGroup',
  'AdminHistoricoListarLogGroup',
  'OnLoginLogGroup',
  'OnIncorporadoraSignupLogGroup',
  'ApiAuthorizerLogGroup',
  'AdminApiTokensLogGroup',
  'AdminUsuarioCriarLogGroup',
  'AdminUsuariosListarLogGroup',
  'AdminBoardsLogGroup',
  'PublicoResetSolicitarLogGroup',
];

class StripLogGroupsPlugin {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      'before:aws:package:finalize:mergeCustomProviderResources': () => this.strip(),
    };
  }

  strip() {
    const template = this.serverless.service.provider.compiledCloudFormationTemplate;
    if (template?.Resources === undefined) return;
    for (const logicalId of REMOVED_LOG_GROUPS) {
      delete template.Resources[logicalId];
    }
    for (const resource of Object.values(template.Resources)) {
      if (Array.isArray(resource.DependsOn)) {
        resource.DependsOn = resource.DependsOn.filter((item) => !REMOVED_LOG_GROUPS.includes(item));
        if (resource.DependsOn.length === 0) delete resource.DependsOn;
      } else if (REMOVED_LOG_GROUPS.includes(resource.DependsOn)) {
        delete resource.DependsOn;
      }
    }
  }
}

module.exports = StripLogGroupsPlugin;
