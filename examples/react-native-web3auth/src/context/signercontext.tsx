import {Signer, SigningMode} from "@desmoslabs/desmjs";
import React, {useCallback, useContext, useState, createContext} from "react";
import Web3Auth, {
  OPENLOGIN_NETWORK,
  SdkLoginParams
} from "@web3auth/react-native-sdk";
import * as WebBrowser from "@toruslabs/react-native-web-browser";
import {web3authSigner} from "../keyprovider";
import {WEB3AUTH_CLIENT_ID} from "@env"

const scheme = 'desmosweb3authexample';
const resolvedRedirectUrl = `${scheme}://openlogin`;

export interface SignerContext {
  signer?: Signer
  connect: (loginProvider: string) => Promise<void>
  disconnect: () => Promise<void>
}

// @ts-ignore
const signerContext = createContext<SignerContext>({})

interface Props {
  children?: React.ReactNode
}

export const SignerContextProvider: React.FC<Props> = ({children}) => {
  const [signer, setSigner] = useState<Signer>()

  const connect = useCallback(async (loginProvider: string) => {
    const web3auth = new Web3Auth(WebBrowser, {
      clientId: WEB3AUTH_CLIENT_ID,
      network: OPENLOGIN_NETWORK.TESTNET, // or other networks
    });

    const loginParams: Omit<SdkLoginParams, "curve"> = {
      loginProvider: loginProvider,
      redirectUrl: resolvedRedirectUrl,
    }

    const signer = web3authSigner(web3auth, loginParams, SigningMode.DIRECT);

    setSigner(signer);
    await signer.connect();
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
