import * as cdk from "aws-cdk-lib";
import {
  AppClusterStack,
  AppClusterStackProps,
  AppDocumentDatabaseStackProps,
  AppDocumentDatabaseStack,
} from "../stacks";

export interface RegionalInstance {
  readonly documentDatabase?: AppDocumentDatabaseStackProps;
  readonly cluster: AppClusterStackProps;
}

export interface AppInstanceProps extends cdk.AppProps {
  readonly name: string;
  readonly account: string;
  readonly regions: string[];
  readonly primaryRegion: string;
  readonly defaults: RegionalInstance;
  readonly regional?: { [region: string]: RegionalInstance };
}

export class AppInstance extends cdk.App {
  constructor(props: AppInstanceProps) {
    super(props);

    const documentDatabaseStack = props.defaults.documentDatabase
      ? new AppDocumentDatabaseStack(
          this,
          `${props.name}-AppDocumentDatabase-global`,
          {
            env: {
              account: props.account,
              region: props.primaryRegion,
            },
            ...props.defaults.documentDatabase,
          }
        )
      : undefined;

    props.regions.forEach((region) => {
      new AppClusterStack(this, `${props.name}-AppCluster-${region}`, {
        env: {
          account: props.account,
          region,
        },
        documentDatabaseSecret: documentDatabaseStack?.secret,
        ...props.defaults.cluster,
        ...props.regional?.[region]?.cluster,
      });
    });
  }
}
