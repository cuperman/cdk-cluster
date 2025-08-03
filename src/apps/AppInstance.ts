import * as cdk from "aws-cdk-lib";
import { AppRegistryStack, AppRegistryStackProps } from "../stacks";

export interface RegionalInstance {
  readonly registry: AppRegistryStackProps;
}

export interface AppInstanceProps extends cdk.AppProps {
  readonly name: string;
  readonly account: string;
  readonly regions: string[];
  readonly defaults: RegionalInstance;
  readonly regional?: { [region: string]: RegionalInstance };
}

export class AppInstance extends cdk.App {
  constructor(props: AppInstanceProps) {
    super(props);

    props.regions.forEach((region) => {
      new AppRegistryStack(this, `${props.name}-AppRegistry-${region}`, {
        env: {
          account: props.account,
          region,
        },
        ...props.defaults.registry,
        ...props.regional?.[region]?.registry,
      });
    });
  }
}
