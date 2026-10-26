#!/usr/bin/env bash
set -euo pipefail

APPLY=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --dry-run) APPLY=0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

ACCOUNT=228228361045
ATLAS_REGION=sa-east-1
PULSE_REGION=us-east-1
KYBER_REGION=us-east-1
SHARED_REGION=us-east-2

run() {
  if [ "$APPLY" -eq 1 ]; then
    "$@"
  else
    printf 'DRY %q' "$1"
    shift
    for a in "$@"; do printf ' %q' "$a"; done
    printf '\n'
  fi
}

tag_chunk() {
  local region="$1"
  local tagmap="$2"
  shift 2
  if [ "$APPLY" -eq 0 ]; then
    run aws resourcegroupstaggingapi tag-resources --region "$region" --resource-arn-list "$@" --tags "$tagmap" --output json
    return
  fi
  local resp failed arn
  local -a retry=()
  resp=$(aws resourcegroupstaggingapi tag-resources --region "$region" --resource-arn-list "$@" --tags "$tagmap" --output json)
  printf '%s\n' "$resp"
  failed=$(printf '%s' "$resp" | jq -r '.FailedResourcesMap // {} | keys[]')
  if [ -n "$failed" ]; then
    sleep 5
    while IFS= read -r arn; do
      [ -n "$arn" ] && retry+=("$arn")
    done <<< "$failed"
    if [ "${#retry[@]}" -gt 0 ]; then
      aws resourcegroupstaggingapi tag-resources --region "$region" --resource-arn-list "${retry[@]}" --tags "$tagmap" --output json
    fi
  fi
  sleep 2
}

tag_batch() {
  local region="$1"
  local tagmap="$2"
  shift 2
  if [ "$#" -eq 0 ]; then
    return
  fi
  local -a batch=()
  local arn
  for arn in "$@"; do
    [ -z "$arn" ] && continue
    batch+=("$arn")
    if [ "${#batch[@]}" -eq 20 ]; then
      tag_chunk "$region" "$tagmap" "${batch[@]}"
      batch=()
    fi
  done
  if [ "${#batch[@]}" -gt 0 ]; then
    tag_chunk "$region" "$tagmap" "${batch[@]}"
  fi
}

ATLAS_PROD_BACKEND="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=backend,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_ANALYTICS="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=analytics,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_DB="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=database,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_AUTH="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=auth,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_INFRA="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=infra,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_STORAGE="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=serverless,CostCenter=atlas,Component=storage,Repository=Atlas-Hub-V2,DataClassification=confidential,Criticality=high"
ATLAS_PROD_FRONTEND="Project=atlas-hub,Environment=prod,Owner=team-atlas,ManagedBy=amplify,CostCenter=atlas,Component=frontend,Repository=Atlas-Hub-V2,DataClassification=internal,Criticality=medium"
ATLAS_DEV_FRONTEND="Project=atlas-hub,Environment=dev,Owner=team-atlas,ManagedBy=amplify,CostCenter=atlas,Component=frontend,Repository=Atlas-Hub-V2,DataClassification=internal,Criticality=medium"
PULSE_APP="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=manual,CostCenter=pulse,Component=app,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
PULSE_WORKER="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=manual,CostCenter=pulse,Component=worker,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
PULSE_STORAGE="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=manual,CostCenter=pulse,Component=storage,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
PULSE_INFRA="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=manual,CostCenter=pulse,Component=infra,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
PULSE_LIGHTSAIL_INSTANCE="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=lightsail-console,CostCenter=pulse,Component=app,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
PULSE_LIGHTSAIL_STATIC="Project=pulse,Environment=prod,Owner=team-pulse,ManagedBy=lightsail-console,CostCenter=pulse,Component=infra,Repository=PULSE-IPS,DataClassification=confidential,Criticality=high"
KYBER="Project=kyber,Environment=prod,Owner=team-kyber,ManagedBy=amplify,CostCenter=kyber,Component=frontend,Repository=none,DataClassification=public,Criticality=low"
SHARED="Project=shared,Environment=shared,Owner=platform,ManagedBy=cdk,CostCenter=shared,Component=infra,Repository=none,DataClassification=internal,Criticality=low"
ATLAS_CI="Project=atlas-hub,Environment=shared,Owner=team-atlas,ManagedBy=manual,CostCenter=atlas,Component=infra,Repository=Atlas-Hub-V2,DataClassification=internal,Criticality=medium"
SHARED_ADMIN="Project=shared,Environment=shared,Owner=platform,ManagedBy=manual,CostCenter=shared,Component=infra,Repository=none,DataClassification=internal,Criticality=medium"

