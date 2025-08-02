// import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from "aws-cdk-lib/aws-sqs";

export interface ClusterProps {
  // Define construct properties here
}

export class Cluster extends Construct {
  constructor(scope: Construct, id: string, props: ClusterProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, "Queue", {
    //   visibilityTimeout: cdk.Duration.seconds(300),
    // });
  }
}
