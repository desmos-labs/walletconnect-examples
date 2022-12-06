import {OfflineSignerAdapter, Signer, SigningMode} from "@desmoslabs/desmjs";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {DEFAULT_MNEMONIC} from "../consts";

export enum WalletGenerationState {
  GENERATING,
  GENERATED,
  FAILED,
}

export interface WalletStateGenerated {
  state: WalletGenerationState.GENERATED,
  signer: Signer,
  mnemonic: string,
}

export interface WalletStateGenerating {
  state: WalletGenerationState.GENERATING
}

export interface WalletStateFailed {
  state: WalletGenerationState.FAILED
  error: Error
}

export type WalletState = WalletStateGenerating | WalletStateGenerated | WalletStateFailed

interface WalletContextState {
  walletState?: WalletState,
  generateWallet: (mnemonic: string) => void,
}

// @ts-ignore
const initialState: WalletContextState = {}

const WalletContext = createContext<WalletContextState>(initialState);

interface Props {
  children?: React.ReactNode
}

export const WalletContextProvider: React.FC<Props> = ({children}) =>  {
  const [walletState, setWalletState] = useState<WalletState>()

  const generateWallet = useCallback(async (mnemonic: string) => {
    try {
      setWalletState({
        state: WalletGenerationState.GENERATING
      });
      const newSigner = await OfflineSignerAdapter.fromMnemonic(SigningMode.DIRECT, mnemonic);
      setWalletState({
        state: WalletGenerationState.GENERATED,
        signer: newSigner,
        mnemonic: mnemonic
      });
    } catch (error) {
      setWalletState({
        state: WalletGenerationState.FAILED,
        error: new Error(error)
      })
    }
  }, [])

  useEffect(() => {
    generateWallet(DEFAULT_MNEMONIC);
  }, [])


  return <WalletContext.Provider value={{
    walletState: walletState,
    generateWallet
  }}>
    {children}
  </WalletContext.Provider>
}

export function useWalletContext(): WalletContextState {
  return useContext(WalletContext);
}
