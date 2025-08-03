import * as cdk from "aws-cdk-lib";
import { AppNetworkStack, AppNetworkStackProps } from "../stacks";

export interface RegionalEnvironment {
  readonly network?: AppNetworkStackProps;
}

export interface AppEnvironmentProps extends cdk.AppProps {
  readonly name: string;
  readonly account: string;
  readonly regions: string[];
  readonly defaults?: RegionalEnvironment;
  readonly regional?: { [region: string]: RegionalEnvironment };
}

export class AppEnvironment extends cdk.App {
  constructor(props: AppEnvironmentProps) {
    super(props);

    props.regions.forEach((region) => {
      new AppNetworkStack(this, `${props.name}-AppNetwork-${region}`, {
        env: {
          account: props.account,
          region,
        },
        ...props.defaults?.network,
        ...props.regional?.[region]?.network,
      });
    });
  }
}
