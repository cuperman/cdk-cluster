import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as docdb from "aws-cdk-lib/aws-docdb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { AppStack, AppStackProps } from "./AppStack";

export interface AppDocumentDatabaseStackProps extends AppStackProps {
  readonly vpc: ec2.VpcLookupOptions;
  readonly masterUser: docdb.Login;
  readonly instanceType: ec2.InstanceType;
}

export class AppDocumentDatabaseStack extends AppStack {
  public secret: secretsmanager.ISecret | undefined;

  constructor(
    scope: Construct,
    id: string,
    props: AppDocumentDatabaseStackProps
  ) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", props.vpc);

    const databaseCluster = new docdb.DatabaseCluster(this, "DatabaseCluster", {
      vpc,
      masterUser: props.masterUser,
      instanceType: props.instanceType,
    });

    this.secret = databaseCluster.secret;

    databaseCluster.connections.allowDefaultPortFromAnyIpv4();
  }
}
