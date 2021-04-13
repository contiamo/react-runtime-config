import { Config, InjectedProps } from "./types";
import { useCallback } from "react";
import { useWatchLocalstorageEvents } from "./utils";

export function createUseConfig<TSchema extends Record<string, Config>>(props: InjectedProps<TSchema>) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride);

    const getConfig = useCallback(props.getConfig, [localstorageDep]);
    const getAllConfig = useCallback(props.getAllConfig, [localstorageDep]);

    return {
      getConfig,
      getAllConfig,
      setConfig: props.setConfig,
    };
  };
}
