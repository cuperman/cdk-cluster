import { AppEnvironment } from "../AppEnvironment";

describe("AppEnvironment", () => {
  const app = new AppEnvironment({
    name: "MyEnv",
    account: "123456789012",
    regions: ["us-east-1", "us-west-2"],
    defaults: {
      network: {
        vpc: {
          maxAzs: 2,
          natGateways: 1,
        },
      },
    },
  });

  const assembly = app.synth();

  it("should create network stacks in each region", () => {
    expect(assembly.stacks).toHaveLength(2);
  });

  it("prefixes stack names with app name", () => {
    assembly.stacks.forEach((stack) => {
      expect(stack.stackName).toMatch(/^MyEnv-.*/);
    });
  });
});
