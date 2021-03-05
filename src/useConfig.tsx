import { InjectedProps } from ".";
import { useCallback } from "react";
import { useWatchLocalstorageEvents } from "./utils";

export function useConfig<T>(props: InjectedProps<T>) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride)

    const getConfig = useCallback(props.getConfig, [localstorageDep]);
    const getAllConfig = useCallback(props.getAllConfig, [localstorageDep]);

    return {
      getConfig,
      getAllConfig,
      setConfig: props.setConfig,
    };
  };
}

export default useConfig;