PROD_BACKEND=()
PROD_ANALYTICS=()
PROD_DB=()
PROD_AUTH=()
PROD_INFRA=()
PROD_STORAGE=()
PROD_FRONTEND=()
DEV_FRONTEND=()
PULSE_APP_ARNS=()
PULSE_WORKER_ARNS=()
PULSE_STORAGE_ARNS=()
PULSE_INFRA_ARNS=()
KYBER_ARNS=()
SHARED_ARNS=()
ATLAS_CI_ARNS=()
SHARED_ADMIN_ARNS=()

while IFS= read -r arn; do
  case "$arn" in
    *:function:atlas-hub-backend-prod-*) PROD_BACKEND+=("$arn") ;;
    *:function:atlas-hub-analytics-prod-*) PROD_ANALYTICS+=("$arn") ;;
  esac
done < <(aws lambda list-functions --region "$ATLAS_REGION" --query 'Functions[].FunctionArn' --output text | tr '\t' '\n')

while IFS= read -r name; do
  case "$name" in
    Atlas*-prod) PROD_DB+=("arn:aws:dynamodb:$ATLAS_REGION:$ACCOUNT:table/$name") ;;
  esac
done < <(aws dynamodb list-tables --region "$ATLAS_REGION" --query 'TableNames[]' --output text | tr '\t' '\n')

while IFS= read -r role; do
  case "$role" in
    atlas-*-prod) PROD_INFRA+=("arn:aws:iam::$ACCOUNT:role/$role") ;;
  esac
done < <(aws iam list-roles --query 'Roles[].RoleName' --output text | tr '\t' '\n')

while IFS= read -r bucket; do
  case "$bucket" in
    atlas-hub-documents-prod) PROD_STORAGE+=("arn:aws:s3:::$bucket") ;;
    atlas-hub-backend-prod-serverlessdeploymentbuck*|atlas-hub-analytics-prod-serverlessdeploymentbuck*) PROD_INFRA+=("arn:aws:s3:::$bucket") ;;
    prd-pulse) PULSE_STORAGE_ARNS+=("arn:aws:s3:::$bucket") ;;
  esac
done < <(aws s3api list-buckets --query 'Buckets[].Name' --output text | tr '\t' '\n')

while IFS= read -r lg; do
  case "$lg" in
    /aws/lambda/atlas-hub-backend-prod-*) PROD_BACKEND+=("arn:aws:logs:$ATLAS_REGION:$ACCOUNT:log-group:$lg") ;;
    /aws/lambda/atlas-hub-analytics-prod-*) PROD_ANALYTICS+=("arn:aws:logs:$ATLAS_REGION:$ACCOUNT:log-group:$lg") ;;
  esac
done < <(aws logs describe-log-groups --region "$ATLAS_REGION" --query 'logGroups[].logGroupName' --output text | tr '\t' '\n')

while IFS=$'\t' read -r id name; do
  if [ "$name" = "prod-atlas-hub-backend" ]; then
    PROD_BACKEND+=("arn:aws:apigateway:$ATLAS_REGION::/restapis/$id")
    PROD_BACKEND+=("arn:aws:apigateway:$ATLAS_REGION::/restapis/$id/stages/prod")
  fi
done < <(aws apigateway get-rest-apis --region "$ATLAS_REGION" --query 'items[].[id,name]' --output text)

while IFS=$'\t' read -r id name; do
  if [ "$name" = "atlas-hub-users-prod" ]; then
    PROD_AUTH+=("arn:aws:cognito-idp:$ATLAS_REGION:$ACCOUNT:userpool/$id")
  fi
done < <(aws cognito-idp list-user-pools --region "$ATLAS_REGION" --max-results 60 --query 'UserPools[].[Id,Name]' --output text)

PROD_AUTH+=("arn:aws:kms:$ATLAS_REGION:$ACCOUNT:key/0b9f936b-0749-4480-957b-c29871a11238")
PROD_INFRA+=("$(aws secretsmanager describe-secret --region "$ATLAS_REGION" --secret-id atlas-hub/prod --query ARN --output text)")

while IFS= read -r arn; do
  PROD_ANALYTICS+=("$arn")
done < <(aws events list-rules --region "$ATLAS_REGION" --name-prefix atlas-hub-analytics-prod- --query 'Rules[].Arn' --output text | tr '\t' '\n')

while IFS=$'\t' read -r arn name; do
  case "$name" in
    atlas-hub-prod) PROD_FRONTEND+=("$arn") ;;
    atlas-hub-dev) DEV_FRONTEND+=("$arn") ;;
  esac
