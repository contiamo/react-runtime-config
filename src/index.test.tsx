import get from "lodash/get";
import set from "lodash/set";
import React from "react";
import { cleanup, render } from "react-testing-library";
import { Mock } from "ts-mockery";

import createConfig from "./";

// Localstorage mock
let store = {};

const storage = Mock.of<Storage>({
  getItem: (path: string) => get(store, path, null),
  setItem: (path: string, value: string) => set(store, path, value),
  clear: () => (store = {}),
});

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
  afterEach(() => {
    cleanup();
    storage.clear();
  });

  it("should get the localhost value", () => {
    const { Config } = createConfig({ namespace: "test", storage });
    const children = jest.fn(() => <div />);

    storage.setItem("test.foo", "from-localstorage");

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    expect(children).toBeCalledWith("from-localstorage");
  });

  it("should get the window value", () => {
    const { Config } = createConfig({ namespace: "test", storage });
    const children = jest.fn(() => <div />);

    set(window, "test.foo", "from-window");

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    expect(children).toBeCalledWith("from-window");
    delete (window as any).test.foo;
  });

  it("should get the default value", () => {
    const { Config } = createConfig({ namespace: "test", storage });
    const children = jest.fn(() => <div />);

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    expect(children).toBeCalledWith("from-default");
  });

  it("should ignore trailing dot in the namespace", () => {
    const { Config } = createConfig({ namespace: "test.", storage });
    const children = jest.fn(() => <div />);

    storage.setItem("test.foo", "from-localstorage");

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    expect(children).toBeCalledWith("from-localstorage");
  });

  it("should rerender the component on localstorage update", () => {
    const { Config } = createConfig({ namespace: "test", storage });
    const children = jest.fn(() => <div />);

    storage.setItem("test.foo", "from-localstorage");

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    expect(children).toBeCalledWith("from-localstorage");

    storage.setItem("test.foo", "from-localstorage-modified");
    window.dispatchEvent(new Event("storage"));

    expect(children.mock.calls.length).toEqual(2);
    expect(children).toBeCalledWith("from-localstorage-modified");
  });

  it("should not rerender the component on localstorage update if localOveride is disable", () => {
    const { Config } = createConfig({ namespace: "test", storage, localOverride: false });
    const children = jest.fn(() => <div />);

    storage.setItem("test.foo", "from-localstorage");

    render(<Config path="foo" defaultValue="from-default" children={children} />);

    storage.setItem("test.foo", "from-localstorage-modified");
    window.dispatchEvent(new Event("storage"));

    expect(children.mock.calls.length).toEqual(1);
    expect(children).toBeCalledWith("from-default");
  });

  it("should throw if the value is not set in window", () => {
    const { Config } = createConfig({ namespace: "test", storage, forceWindowConfig: true });
    const children = jest.fn(() => <div />);

    expect(() => render(<Config path="foo" defaultValue="from-default" children={children} />)).toThrowError(
      "INVALID CONFIG: foo must be present inside config map, under window.test.",
    );
  });

  it("should throw if the value is not set in window (force in component)", () => {
    const { Config } = createConfig({ namespace: "test", storage, forceWindowConfig: false });
    const children = jest.fn(() => <div />);

    expect(() =>
      render(<Config path="foo" defaultValue="from-default" children={children} forceWindowConfig />),
    ).toThrowError("INVALID CONFIG: foo must be present inside config map, under window.test.");
  });

  describe("boolean values", () => {
    it("should return true from window config", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      set(window, "test.foo", true);
      render(<Config path="foo" defaultValue={false} children={children} />);

      expect(children).toBeCalledWith(true);
      delete (window as any).test.foo;
    });

    it("should return false from window config", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      set(window, "test.foo", false);
      render(<Config path="foo" defaultValue={true} children={children} />);

      expect(children).toBeCalledWith(false);
      delete (window as any).test.foo;
    });

    it("should return true from localstorage config", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "true");
      render(<Config path="foo" defaultValue={false} children={children} />);

      expect(children).toBeCalledWith(true);
    });

    it("should return false from localstorage config", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      storage.setItem("test.foo", "false");
      render(<Config path="foo" defaultValue={true} children={children} />);

      expect(children).toBeCalledWith(false);
    });

    it("should return true from defaultValue", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      render(<Config path="foo" defaultValue={true} children={children} />);

      expect(children).toBeCalledWith(true);
    });

    it("should return false from defaultValue", () => {
      const { Config } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      render(<Config path="foo" defaultValue={false} children={children} />);

      expect(children).toBeCalledWith(false);
    });
  });

  describe("configList", () => {
    it("should return the entire list of paths", () => {
      const { Config, configList } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      render(<Config path="picsou" defaultValue={true} children={children} />);
      render(<Config path="donald" defaultValue={false} children={children} />);
      render(<Config path="riri" defaultValue={true} children={children} />);
      render(<Config path="loulou" defaultValue={false} children={children} />);

      expect(Array.from(configList)).toEqual(["picsou", "donald", "riri", "loulou"]);
    });

    it("should return the entire list of paths (without duplicate)", () => {
      const { Config, configList } = createConfig({ namespace: "test", storage });
      const children = jest.fn(() => <div />);

      render(<Config path="picsou" defaultValue={true} children={children} />);
      render(<Config path="donald" defaultValue={false} children={children} />);
      render(<Config path="picsou" defaultValue={true} children={children} />);
      render(<Config path="riri" defaultValue={true} children={children} />);
      render(<Config path="loulou" defaultValue={false} children={children} />);
      render(<Config path="picsou" defaultValue={true} children={children} />);

      expect(Array.from(configList)).toEqual(["picsou", "donald", "riri", "loulou"]);
    });
  });
});
