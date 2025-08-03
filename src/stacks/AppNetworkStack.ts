import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { AppStack, AppStackProps } from "./AppStack";

export interface AppNetworkStackProps extends AppStackProps {
  readonly vpc?: ec2.VpcProps;
}

export class AppNetworkStack extends AppStack {
  constructor(scope: Construct, id: string, props?: AppNetworkStackProps) {
    super(scope, id, props);

    new ec2.Vpc(this, "Vpc", props?.vpc);
  }
}
