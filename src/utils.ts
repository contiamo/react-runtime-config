import React from "react";

/**
 * Utils to provide a key that depends to the localstorage state.
 * 
 * @param storage
 * @param localOverride
 */
export const useWatchLocalstorageEvents = (storage: Storage, localOverride: boolean) => {
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

    return key
}