import {Signer, SigningMode} from "@desmoslabs/desmjs";
import {OpenloginAdapter} from "@web3auth/openlogin-adapter";
import React, {createContext, useCallback, useContext, useState} from "react";
import {web3AuthSigner} from "../utils/keyprovider";

export interface SignerContext {
  signer?: Signer
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

// @ts-ignore
const signerContext = createContext<SignerContext>({})

interface Props {
  children?: React.ReactNode
}

export const SignerContextProvider: React.FC<Props> = ({children}) => {
  const [signer, setSigner] = useState<Signer>()

  const connect = useCallback(async () => {
    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        network: "cyan",
        uxMode: "popup",
        whiteLabel: {
          name: "Desmos DApp example",
          defaultLanguage: "en",
          dark: true, // whether to enable dark mode. defaultValue: false
        },
      },
    });

    const signer = web3AuthSigner(SigningMode.DIRECT, {
      authMode: "DAPP",
      clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID!,
      chainConfig: {
        chainNamespace: "other",
        blockExplorer: "https://morpheus.desmos.network",
        displayName: "Desmos",
        chainId: "morpheus-apollo-3",
        ticker: "DSM",
        tickerName: "Desmos",
      }
    }, {
       adapters: [openloginAdapter]
    });

    setSigner(signer);
    return signer.connect();
  }, []);

  const disconnect = useCallback(async () => {
    if (signer !== undefined) {
      setSigner(undefined);
      await signer.disconnect()
    }
  }, [signer]);

  return <signerContext.Provider value={{
    signer,
    connect,
    disconnect
  }}
  >
    {children}
  </signerContext.Provider>
}

export function useSignerContext(): SignerContext {
  return useContext(signerContext);
}
