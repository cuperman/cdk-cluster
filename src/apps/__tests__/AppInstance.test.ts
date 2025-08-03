import { AppInstance } from "../AppInstance";

describe("AppInstance", () => {
  const app = new AppInstance({
    name: "MyInstance",
    account: "123456789012",
    regions: ["us-east-1", "us-west-2"],
    defaults: {
      registry: {
        imageNames: ["my-image-1", "my-image-2"],
      },
    },
  });

  const assembly = app.synth();

  it("should create registry stacks in each region", () => {
    expect(assembly.stacks).toHaveLength(2);
  });

  it("prefixes stack names with app name", () => {
    assembly.stacks.forEach((stack) => {
      expect(stack.stackName).toMatch(/^MyInstance-.*/);
    });
  });
});