done < <(aws amplify list-apps --region "$ATLAS_REGION" --query 'apps[].[appArn,name]' --output text)

while IFS=$'\t' read -r arn name; do
  case "$name" in
    pulse/pulse-app) PULSE_APP_ARNS+=("$arn") ;;
    pulse/pulse-worker) PULSE_WORKER_ARNS+=("$arn") ;;
  esac
done < <(aws ecr describe-repositories --region "$PULSE_REGION" --query 'repositories[].[repositoryArn,repositoryName]' --output text)

PULSE_INFRA_ARNS+=("arn:aws:iam::$ACCOUNT:user/pulse-app-user")
PULSE_INFRA_ARNS+=("arn:aws:iam::$ACCOUNT:policy/S3PresignedUrlAccess-prd-pulse")

while IFS=$'\t' read -r arn name; do
  case "$name" in
    Kyber-Solucoes-LP|Gabriel-Flores-Portfolio|Geisa-Portfolio) KYBER_ARNS+=("$arn") ;;
  esac
done < <(aws amplify list-apps --region "$KYBER_REGION" --query 'apps[].[appArn,name]' --output text)

while IFS= read -r arn; do
  SHARED_ARNS+=("$arn")
done < <(aws ecr describe-repositories --region "$SHARED_REGION" --query 'repositories[?repositoryName==`cdk-hnb659fds-container-assets-228228361045-us-east-2`].repositoryArn' --output text | tr '\t' '\n')

SHARED_ADMIN_ARNS+=("arn:aws:iam::$ACCOUNT:user/gabriel-flores")
ATLAS_CI_ARNS+=("arn:aws:iam::$ACCOUNT:user/atlashub-github-action")

tag_batch "$ATLAS_REGION" "$ATLAS_PROD_BACKEND" "${PROD_BACKEND[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_ANALYTICS" "${PROD_ANALYTICS[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_DB" "${PROD_DB[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_AUTH" "${PROD_AUTH[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_INFRA" "${PROD_INFRA[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_STORAGE" "${PROD_STORAGE[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_PROD_FRONTEND" "${PROD_FRONTEND[@]:-}"
tag_batch "$ATLAS_REGION" "$ATLAS_DEV_FRONTEND" "${DEV_FRONTEND[@]:-}"
tag_batch "$PULSE_REGION" "$PULSE_APP" "${PULSE_APP_ARNS[@]:-}"
tag_batch "$PULSE_REGION" "$PULSE_WORKER" "${PULSE_WORKER_ARNS[@]:-}"
tag_batch "$PULSE_REGION" "$PULSE_STORAGE" "${PULSE_STORAGE_ARNS[@]:-}"
tag_batch "$PULSE_REGION" "$PULSE_INFRA" "${PULSE_INFRA_ARNS[@]:-}"
tag_batch "$KYBER_REGION" "$KYBER" "${KYBER_ARNS[@]:-}"
tag_batch "$SHARED_REGION" "$SHARED" "${SHARED_ARNS[@]:-}"
tag_batch "$SHARED_REGION" "$ATLAS_CI" "${ATLAS_CI_ARNS[@]:-}"
tag_batch "$SHARED_REGION" "$SHARED_ADMIN" "${SHARED_ADMIN_ARNS[@]:-}"

LIGHTSAIL_TAGS_INSTANCE=(key=Project,value=pulse key=Environment,value=prod key=Owner,value=team-pulse key=ManagedBy,value=lightsail-console key=CostCenter,value=pulse key=Component,value=app key=Repository,value=PULSE-IPS key=DataClassification,value=confidential key=Criticality,value=high)
LIGHTSAIL_TAGS_STATIC=(key=Project,value=pulse key=Environment,value=prod key=Owner,value=team-pulse key=ManagedBy,value=lightsail-console key=CostCenter,value=pulse key=Component,value=infra key=Repository,value=PULSE-IPS key=DataClassification,value=confidential key=Criticality,value=high)

run aws lightsail tag-resource --region "$PULSE_REGION" --resource-name PRD-PULSE --tags "${LIGHTSAIL_TAGS_INSTANCE[@]}"
STATIC_IP_NAME=$(aws lightsail get-static-ips --region "$PULSE_REGION" --query "staticIps[?ipAddress=='52.204.122.172'].name | [0]" --output text)
if [ "$STATIC_IP_NAME" != "None" ] && [ -n "$STATIC_IP_NAME" ]; then
  run aws lightsail tag-resource --region "$PULSE_REGION" --resource-name "$STATIC_IP_NAME" --tags "${LIGHTSAIL_TAGS_STATIC[@]}"
fi

printf 'Backfill complete (apply=%s)\n' "$APPLY"
