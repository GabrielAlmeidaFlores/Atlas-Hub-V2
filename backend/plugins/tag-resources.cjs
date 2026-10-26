'use strict';

const TAGGABLE = new Set([
  'AWS::Lambda::Function',
  'AWS::DynamoDB::Table',
  'AWS::S3::Bucket',
  'AWS::Cognito::UserPool',
  'AWS::KMS::Key',
  'AWS::IAM::Role',
  'AWS::IAM::Policy',
  'AWS::ApiGateway::RestApi',
  'AWS::ApiGateway::Stage',
  'AWS::Logs::LogGroup',
  'AWS::Events::Rule',
  'AWS::SecretsManager::Secret',
  'AWS::SNS::Topic',
  'AWS::SQS::Queue',
  'AWS::CloudWatch::Alarm',
]);

function mergeTags(existing, tags) {
  const map = new Map();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (item !== null && typeof item === 'object' && typeof item.Key === 'string') {
        map.set(item.Key, item.Value);
      }
    }
  }
  for (const [Key, Value] of Object.entries(tags)) {
    if (Value !== undefined && Value !== '') map.set(Key, Value);
  }
  return [...map.entries()].map(([Key, Value]) => ({ Key, Value }));
}

class TagResourcesPlugin {
  constructor(serverless) {
    this.serverless = serverless;
    this.hooks = {
      'after:aws:package:finalize:mergeCustomProviderResources': () => this.applyTags(),
    };
  }

  componentFor(type, logicalId, fallback) {
    if (type === 'AWS::DynamoDB::Table') return 'database';
    if (type === 'AWS::Cognito::UserPool') return 'auth';
    if (type === 'AWS::KMS::Key') return 'auth';
    if (type === 'AWS::IAM::Role' || type === 'AWS::IAM::Policy') return 'infra';
    if (type === 'AWS::ApiGateway::RestApi' || type === 'AWS::ApiGateway::Stage') return 'backend';
    if (type === 'AWS::S3::Bucket') {
      return logicalId.toLowerCase().includes('documents') ? 'storage' : 'infra';
    }
    return fallback;
  }

  applyTags() {
    const service = this.serverless.service;
    const config = service.custom !== null && typeof service.custom === 'object'
      ? service.custom.tagging
      : undefined;
    if (config === undefined || config === null) return;

    const template = service.provider.compiledCloudFormationTemplate;
    if (template === undefined || template === null || template.Resources === undefined) return;

    const common = {
      Project: config.Project,
      Environment: service.provider.stage,
      Owner: config.Owner,
      ManagedBy: config.ManagedBy,
      CostCenter: config.CostCenter,
      Repository: config.Repository,
      DataClassification: config.DataClassification,
      Criticality: service.provider.stage === 'prod' ? 'high' : 'low',
    };

    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      if (resource === null || typeof resource !== 'object') continue;
      if (!TAGGABLE.has(resource.Type)) continue;
      const component = this.componentFor(resource.Type, logicalId, config.defaultComponent);
      const properties = resource.Properties !== null && typeof resource.Properties === 'object'
        ? resource.Properties
        : {};
      if (resource.Type === 'AWS::Cognito::UserPool') {
        const merged = mergeTags(undefined, { ...common, Component: component });
        properties.UserPoolTags = Object.fromEntries(merged.map(({ Key, Value }) => [Key, Value]));
        delete properties.Tags;
      } else {
        properties.Tags = mergeTags(properties.Tags, { ...common, Component: component });
      }
      resource.Properties = properties;
    }
  }
}

module.exports = TagResourcesPlugin;
