import * as cdk from "aws-cdk-lib";
import {
  AppRegistryStack,
  AppRegistryStackProps,
  AppClusterStack,
  AppClusterStackProps,
  AppDocumentDatabaseStackProps,
  AppDocumentDatabaseStack,
} from "../stacks";

export interface RegionalInstance {
  readonly registry: AppRegistryStackProps;
  readonly documentDatabase: AppDocumentDatabaseStackProps;
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

    const documentDatabaseStack = new AppDocumentDatabaseStack(
      this,
      `${props.name}-AppDocumentDatabase-global`,
      {
        env: {
          account: props.account,
          region: props.primaryRegion,
        },
        ...props.defaults.documentDatabase,
      }
    );

    props.regions.forEach((region) => {
      new AppRegistryStack(this, `${props.name}-AppRegistry-${region}`, {
        env: {
          account: props.account,
          region,
        },
        ...props.defaults.registry,
        ...props.regional?.[region]?.registry,
      });

      new AppClusterStack(this, `${props.name}-AppCluster-${region}`, {
        env: {
          account: props.account,
          region,
        },
        documentDatabaseSecret: documentDatabaseStack.secret,
        ...props.defaults.cluster,
        ...props.regional?.[region]?.cluster,
      });
    });
  }
}
