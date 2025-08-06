import * as ec2 from "aws-cdk-lib/aws-ec2";
import { AppInstance } from "../AppInstance";

describe("AppInstance", () => {
  const app = new AppInstance({
    name: "MyInstance",
    account: "123456789012",
    regions: ["us-east-1", "us-west-2"],
    primaryRegion: "us-east-1",
    defaults: {
      registry: {
        imageNames: ["my-image-1", "my-image-2"],
      },
      documentDatabase: {
        vpc: {
          vpcName: "MyVpcName",
        },
        masterUser: {
          username: "master",
          excludeCharacters: '@"\\/?:#[]{}=;%+&$',
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.MEMORY5,
          ec2.InstanceSize.LARGE
        ),
      },
      cluster: {
        vpc: {
          vpcName: "MyVpcName",
        },
        zone: {
          domainName: "mydomain.com",
        },
        fqdn: "myapp.mydomain.com",
        services: [
          {
            image: {
              imageName: "my-image-1",
              imageTag: "latest",
            },
            targets: [
              {
                containerPort: 3000,
              },
            ],
          },
        ],
      },
    },
  });

  const assembly = app.synth();
  const stackNames = assembly.stacks.map((stack) => stack.stackName);

  it("prefixes stack names with app name", () => {
    assembly.stacks.forEach((stack) => {
      expect(stack.stackName).toMatch(/^MyInstance-.*/);
    });
  });

  it("should create registry stacks in each region", () => {
    expect(stackNames).toContain("MyInstance-AppRegistry-us-east-1");
    expect(stackNames).toContain("MyInstance-AppRegistry-us-west-2");
  });

  it("should create cluster stacks in each region", () => {
    expect(stackNames).toContain("MyInstance-AppCluster-us-east-1");
    expect(stackNames).toContain("MyInstance-AppCluster-us-west-2");
  });
});
