<div align="center">
  <img src="https://github.com/contiamo/react-runtime-config/raw/master/assets/react-runtime-config-logo.png" alt="react-runtime-config" height="140" />
</div>

<h4 align="center">
  Make your application easily configurable.
</h4>

<p align="center">
  A simple way to provide runtime configuration for your React application, with localStorage overrides and hot-reload support ⚡️!
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-runtime-config">
    <img src="https://img.shields.io/npm/v/react-runtime-config/latest.svg" alt="npm (tag)" />
  </a>
  <a href="">
    <img src="https://img.shields.io/travis/contiamo/react-runtime-config/master.svg" alt="travis (tag)" />
  </a>
  <img src="https://img.shields.io/github/license/mashape/apistatus.svg" alt="license MIT (tag)" />
</p>

## Summary

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Why](#why)
- [How](#how)
- [Getting started](#getting-started)
  - [Usage](#usage)
    - [Options](#options)
- [Create an Administration Page](#create-an-administration-page)
- [Moar Power (if needed)](#moar-power-if-needed)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why

Most web applications usually need to support and function within a variety of distinct environments: local, development, staging, production, on-prem, etc. This project aims to provide flexibility to React applications by making certain properties configurable at runtime, allowing the app to be customized based on a pre-determined configmap respective to the environment. This is especially powerful when combined with [Kubernetes configmaps](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/).

Here are examples of some real-world values that can be helpful when configurable at runtime:

- Primary Color
- Backend API URL
- Feature Flags
- …

## How

The configuration can be set by _either_:

- setting a configuration property on `window` with reasonable defaults. Consider,

```js
window.MY_APP_CONFIG = {
  primaryColor: "green",
};
```

- _or_ by setting a value in `localStorage`. Consider,

```js
localStorage.setItem("MY_APP_CONFIG.primaryColor", "green");
```

The `localStorage` option could provide a nice delineation between environments: you _could_ set your local environment to green, and staging to red for example, in order to never be confused about what you're looking at when developing locally and testing against a deployed development environment: if it's green, it's local.

This configuration is then easily read by the simple React component that this library exports.

## Getting started

1. `npm i react-runtime-config`
1. Create a namespace for your config:

```tsx
// components/Config.tsx
import createConfig from "react-runtime-config";

/**
 * All config values that need to be set in window.
 * Errors will be thrown if these values do not exist.
 */
interface MandatoryConfig {
  backendUrl: string;
}

// All optional config values.
const defaultConfig = {
  color: "pink",
};

export type ConfigType = MandatoryConfig & typeof defaultConfig;

/**
 * Config and AdminConfig are now React components that
 * you can use in your app.
 *
 * Config reads the config, AdminConfig provides data in order
 * to visualize your config map with ease. More on this further
 * down.
 */

export const { Config, AdminConfig } = createConfig<ConfigType>({ namespace: "MY_APP_CONFIG", defaultConfig });

export default Config;
```

You can now use the created components everywhere in your application.

### Usage

```tsx
// components/MyComponents.tsx
import react from "React";
import Config from "./Config";

const MyComponent = () => <Config>{getConfig => <h1 style={{ color: getConfig("color") }}>My title</h1>}</Config>;
```

The title will have a different color regarding our current environment.

The priority of config values is as follows:

- `localStorage.getItem("MY_APP_CONFIG.color")`
- `window.MY_APP_CONFIG.color`
- `defaultConfig.color`

#### Options

```ts
interface ConfigOptions {
  namespace: string;
  /**
   * Config default values
   */
  defaultConfig?: Partial<TConfig>;
  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: StorageAdapter;
  /**
   * Permit to override any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
}
```

## Create an Administration Page

To allow easy management of your configuration, we provide a smart component called `<AdminConfig />` that provides all the data that you need in order to assemble an awesome administration page where the configuration of your app can be referenced and managed.

**Note:** we are using [`@operational/components`](https://github.com/contiamo/operational-components) for this example, but a UI of config values _can_ be assembled with any UI library, or even with plain ole HTML-tag JSX.

```ts
// pages/ConfigurationPage.tsx
import { Page, Card, Input, Button } from "@operational/components";
import { AdminConfig } from "./components/Config";

export default () => (
  <Page title="Configuration">
    <Card title="Configuration">
      <AdminConfig>
        {({ fields, onFieldChange, submit, reset }) =>
          fields.map(field => (
            <Input value={field.value} label={field.path} onChange={val => field.onChange(field.path, val)} />
          ))
        }
        <Button onClick={submit}>Update config</Button>
        <Button onClick={reset}>Reset config</Button>
      </AdminConfig>
    </Card>
  </Page>
);
```

You have also access to `field.windowValue` and `field.storageValue` if you want implement more advanced UX on this page.

## Moar Power (if needed)

We also expose from `createConfig` a simple `getConfig` and `setConfig`. These functions can be used standalone and do not require use of the `Config` component. This can be useful for accessing or mutating configuration values in component lifecycle hooks, or anywhere else outside of render.

These functions and are exactly the same as their counterparts available inside the `Config` component, the only thing you lose is the hot config reload.
