// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface CdkContainerClusterProps {
  // Define construct properties here
}

export class CdkContainerCluster extends Construct {

  constructor(scope: Construct, id: string, props: CdkContainerClusterProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkContainerClusterQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
