
import {useCallback} from "react";
import {useWalletConnect} from "../context/WalletConnectContext";

export default function useWalletConnectPair() {
  const {client} = useWalletConnect();

  return useCallback((uri: string) => {
    if (client !== undefined) {
      return client.pair( {uri})
    } else {
      return Promise.reject(new Error("WalletConnect client not initialized"))
    }
  }, [client])
}
