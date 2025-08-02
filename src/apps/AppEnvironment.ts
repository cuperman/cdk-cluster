import * as cdk from "aws-cdk-lib";
import { AppNetworkStack, AppNetworkStackProps } from "../stacks";

export interface RegionalEnvironment {
  readonly network?: AppNetworkStackProps;
}

export interface AppEnvironmentProps extends cdk.AppProps {
  readonly account: string;
  readonly regions: string[];
  readonly defaults?: RegionalEnvironment;
  readonly regional?: { [region: string]: RegionalEnvironment };
}

export class AppEnvironment extends cdk.App {
  constructor(props: AppEnvironmentProps) {
    super(props);

    props.regions.forEach((region) => {
      new AppNetworkStack(this, `AppNetwork-${region}`, {
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
