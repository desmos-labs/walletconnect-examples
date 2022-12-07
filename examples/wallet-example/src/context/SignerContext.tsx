import {OfflineSignerAdapter, Signer, SigningMode} from "@desmoslabs/desmjs";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";

export enum SignerStatus {
  NotConnected,
  Connecting,
  Connected,
  Error,
}

export interface SignerStateNotConnected {
  status: SignerStatus.NotConnected,
}

export interface SignerStateConnected {
  status: SignerStatus.Connected,
  signer: Signer,
  mnemonic: string,
}

export interface SignerStateConnecting {
  status: SignerStatus.Connecting
}

export interface SignerStateError {
  status: SignerStatus.Error
  error: Error
}

export type SignerState = SignerStateNotConnected | SignerStateConnecting | SignerStateConnected | SignerStateError;

interface SignerContext {
  signerState: SignerState,
  connectWallet: (mnemonic: string) => void,
  disconnectWallet: () => void,
}

// @ts-ignore
const initialState: SignerContext = {
  signerState: {
    status: SignerStatus.NotConnected,
  }
}

const signerContext = createContext<SignerContext>(initialState);

interface Props {
  children?: React.ReactNode
}

export const SignerContextProvider: React.FC<Props> = ({children}) =>  {
  const [signerState, setSignerState] = useState<SignerState>(initialState.signerState)

  const connectWallet = useCallback(async (mnemonic: string) => {
    try {
      setSignerState({
        status: SignerStatus.Connecting
      });
      const newSigner = await OfflineSignerAdapter.fromMnemonic(SigningMode.DIRECT, mnemonic);
      setSignerState({
        status: SignerStatus.Connected,
        signer: newSigner,
        mnemonic: mnemonic
      });
    } catch (error) {
      setSignerState({
        status: SignerStatus.Error,
        error: new Error(error)
      })
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setSignerState({
      status: SignerStatus.NotConnected
    })
  }, [])

  // Connect to the default mnemonic
  useEffect(() => {
    connectWallet(process.env.REACT_APP_DEFAULT_MNEMONIC ?? "");
    // eslint-disable-next-line
  }, [])


  return <signerContext.Provider value={{
    signerState,
    connectWallet,
    disconnectWallet,
  }}>
    {children}
  </signerContext.Provider>
}

export function useWalletContext(): SignerContext {
  return useContext(signerContext);
}
