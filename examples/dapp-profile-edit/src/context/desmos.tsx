import {DesmosClient, Signer, SignerStatus} from "@desmoslabs/desmjs"
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";

/**
 * Interface that represents the global desmos state.
 */
interface DesmosState {
  client?: DesmosClient
  signer?: Signer,
  connectError?: Error
  signerStatus: SignerStatus
  setSigner: (signer: Signer) => void,
}

// @ts-ignore
const initialState: DesmosState = {
  signerStatus: SignerStatus.NotConnected
}
const DesmosContent = createContext<DesmosState>(initialState);

interface Props {
  chainEndpoint: string,
  children?: React.ReactNode
}

export const DesmosContextProvider: React.FC<Props> = ({chainEndpoint, children}) =>  {

  const [client, setDesmosClient] = useState<DesmosClient | undefined>();
  const [signer, updateSigner] = useState<Signer | undefined>();
  const [connectError, setConnectError] = useState<Error | undefined>();
  const [signerStatus, setSignerStatus] = useState(initialState.signerStatus);

  // Effect to connect to the provided chain endpoint
  useEffect(() => {
    (async () => {
      try {
        setConnectError(undefined)
        const client = await DesmosClient.connect(chainEndpoint);
        if (signer !== undefined) {
          client.setSigner(signer);
        }
        setDesmosClient(client)
      } catch (e) {
        setDesmosClient(undefined);
        setConnectError(e)
      }
    })()
    // eslint-disable-next-line
  }, [chainEndpoint]);

  // Function to update the current signer
  const setSigner = useCallback((signer: Signer) => {
    if (client !== undefined) {
      client.setSigner(signer);
      updateSigner(signer);
      setSignerStatus(signer.status);
      signer.addStatusListener(setSignerStatus)
    }
  }, [client]);

  // Hook to clean up the status listener after a user change the signer
  useEffect(() => {
    return () => {
      if (signer !== undefined) {
        signer.removeStatusListener(setSignerStatus);
      }
    }
  }, [signer])

  return <DesmosContent.Provider value={{
    client,
    connectError,
    signer,
    signerStatus,
    setSigner
  }}>
    {client !== undefined ? children : null}
  </DesmosContent.Provider>
}

export function useDesmosContext(): DesmosState {
  return useContext(DesmosContent);
}
