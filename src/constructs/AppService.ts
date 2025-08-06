import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface AppImageDefinition {
  readonly imageName: string;
  readonly imageTag: string;
}

export interface AppServiceTarget {
  readonly containerPort: number;
  readonly protocol?: elbv2.ApplicationProtocol;
  readonly healthCheck?: elbv2.HealthCheck; // TODO: this shouldn't live here
  readonly priority?: number;
  readonly conditions?: elbv2.ListenerCondition[];
}

export interface AppServiceProps {
  readonly cluster: ecs.ICluster;
  readonly image: AppImageDefinition;
  readonly serviceName?: string;
  readonly runtimePlatform?: ecs.RuntimePlatform;
  readonly cpu?: number;
  readonly memory?: number;
  readonly logging?: logs.LogGroupProps;
  readonly logStreamPrefix: string;
  readonly environmentVariables?: { [key: string]: string };
  readonly targets: AppServiceTarget[];
  readonly documentDatabaseSecrets?: {
    readonly secret?: secretsmanager.ISecret;
    readonly environmentVariables?: { [key: string]: string };
  };
}

export class AppService extends Construct {
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: AppServiceProps) {
    super(scope, id);

    const image = ecr.Repository.fromRepositoryName(
      this,
      "Image",
      props.image.imageName
    );

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        runtimePlatform: props.runtimePlatform,
        cpu: props.cpu,
        memoryLimitMiB: props.memory,
      }
    );

    const logGroup = new logs.LogGroup(this, "LogGroup", props.logging);

    taskDefinition.addContainer("Container", {
      containerName: `${props.serviceName}-Container`,
      image: ecs.ContainerImage.fromEcrRepository(image, props.image.imageTag),
      portMappings: props.targets.map((target) => ({
        containerPort: target.containerPort,
      })),
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: props.logStreamPrefix,
      }),
      environment: props.environmentVariables,
      secrets: this.buildDocumentDatabaseSecrets(
        props.documentDatabaseSecrets?.secret,
        props.documentDatabaseSecrets?.environmentVariables
      ),
    });

    this.fargateService = new ecs.FargateService(this, "Service", {
      cluster: props.cluster,
      serviceName: props.serviceName,
      taskDefinition,
      minHealthyPercent: 100, // See https://github.com/aws/aws-cdk/issues/31705
    });
  }

  private buildDocumentDatabaseSecrets(
    secret?: secretsmanager.ISecret,
    environmentVariables?: { [key: string]: string }
  ): { [key: string]: ecs.Secret } | undefined {
    if (!secret) {
      return;
    }

    if (!environmentVariables) {
      return;
    }

    return Object.entries(environmentVariables).reduce((obj, [key, value]) => {
      obj[key] = ecs.Secret.fromSecretsManager(secret, value);
      return obj;
    }, {} as { [key: string]: ecs.Secret });
  }
}
