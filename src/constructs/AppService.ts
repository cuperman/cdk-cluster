import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib/core";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";

export enum AppImageIpAddressType {
  IPV4 = "IPV4",
  IPV6 = "IPV6",
}

export interface AppImageDefinition {
  readonly imageName: string;
  readonly imageTag?: string;
  readonly ipAddressType?: AppImageIpAddressType;
}

export interface AppServiceTarget {
  readonly containerPort: number;
  readonly protocol?: elbv2.ApplicationProtocol;
  readonly healthCheck?: elbv2.HealthCheck; // TODO: this shouldn't live here
  readonly priority?: number;
  readonly conditions?: elbv2.ListenerCondition[];
  readonly ipAddressType?: elbv2.TargetGroupIpAddressType;
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
  readonly taskRoleStatements?: iam.PolicyStatement[];
}

export class AppService extends Construct {
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: AppServiceProps) {
    super(scope, id);

    const imageUrl = this.imageUrl(
      props.image.imageName,
      props.image.imageTag,
      props.image.ipAddressType
    );

    const repositoryArn = this.repositoryArn(props.image.imageName);

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        runtimePlatform: props.runtimePlatform,
        cpu: props.cpu,
        memoryLimitMiB: props.memory,
      }
    );

    if (props.taskRoleStatements) {
      for (const statement of props.taskRoleStatements) {
        taskDefinition.addToTaskRolePolicy(statement);
      }
    }

    const logGroup = new logs.LogGroup(this, "LogGroup", props.logging);

    taskDefinition.addContainer("Container", {
      containerName: `${props.serviceName}-Container`,
      image: ecs.ContainerImage.fromRegistry(imageUrl),
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

    // Standard Repository Permissions (not needed if using AWS ECR construct)
    taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ],
        resources: [repositoryArn],
      })
    );
    taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      })
    );

    // Support for ECR pull-through cache
    taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        actions: ["ecr:CreateRepository", "ecr:BatchImportUpstreamImage"],
        resources: [repositoryArn],
      })
    );

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc: props.cluster.vpc,
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
    });

    this.fargateService = new ecs.FargateService(this, "Service", {
      cluster: props.cluster,
      serviceName: props.serviceName,
      taskDefinition,
      minHealthyPercent: 100, // See https://github.com/aws/aws-cdk/issues/31705
      propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
      enableECSManagedTags: true,
      securityGroups: [securityGroup],
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

  private imageUrl(
    imageName: string,
    imageTag?: string,
    ipAddressType?: AppImageIpAddressType
  ): string {
    const imagePath = imageTag ? `${imageName}:${imageTag}` : imageName;

    if (ipAddressType === AppImageIpAddressType.IPV4) {
      // return ipv4 format
      return `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${imagePath}`;
    }

    // use ipv6 format by default
    return `${cdk.Aws.ACCOUNT_ID}.dkr-ecr.${cdk.Aws.REGION}.on.aws/${imagePath}`;
  }

  private repositoryArn(imageName: string): string {
    return `arn:${cdk.Aws.PARTITION}:ecr:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:repository/${imageName}`;
  }
}
