import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Cluster } from "../cluster";

describe("Cluster", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");

  new Cluster(stack, "MyTestConstruct");

  const template = Template.fromStack(stack);

  xit("has a queue", () => {
    template.hasResourceProperties("AWS::SQS::Queue", {
      VisibilityTimeout: 300,
    });
  });
});
