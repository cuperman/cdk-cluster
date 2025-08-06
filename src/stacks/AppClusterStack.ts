import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { AppStack, AppStackProps } from "./AppStack";
import { AppLoadBalancer, AppService, AppServiceProps } from "../constructs";

export interface AppClusterStackProps extends AppStackProps {
  readonly vpc: ec2.VpcLookupOptions;
  readonly zone: route53.HostedZoneProviderProps;
  readonly fqdn: string;
  readonly clusterName?: string;
  readonly documentDatabaseSecret?: secretsmanager.ISecret;
  readonly services: Omit<AppServiceProps, "cluster" | "logStreamPrefix">[];
}

export class AppClusterStack extends AppStack {
  constructor(scope: Construct, id: string, props: AppClusterStackProps) {
    super(scope, id, props);

    // networking

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", props.vpc);
    const zone = route53.HostedZone.fromLookup(this, "Zone", props.zone);

    // cluster

    const cluster = new ecs.Cluster(this, "Cluster", {
      clusterName: props.clusterName,
      vpc,
    });

    // load balancer

    const loadBalancer = new AppLoadBalancer(this, "LoadBalancer", {
      vpc,
      dns: {
        zone,
        fqdn: props.fqdn,
        ssl: true,
      },
      internetFacing: true,
    });

    // services

    props.services.forEach((serviceProps, serviceIndex) => {
      const serviceCount = serviceIndex + 1;

      const service = new AppService(this, `Service${serviceCount}`, {
        cluster,
        ...serviceProps,
        documentDatabaseSecrets: {
          secret: props.documentDatabaseSecret,
          environmentVariables:
            serviceProps.documentDatabaseSecrets?.environmentVariables,
        },
        logStreamPrefix: cluster.clusterName,
      });

      // targets

      serviceProps.targets.forEach((target, targetIndex) => {
        const targetCount = targetIndex + 1;

        const targetGroup = new elbv2.ApplicationTargetGroup(
          this,
          `Service${serviceCount}TargetGroup${targetCount}`,
          {
            vpc,
            targets: [service.fargateService],
            port: target.containerPort,
            protocol: elbv2.ApplicationProtocol.HTTP,
            healthCheck: target.healthCheck,
          }
        );

        loadBalancer.listener.addAction(
          `Service${serviceCount}Action${targetCount}`,
          {
            priority: target.priority,
            conditions: target.conditions,
            action: elbv2.ListenerAction.forward([targetGroup]),
          }
        );
      });
    });
  }
}
