import React from "react";

/**
 * Utils to provide a key that depends to the localStorage state.
 *
 * @param storage
 * @param localOverride
 */
export const useWatchLocalStorageEvents = (storage: Storage, localOverride: boolean) => {
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    const onStorageUpdate = (_: StorageEvent) => {
      if (storage && localOverride) {
        setKey(i => (i + 1) % 10);
      }
    };

    window.addEventListener("storage", onStorageUpdate);

    return () => window.removeEventListener("storage", onStorageUpdate);
  }, [storage, localOverride, setKey]);

  return key;
};

export function capitalize<T extends string>(str: T) {
  if (!str || str.length < 1) return "" as Capitalize<T>;
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<T>;
}
