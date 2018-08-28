import React from "react";
import ConfigBase, { ConfigProps } from "./Config";

export interface ConfigOptions {
  namespace: string;
  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: Storage;
  /**
   * Permit to overidde any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
  /**
   * Throw an error if the config value is not set in window
   *
   * @default false
   */
  forceWindowConfig?: boolean;
}

export const createConfig = (options: ConfigOptions) => {
  // List of `path` use in the application
  const configList = new Set<string>();

  return {
    Config: class Config<T> extends React.PureComponent<ConfigProps<T>> {
      // public static getDerivedStateFromProps(props: ConfigProps<string | boolean>) {
      //   if (props.path) {
      //     configList.add(props.path);
      //   } else {
      //     // @todo deal with multi-values syntax
      //   }
      // }

      public render() {
        const { namespace } = options;
        const injected = {
          storage: window.localStorage,
          localOverride: true,
          forceWindowConfig: false,
          configList,
          ...options,
          namespace: namespace.slice(-1) === "." ? namespace : `${namespace}.`,
        };
        // Deal with the bad typing from React
        return <ConfigBase {...injected} {...this.props as any} />;
      }
    },
    configList,
  };
};

export default createConfig;
