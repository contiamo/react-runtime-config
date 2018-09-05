import React from "react";
import { InjectedProps } from ".";

export interface ConfigProps<T> {
  children: (
    getConfig: <K extends Extract<keyof T, string> = Extract<keyof T, string>>(path: K) => T[K],
    setConfig: <K extends Extract<keyof T, string> = Extract<keyof T, string>>(path: K, value: T[K]) => void,
  ) => React.ReactNode;
}

export class Config<T> extends React.Component<ConfigProps<T> & InjectedProps<T>> {
  public componentDidMount() {
    if (this.props.localOverride) {
      window.addEventListener("storage", this.onStorageUpdate);
    }
  }

  public componentWillUnmount() {
    if (this.props.localOverride) {
      window.removeEventListener("storage", this.onStorageUpdate);
    }
  }

  public render() {
    return this.props.children(this.props.getConfig, this.props.setConfig);
  }

  /**
   * Handler for storage event.
   */
  private onStorageUpdate = (_: StorageEvent) => {
    if (this.props.storage && this.props.localOverride) {
      this.forceUpdate();
    }
  };
}

export default Config;
