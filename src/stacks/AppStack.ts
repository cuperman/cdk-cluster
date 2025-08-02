import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface AppStackProps extends cdk.StackProps {
  readonly propagateTags?: boolean;
}

export class AppStack extends cdk.Stack {
  static PROPAGATE_TAGS_DEFAULT: boolean = true;

  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const propagateTags =
      typeof props?.propagateTags !== "undefined"
        ? props.propagateTags
        : AppStack.PROPAGATE_TAGS_DEFAULT;

    if (propagateTags && props?.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this).add(key, value);
      });
    }
  }
}
