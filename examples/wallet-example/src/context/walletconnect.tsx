import SignClient from "@walletconnect/sign-client";
import React, {createContext, useContext, useEffect, useState} from "react";
import {useWalletContext, WalletGenerationState} from "./walletcontext";
import {SignClientTypes} from "@walletconnect/types";
import {toBase64} from "@cosmjs/encoding"


interface WalletConnectState {
  client?: SignClient
}


const defaultState: WalletConnectState = {}
const walletConnectContext = createContext<WalletConnectState>(defaultState)

interface Props {
  children?: React.ReactNode
}

export const WalletConnectProvider: React.FC<Props> = ({children}) => {
  const [client, setClient] = useState<SignClient>();
  const {walletState} = useWalletContext();

  useEffect(() => {
    if (client !== undefined && walletState?.state === WalletGenerationState.GENERATED) {
      const signer = walletState.signer;
      const listener = async (params: SignClientTypes.EventArguments["session_request"]) => {
        switch (params.params.request.method) {
          case "cosmos_getAccounts":
            const accounts = await signer.getAccounts();
            client.respond({
              topic: params.topic,
              response: {
                id: params.id,
                jsonrpc: "2.0",
                result: accounts.map((account) => ({
                  address: account.address,
                  algo: account.algo,
                  pubkey: toBase64(account.pubkey),
                })),
              }
            })
            break;
        }
      }
      client.on("session_request", listener);

      return () => {
        client.off("session_request", listener);
      }
    }

    return undefined;
  }, [walletState, client])


  useEffect(() => {
    (async () => {
      try {
        const client = await SignClient.init({
          projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: "Desmos Test Wallet",
            description: "A simple Desmos wallet that supports WalletConnect",
            url: "",
            icons: []
          }
        });
        setClient(client);
      } catch (e) {
        console.error("WallettConnectContext", e);
      }
    })()
  }, [])

  return <walletConnectContext.Provider value={{
    client
  }}>
    {children}
  </walletConnectContext.Provider>
}

export function useWalletConnect() {
  return useContext(walletConnectContext);
}
