import SignClient from "@walletconnect/sign-client";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useWalletContext, WalletStatus} from "./walletcontext";
import {SessionTypes, SignClientTypes} from "@walletconnect/types";
import {toBase64} from "@cosmjs/encoding"
import {getSdkError} from "@walletconnect/utils";
import {ProposalTypes} from "@walletconnect/types/dist/types/sign-client/proposal";
import {ErrorResponse} from "@walletconnect/jsonrpc-types";


interface WalletConnectState {
  client?: SignClient
  sessions: SessionTypes.Struct[],
  sessionProposals: ProposalTypes.Struct[],
  approveSession: (sessionProposal: ProposalTypes.Struct, namespaces: SessionTypes.Namespaces) => void,
  rejectSession: (sessionProposal: ProposalTypes.Struct, reason: ErrorResponse) => void,
  closeSession: (session: SessionTypes.Struct) => void
}

// @ts-ignore
const defaultState: WalletConnectState = {}
const walletConnectContext = createContext<WalletConnectState>(defaultState)

interface Props {
  children?: React.ReactNode
}

export const WalletConnectProvider: React.FC<Props> = ({children}) => {
  const [client, setClient] = useState<SignClient>();
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [sessionProposals, setSessionProposals] = useState<ProposalTypes.Struct[]>([]);
  const {walletState} = useWalletContext();

  // Init client
  useEffect(() => {
    (async () => {
      try {
        setSessions([]);
        setSessionProposals([]);
        console.log("Initializing WalletConnect client");
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
        setSessions(client.session.values);
        setSessionProposals(client.proposal.values)
        console.log("Client initialized");
      } catch (e) {
        console.error("WallettConnectContext", e);
      }
    })()
  }, [])

  // Effect to add a listener to the session_proposal event
  useEffect(() => {
    if (client !== undefined) {
      const listener = (_: any) => {
        setSessionProposals(client.proposal.values);
      };

      client.on("session_proposal", listener);
      return () => {
        client.removeListener("session_proposal", listener)
      }
    } else {
      return undefined;
    }
  }, [client])

  // Effect to add a listener to the session_request event
  useEffect(() => {
    if (client !== undefined) {
      const listener = async (params: SignClientTypes.EventArguments["session_request"]) => {
        if (walletState?.status === WalletStatus.CONNECTED) {
          const signer = walletState.signer;
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
        } else {
          client.respond({
            topic: params.topic,
            response: {
              id: params.id,
              jsonrpc: "2.0",
              error: getSdkError("UNAUTHORIZED_METHOD"),
            }
          })
        }
      }
      client.on("session_request", listener);

      return () => {
        client.off("session_request", listener);
      }
    }

    return undefined;
  }, [walletState, client])

  const closeSession = useCallback((session: SessionTypes.Struct) => {
    console.log("Close session", session);
    client?.disconnect({
      topic: session.topic,
      reason: getSdkError("USER_DISCONNECTED")
    })
    setSessions(old => {
      return old.filter(s => session.topic !== s.topic);
    })
  }, [client]);

  const approveSession = useCallback(async (sessionProposal: ProposalTypes.Struct, namespaces: SessionTypes.Namespaces) => {
    if (client !== undefined) {
      try {
        await client.approve({
          id: sessionProposal.id,
          namespaces
        });
        // Remove the new approved session proposal
        setSessionProposals(old => {
          return old.filter(proposal => proposal.id !== sessionProposal.id);
        });
        // Update the current sessions
        setSessions(client.session.values);
      } catch (e) {
        console.error("approve walletconnect session", e)
      }
    }
  }, [client]);

  const rejectSession = useCallback(async (sessionProposal: ProposalTypes.Struct, reason: ErrorResponse) => {
    if (client !== undefined) {
      try {
        await client.reject({
          id: sessionProposal.id,
          reason
        });
        setSessionProposals(old => {
          return old.filter(proposal => proposal.id !== sessionProposal.id);
        });
      } catch (e) {
        console.error("approve walletconnect session", e)
      }
    }
  }, [client]);

  return <walletConnectContext.Provider value={{
    client,
    sessions,
    sessionProposals,
    approveSession,
    rejectSession,
    closeSession
  }}>
    {children}
  </walletConnectContext.Provider>
}

export function useWalletConnect() {
  return useContext(walletConnectContext);
}
