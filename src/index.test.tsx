import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import React from "react";
import { cleanup, render } from "react-testing-library";
import { Mock } from "ts-mockery";

import createConfig from "./";

// Localstorage mock
let store = {};

const storage = Mock.of<Storage>({
  getItem: (path: string) => get(store, path, null),
  setItem: (path: string, value: string) => set(store, path, value),
  removeItem: (path: string) => unset(store, path),
  clear: () => (store = {}),
});

interface IConfig {
  foo: string;
  riri: string;
  picsou: string;
  loulou: string;
  donald: string;
  aBoolean: boolean;
}

describe("localStorage mock", () => {
  afterEach(() => {
    storage.clear();
  });

  it("should set and get an item", () => {
    storage.setItem("plop", "coucou");
    expect(storage.getItem("plop")).toEqual("coucou");
  });

  it("should clear the store", () => {
    storage.setItem("plop", "coucou");
    storage.clear();

    expect(store).toEqual({});
  });

  it("should return null if the value is not in the store", () => {
    expect(storage.getItem("plop")).toBeNull();
  });
});

describe("react-runtime-config", () => {
  beforeEach(() => {
    set(window, "test", { picsou: "a", donald: "b", riri: "c", loulou: "d", foo: "from-window", aBoolean: true });
  });
  afterEach(() => {
    cleanup();
    storage.clear();
    delete (window as any).test;
  });

  describe("Config", () => {
    it("should get the localhost value", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0]("foo")).toEqual("from-localstorage");
    });

    it("should get the window value", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      render(<Config children={children} />);

      expect(children.mock.calls[0][0]("foo")).toEqual("from-window");
    });

    it("should ignore trailing dot in the namespace", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test.", storage });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0]("foo")).toEqual("from-localstorage");
    });

    it("should rerender the component on localstorage update", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      expect(children.mock.calls[0][0]("foo")).toEqual("from-localstorage");

      storage.setItem("test.foo", "from-localstorage-modified");
      window.dispatchEvent(new Event("storage"));

      expect(children.mock.calls.length).toEqual(2);
      expect(children.mock.calls[0][0]("foo")).toEqual("from-localstorage-modified");
    });

    it("should not rerender the component on localstorage update if localOveride is disable", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage, localOverride: false });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "from-localstorage");

      render(<Config children={children} />);

      storage.setItem("test.foo", "from-localstorage-modified");
      window.dispatchEvent(new Event("storage"));

      expect(children.mock.calls.length).toEqual(1);
      expect(children.mock.calls[0][0]("foo")).toEqual("from-window");
    });

    it("should throw if the value is not set in window", () => {
      unset(window, "test.foo");
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });

      expect(() => render(<Config children={getConfig => getConfig("foo")} />)).toThrowError(
        "INVALID CONFIG: foo must be present inside config map, under window.test.",
      );
    });

    describe("boolean values", () => {
      it("should return true from window config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn(() => <div />);

        set(window, "test.aBoolean", true);
        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("aBoolean")).toEqual(true);
      });

      it("should return false from window config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn(() => <div />);

        set(window, "test.aBoolean", false);
        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("aBoolean")).toEqual(false);
      });

      it("should return true from localstorage config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn(() => <div />);

        set(window, "test.foo", false);
        storage.setItem("test.foo", "true");
        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("foo")).toEqual(true);
      });

      it("should return false from localstorage config", () => {
        const { Config } = createConfig<IConfig>({ namespace: "test", storage });
        const children = jest.fn(() => <div />);

        set(window, "test.foo", true);
        storage.setItem("test.foo", "false");
        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("foo")).toEqual(false);
      });
    });

    describe("default values", () => {
      it("should return the default value", () => {
        unset(window, "test.foo");
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultValues: { foo: "from-default" },
        });
        const children = jest.fn(() => <div />);

        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("foo")).toEqual("from-default");
      });

      it("should return the window value if defined", () => {
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultValues: { foo: "from-default" },
        });
        const children = jest.fn(() => <div />);

        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("foo")).toEqual("from-window");
      });

      it("should return the storage value if defined", () => {
        const { Config } = createConfig<IConfig>({
          namespace: "test",
          storage,
          defaultValues: { foo: "from-default" },
        });
        const children = jest.fn(() => <div />);
        storage.setItem("test.foo", "from-localstorage");

        render(<Config children={children} />);

        expect(children.mock.calls[0][0]("foo")).toEqual("from-localstorage");
      });
    });

    it("should have correct type definition", () => {
      const { Config } = createConfig<IConfig>({ namespace: "test", storage });
      render(
        <Config>
          {(getConfig, setConfig) => {
            const val: boolean = getConfig("aBoolean");
            const val2: string = getConfig("donald");
            setConfig("loulou", "plop");
            setConfig("aBoolean", true);
            return (
              <h1>
                {val}
                {val2}
              </h1>
            );
          }}
        </Config>,
      );

      expect(1).toBe(1);
    });
  });

  describe("AdminConfig", () => {
    let config = createConfig<IConfig>({ namespace: "test", storage });
    let children: jest.Mock<JSX.Element>;

    beforeEach(() => {
      config = createConfig<IConfig>({ namespace: "test", storage });
      children = jest.fn(() => <div />);

      const { AdminConfig } = config;

      storage.setItem("test.picsou", "$$$");

      // expose children called by AdminConfig
      render(<AdminConfig>{children}</AdminConfig>);
    });

    it("should return all the config fields", () => {
      const expectedFields = [
        { path: "picsou", storageValue: "$$$", value: "$$$", windowValue: "a" },
        { path: "donald", storageValue: null, value: "b", windowValue: "b" },
        { path: "riri", storageValue: null, value: "c", windowValue: "c" },
        { path: "loulou", storageValue: null, value: "d", windowValue: "d" },
        { path: "foo", storageValue: null, value: "from-window", windowValue: "from-window" },
        { path: "aBoolean", storageValue: null, value: true, windowValue: true },
      ];
      expect(children.mock.calls[0][0].fields).toEqual(expectedFields);
    });

    it("should change the value on field change", () => {
      children.mock.calls[0][0].onFieldChange("picsou", "plop");

      const expectedFields = [
        { path: "picsou", storageValue: "$$$", value: "plop", windowValue: "a" },
        { path: "donald", storageValue: null, value: "b", windowValue: "b" },
        { path: "riri", storageValue: null, value: "c", windowValue: "c" },
        { path: "loulou", storageValue: null, value: "d", windowValue: "d" },
        { path: "foo", storageValue: null, value: "from-window", windowValue: "from-window" },
        { path: "aBoolean", storageValue: null, value: true, windowValue: true },
      ];

      expect(children.mock.calls[1][0].fields).toEqual(expectedFields);
    });

    it("should update storage value on submit", () => {
      expect(storage.getItem("test.picsou")).toEqual("$$$");

      children.mock.calls[0][0].onFieldChange("picsou", "plop");
      children.mock.calls[1][0].submit();

      expect(storage.getItem("test.picsou")).toEqual("plop");
    });

    it("should reset the local storage", () => {
      children.mock.calls[0][0].onFieldChange("picsou", "plop");
      children.mock.calls[1][0].reset();

      const expectedFields = [
        { path: "picsou", storageValue: null, value: "a", windowValue: "a" },
        { path: "donald", storageValue: null, value: "b", windowValue: "b" },
        { path: "riri", storageValue: null, value: "c", windowValue: "c" },
        { path: "loulou", storageValue: null, value: "d", windowValue: "d" },
        { path: "foo", storageValue: null, value: "from-window", windowValue: "from-window" },
        { path: "aBoolean", storageValue: null, value: true, windowValue: true },
      ];

      expect(children.mock.calls[2][0].fields).toEqual(expectedFields);
      expect(children.mock.calls.length).toBe(3);
    });
  });
});
