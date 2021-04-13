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
  <a href="https://travis-ci.org/contiamo/react-runtime-config">
    <img src="https://travis-ci.org/contiamo/react-runtime-config.svg?branch=master" alt="travis (tag)" />
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

This configuration is then easily read by the simple React hook that this library exports.

## Getting started

1. `npm i react-runtime-config`
1. Create a namespace for your config:

```tsx
// components/Config.tsx
import createConfig from "react-runtime-config";

/**
 * `useConfig` and `useAdminConfig` are now React hooks that you can use in your app.
 *
 * `useConfig` provides config getter & setter, `useAdminConfig` provides data in order
 * to visualize your config map with ease. More on this further down.
 */
export const { useConfig, useAdminConfig } = createConfig({
  namespace: "MY_APP_CONFIG",
  schema: {
    color: {
      type: "string",
      enum: ["blue" as const, "green" as const, "pink" as const], // `as const` is required to have nice autocompletion
      description: "Main color of the application",
    },
    backend: {
      type: "string",
      description: "Backend url", // config without `default` need to be provided into `window.MY_APP_CONFIG`
    },
    port: {
      type: "number", // This schema can be retrieved after in `useAdminConfig().fields`
      description: "Backend port",
      min: 1,
      max: 65535,
      default: 8000, // config with `default` don't have to be set on `window.MY_APP_CONFIG`
    },
    monitoringLink: {
      type: "custom",
      description: "Link of the monitoring",
      parser: value => {
        if (typeof value === "object" && typeof value.url === "string" && typeof value.displayName === "string") {
          // The type will be infered from the return type
          return { url: value.url as string, displayName: value.displayName as string };
        }
        // This error will be shown if the `window.MY_APP_CONFIG.monitoringLink` can't be parsed or if we `setConfig` an unvalid value
        throw new Error("Monitoring link invalid!");
      },
    },
    isLive: {
      type: "boolean",
      default: false,
    },
  },
});
```

You can now use the created hooks everywhere in your application. Thoses hooks are totally typesafe, connected to your configuration. This means that you can easily track down all your configuration usage across your entire application and have autocompletion on the keys.

### Usage

```tsx
// components/MyComponents.tsx
import react from "React";
import { useConfig } from "./Config";

const MyComponent = () => {
  const { getConfig } = useConfig();

  return <h1 style={{ color: getConfig("color") }}>My title</h1>;
};
```

The title will have a different color regarding our current environment.

The priority of config values is as follows:

- `localStorage.getItem("MY_APP_CONFIG.color")`
- `window.MY_APP_CONFIG.color`
- `schema.color.default`

## Create an Administration Page

To allow easy management of your configuration, we provide a smart react hook called `useAdminConfig` that provides all the data that you need in order to assemble an awesome administration page where the configuration of your app can be referenced and managed.

**Note:** we are using [`@operational/components`](https://github.com/contiamo/operational-components) for this example, but a UI of config values _can_ be assembled with any UI library, or even with plain ole HTML-tag JSX.

```ts
// pages/ConfigurationPage.tsx
import { Page, Card, Input, Button, Checkbox } from "@operational/components";
import { useAdminConfig } from "./components/Config";

export default () => {
  const { fields, reset } = useAdminConfig();

  return (
    <Page title="Configuration">
      <Card title="Configuration">
        {fields.map(field =>
          field.type === "boolean" ? (
            <Checkbox key={field.path} value={field.value} label={field.path} onChange={field.set} />
          ) : (
            <Input key={field.path} value={field.value} label={field.path} onChange={field.set} />
          ),
        )}
        <Button onClick={reset}>Reset config</Button>
      </Card>
    </Page>
  );
};
```

You have also access to `field.windowValue` and `field.storageValue` if you want implement more advanced UX on this page.

## Moar Power (if needed)

We also expose from `createConfig` a simple `getConfig`, `getAllConfig` and `setConfig`. These functions can be used standalone and do not require use of the `useConfig` react hooks. This can be useful for accessing or mutating configuration values in component lifecycle hooks, or anywhere else outside of render.

These functions and are exactly the same as their counterparts available inside the `useConfig` react hook, the only thing you lose is the hot config reload.
