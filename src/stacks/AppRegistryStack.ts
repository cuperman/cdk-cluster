// import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { AppStack, AppStackProps } from "./AppStack";

export interface AppRegistryStackProps extends AppStackProps {
  readonly imageNames: string[];
}

export class AppRegistryStack extends AppStack {
  constructor(scope: Construct, id: string, props: AppRegistryStackProps) {
    super(scope, id, props);

    props.imageNames.forEach((imageName, index) => {
      const sequence = index + 1;

      new ecr.Repository(this, `Repo-${sequence}`, {
        repositoryName: imageName,
      });
    });
  }
}
