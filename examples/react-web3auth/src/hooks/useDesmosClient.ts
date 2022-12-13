import {DesmosClient, GasPrice} from "@desmoslabs/desmjs";
import {useEffect, useState} from "react";
import {useSignerContext} from "../context/signercontext";
import useSignerStatus from "./useSignerStatus";

export default function useDesmosClient(): DesmosClient | undefined {
  const [desmosClient, setDesmosClient] = useState<DesmosClient>();
  const {signer} = useSignerContext();
  const signerStatus = useSignerStatus();

  useEffect(() => {
    if (signer !== undefined && signerStatus !== undefined) {
      (async () => {
        const client = await DesmosClient.connectWithSigner("https://rpc.morpheus.desmos.network:443", signer, {
          gasPrice: GasPrice.fromString("0.2udaric"),
        });
        setDesmosClient(old => {
          if(old !== undefined) {
            old.disconnect();
          }
          return client;
        })
      })()
    }
  }, [signerStatus, signer])


  return desmosClient;
}
