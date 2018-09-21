import pick from "lodash/pick";
import React from "react";
import { InjectedProps } from ".";

export interface ConfigProps<T> {
  children: (options: Pick<InjectedProps<T>, "getConfig" | "getAllConfig" | "setConfig">) => React.ReactNode;
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
    const { children, ...props } = this.props;
    return children(pick(props, ["getConfig", "getAllConfig", "setConfig"]));
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
