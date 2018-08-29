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
}

export function createConfig<TConfig>(options: ConfigOptions) {
  // List of `path` use in the application
  const configList = new Set<string>();

  return {
    Config(props: ConfigProps<TConfig>) {
      const { namespace } = options;
      const injected = {
        storage: window.localStorage,
        localOverride: true,
        configList,
        ...options,
        namespace: namespace.slice(-1) === "." ? namespace : `${namespace}.`,
      };
      return <ConfigBase {...injected} {...props} />;
    },
    configList,
  };
}

export default createConfig;
