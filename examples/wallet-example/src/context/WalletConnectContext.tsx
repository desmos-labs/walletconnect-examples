import SignClient from "@walletconnect/sign-client";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useWalletContext, SignerStatus} from "./SignerContext";
import {SessionTypes, SignClientTypes} from "@walletconnect/types";
import {getSdkError} from "@walletconnect/utils";
import {ProposalTypes} from "@walletconnect/types/dist/types/sign-client/proposal";
import {ErrorResponse} from "@walletconnect/jsonrpc-types";
import {encodeGetAccountsRpcResponse} from "@desmoslabs/desmjs-walletconnect-v2";


interface SessionRequestResponseOk {
  result: any
}

interface SessionRequestResponseError {
  error: ErrorResponse
}

export type SessionRequestResponse = SessionRequestResponseOk | SessionRequestResponseError;

interface WalletConnectContext {
  client?: SignClient
  sessions: SessionTypes.Struct[],
  sessionProposals: ProposalTypes.Struct[],
  sessionRequests: SignClientTypes.EventArguments["session_request"][],
  approveSession: (sessionProposal: ProposalTypes.Struct, namespaces: SessionTypes.Namespaces) => void,
  rejectSession: (sessionProposal: ProposalTypes.Struct, reason: ErrorResponse) => void,
  closeSession: (session: SessionTypes.Struct) => void
  respondToSessionRequest: (sessionRequest: SignClientTypes.EventArguments["session_request"], response: SessionRequestResponse) => void,
}


// @ts-ignore
const defaultState: WalletConnectContext = {}
const walletConnectContext = createContext<WalletConnectContext>(defaultState)

interface Props {
  children?: React.ReactNode
}

export const WalletConnectProvider: React.FC<Props> = ({children}) => {
  const [client, setClient] = useState<SignClient>();
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [sessionProposals, setSessionProposals] = useState<ProposalTypes.Struct[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SignClientTypes.EventArguments["session_request"][]>([]);
  const {signerState} = useWalletContext();

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
        console.log("Client sessions", client.session.values);
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
      const listener = async (sessionRequest: SignClientTypes.EventArguments["session_request"]) => {
        if (signerState?.status === SignerStatus.Connected) {
          const signer = signerState.signer;
          switch (sessionRequest.params.request.method) {
            case "cosmos_getAccounts":
              const accounts = await signer.getAccounts();
              client.respond({
                topic: sessionRequest.topic,
                response: {
                  id: sessionRequest.id,
                  jsonrpc: "2.0",
                  result: encodeGetAccountsRpcResponse(accounts),
                }
              })
              break;
            default:
              // Add to the requests list
              setSessionRequests(old => [...old, sessionRequest])
              break;
          }
        } else {
          client.respond({
            topic: sessionRequest.topic,
            response: {
              id: sessionRequest.id,
              jsonrpc: "2.0",
              error: getSdkError("UNAUTHORIZED_METHOD"),
            }
          })
        }
      }
      client.on("session_request", listener);

      const sessionDeleteListener = (event: SignClientTypes.EventArguments["session_delete"]) => {
        console.log("Session delete", event);
        setSessions(client.session.values);
      }
      client.on("session_delete", sessionDeleteListener);

      return () => {
        client.off("session_request", listener);
        client.off("session_delete", sessionDeleteListener);
      }
    }

    return undefined;
  }, [signerState, client])

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

  const respondToSessionRequest = useCallback((sessionRequest: SignClientTypes.EventArguments["session_request"], response: SessionRequestResponse) => {
    if (client !== undefined) {
      client.respond({
        topic: sessionRequest.topic,
        response: {
          id: sessionRequest.id,
          jsonrpc: "2.0",
          ...response
        }
      });
      setSessionRequests(old => {
        return old.filter(request => request.id !== sessionRequest.id)
      })
    }
  }, [client])

  return <walletConnectContext.Provider value={{
    client,
    sessions,
    sessionProposals,
    sessionRequests,
    approveSession,
    rejectSession,
    closeSession,
    respondToSessionRequest
  }}>
    {children}
  </walletConnectContext.Provider>
}

export function useWalletConnect() {
  return useContext(walletConnectContext);
}
