<p align="center">
  <img src="https://github.com/contiamo/react-runtime-config/raw/master/assets/react-runtime-config-logo.png" alt="react-runtime-config" height="140" />
</p>

<h4 align="center">
  Make your application easily configurable.
</h4>

<p align="center">
  The simple way to provide a runtime configuration for your React application, with localstorage override and hot-reload⚡️!
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
- [Getting started](#getting-started)
- [Usage](#usage)
- [Options](#options)
- [Create an administration page](#create-an-administration-page)
- [If needed](#if-needed)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why

As front-end developer, we often need to deal with an external environment (servers, clients need for example).
To response to this flexibility, a runtime configuration is just perfect!

Indeed, with runtime configuration, we can provide a generic application and permit a total customization of this one:

- theme constant
- backend url
- feature flippings
- enable dev-tools :)
- …

With this package, the idea is to have a conveniant way to have a runtime configuration inside a react application.

The configuration can be set by:

- injecting an object into `window` as base configuration, very easy to manipulate in server side or ops
- local override into `localStorage`, so it's easy to have a custom environment on dev

And we can consume this configuration easily, with a simple react component.

## Getting started

1. `npm i react-runtime-config`

## Usage

First of all, you need to create a namespace for your config.

```tsx
// components/Config.tsx
import createConfig from "react-runtime-config";

// All config values that need to be set in window
interface MandatoryConfig {
  backendUrl: string;
}

// All other config values
const defaultConfig = {
  color: "pink",
};

export type IConfig = MandoryConfig & typeof defaultConfig;

export const { Config, AdminConfig } = createConfig<IConfig>({ namespace: "myapp" });

export default Config;
```

You can now use the created component everywhere in your application.

```tsx
// components/MyComponents.tsx
import react from "React";
import Config from "./Config";

const MyComponent = () => <Config>{getConfig => <h1 style={{ color: getConfig("color") }}>My title</h1>}</Config>;
```

The title will have a different color regarding our current environment.
The fallback order is the following:

- `localStorage.getItem("myapp.color")`
- `window.myapp.color`
- `defaultConfig.color`

## Options

```ts
interface ConfigOptions {
  namespace: string;
  /**
   * Storage adapter
   *
   * @default window.localStorage
   */
  storage?: StorageAdapter;
  /**
   * Permit to overidde any config values in storage
   *
   * @default true
   */
  localOverride?: boolean;
}
```

## Create an administration page

To allow easy management of your configuration, we provide a smart component called `<AdminConfig />` that give you out of the box everything you need to create an awesome administration page.

Note, we are using `@operational/components` for this example, but it's obviously working with everything else :wink:

```ts
// pages/ConfigurationPage.tsx
import { Page, Card, Input, Button } from "@operational/components";
import { AdminConfig } from "./components/Config";

export default (ConfirationPage = () => (
  <Page title="Configuration">
    <Card title="Configaration">
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
));
```

You have also access to `field.windowValue` and `field.storageValue` if you want implement more advanced UX on this page.

## If needed

We also expose from `createConfig` a simple `getConfig` and `setConfig`. These functions can be use as standalone and are exactly the same as these available inside `Config` component.

The only thing that you loose is the hot config reload :wink:
