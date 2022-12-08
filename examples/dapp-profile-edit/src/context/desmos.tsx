import {DesmosClient, GasPrice, Signer, SignerStatus, SigningMode} from "@desmoslabs/desmjs"
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useWalletConnectContext} from "./walletconnect";
import {WalletConnectSigner} from "@desmoslabs/desmjs-walletconnect";

/**
 * Interface that represents the global desmos state.
 */
interface DesmosState {
  client?: DesmosClient,
  signer?: Signer,
  signerStatus: SignerStatus,
  connect: () => Promise<void>,
  disconnect: () => Promise<void>,
}

// @ts-ignore
const initialState: DesmosState = {}
const DesmosContent = createContext<DesmosState>(initialState);

interface Props {
  chainEndpoint: string,
  children?: React.ReactNode
}

export const DesmosContextProvider: React.FC<Props> = ({chainEndpoint, children}) =>  {

  const {signClient} = useWalletConnectContext();
  const [signerStatus, setSignerStatus] = useState(SignerStatus.NotConnected);
  const [signer, setSigner] = useState<Signer | undefined>();
  const [client, setDesmosClient] = useState<DesmosClient | undefined>();

  // Effect to update the signer status
  useEffect(() => {
    if (signer !== undefined) {
      setSignerStatus(signer.status)
      signer.addStatusListener(setSignerStatus);
      return () => {
        signer.removeStatusListener(setSignerStatus);
        setSignerStatus(SignerStatus.NotConnected);
      }
    }

    return undefined;
  }, [signer]);

  const connect = useCallback(async () => {
    if (signClient !== undefined) {
      const signer = new WalletConnectSigner(signClient, {
        chain: "desmos:desmos-mainnet",
        signingMode: SigningMode.DIRECT,
      });
      await signer.connect();
      const desmosClient = await DesmosClient.connectWithSigner(chainEndpoint, signer, {
        gasPrice: GasPrice.fromString("0.2udaric"),
      })
      setDesmosClient(desmosClient);
      setSigner(signer);
    } else {
      throw new Error("can't connect, WalletConnect SignClient not initialized")
    }
  }, [signClient, chainEndpoint]);

  const disconnect = useCallback(async () => {
    if (signer !== undefined) {
      signer.disconnect();
    }
    setDesmosClient(undefined);
    setSigner(undefined);
  }, [signer])

  useEffect(() => {
    if (signClient !== undefined && signClient.session.values.length > 0) {
      (async () => {
        const session = signClient.session.values[0];
        console.log("Reloading signer from session...", session);

        const signer = new WalletConnectSigner(signClient, {
          chain: "desmos:desmos-mainnet",
          signingMode: SigningMode.DIRECT,
        });
        // Connect the signer to the reloaded session
        await signer.connectToSession(session);
        setSigner(old => {
          old?.disconnect();
          return signer;
        });

        // Create the new client with the restored signer
        const desmosClient = await DesmosClient.connectWithSigner(chainEndpoint, signer, {
          gasPrice: GasPrice.fromString("0.2udaric"),
        })
        setDesmosClient(desmosClient);

        console.log("Signer reloaded from session!")
      })()
    }
  }, [signClient, chainEndpoint])

  return <DesmosContent.Provider value={{
    client,
    signer,
    signerStatus,
    connect,
    disconnect
  }}>
    {children}
  </DesmosContent.Provider>
}

export function useDesmosContext(): DesmosState {
  return useContext(DesmosContent);
}
