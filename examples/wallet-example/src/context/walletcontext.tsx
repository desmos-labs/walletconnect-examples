import {OfflineSignerAdapter, Signer, SigningMode} from "@desmoslabs/desmjs";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {DEFAULT_MNEMONIC} from "../consts";

export enum WalletStatus {
  NOT_CONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
}

export interface WalletStateNotConnected {
  status: WalletStatus.NOT_CONNECTED,
}

export interface WalletStateConnected {
  status: WalletStatus.CONNECTED,
  signer: Signer,
  mnemonic: string,
}

export interface WalletStateConnecting {
  status: WalletStatus.CONNECTING
}

export interface WalletStateError {
  status: WalletStatus.ERROR
  error: Error
}

export type WalletState = WalletStateNotConnected | WalletStateConnecting | WalletStateConnected | WalletStateError;

interface WalletContextState {
  walletState: WalletState,
  connectWallet: (mnemonic: string) => void,
  disconnectWallet: () => void,
}

// @ts-ignore
const initialState: WalletContextState = {
  walletState: {
    status: WalletStatus.NOT_CONNECTED,
  }
}

const WalletContext = createContext<WalletContextState>(initialState);

interface Props {
  children?: React.ReactNode
}

export const WalletContextProvider: React.FC<Props> = ({children}) =>  {
  const [walletState, setWalletState] = useState<WalletState>(initialState.walletState)

  const connectWallet = useCallback(async (mnemonic: string) => {
    try {
      setWalletState({
        status: WalletStatus.CONNECTING
      });
      const newSigner = await OfflineSignerAdapter.fromMnemonic(SigningMode.DIRECT, mnemonic);
      setWalletState({
        status: WalletStatus.CONNECTED,
        signer: newSigner,
        mnemonic: mnemonic
      });
    } catch (error) {
      setWalletState({
        status: WalletStatus.ERROR,
        error: new Error(error)
      })
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      status: WalletStatus.NOT_CONNECTED
    })
  }, [])

  useEffect(() => {
    connectWallet(DEFAULT_MNEMONIC);
  }, [])


  return <WalletContext.Provider value={{
    walletState,
    connectWallet,
    disconnectWallet,
  }}>
    {children}
  </WalletContext.Provider>
}

export function useWalletContext(): WalletContextState {
  return useContext(WalletContext);
}
