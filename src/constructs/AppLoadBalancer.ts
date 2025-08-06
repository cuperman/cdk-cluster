import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface AppLoadBalancerProps
  extends elbv2.ApplicationLoadBalancerProps {
  readonly dns: {
    readonly zone: route53.IHostedZone;
    readonly fqdn: string;
    readonly ssl: true;
  };
}

export class AppLoadBalancer extends elbv2.ApplicationLoadBalancer {
  aRecord: route53.ARecord;
  listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AppLoadBalancerProps) {
    super(scope, id, props);

    const { zone, fqdn, ssl } = props.dns;

    this.listener = ssl
      ? this.createHttpsListener({ zone, fqdn })
      : this.createHttpListener();

    this.aRecord = new route53.ARecord(this, "DnsRecordIpv4", {
      zone,
      recordName: `${fqdn}.`,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this)
      ),
    });

    this.aRecord = new route53.AaaaRecord(this, "DnsRecordIpv6", {
      zone,
      recordName: `${fqdn}.`,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this)
      ),
    });
  }

  private createDefaultAction(): elbv2.ListenerAction {
    return elbv2.ListenerAction.fixedResponse(501, {
      contentType: "text/plain",
      messageBody: "No services available",
    });
  }

  private createHttpListener(): elbv2.ApplicationListener {
    return this.addListener("Listener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: this.createDefaultAction(),
    });
  }

  private createHttpsListener(props: {
    zone: route53.IHostedZone;
    fqdn: string;
  }): elbv2.ApplicationListener {
    const { fqdn, zone } = props;

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: fqdn,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    return this.addListener("Listener", {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: this.createDefaultAction(),
    });
  }
}
