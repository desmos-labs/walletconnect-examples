import {SessionTypes, SignClientTypes} from "@walletconnect/types";
import {useWalletConnect} from "../context/walletconnect";
import {useCallback, useEffect, useState} from "react";
import {ErrorResponse} from "@walletconnect/jsonrpc-types";

type SessionProposal = SignClientTypes.EventArguments["session_proposal"];

export default function () {
  const {client} = useWalletConnect();
  const [sessionProposals, setSessionProposals] = useState<SessionProposal[]>([]);
  const approveSession = useCallback(async (sessionProposal: SessionProposal, namespaces: SessionTypes.Namespaces) => {
    if (client !== undefined) {
      try {
        await client.approve({
          id: sessionProposal.id,
          namespaces
        });
        setSessionProposals(old => {
          return old.filter(proposal => proposal.id !== sessionProposal.id);
        });
      } catch (e) {
        console.error("approve walletconnect session", e)
      }
    }
  }, [client]);
  const rejectSession = useCallback(async (sessionProposal: SessionProposal, reason: ErrorResponse) => {
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


  useEffect(() => {
    if (client !== undefined) {
      const listener = (proposal: SessionProposal) => {
        setSessionProposals(old => {
          return [proposal, ...old];
        })
      };

      client.on("session_proposal", listener);
      return () => {
        client.removeListener("session_proposal", listener)
      }
    } else {
      return undefined;
    }
  }, [client]);

  return {
    sessionProposals,
    approveSession,
    rejectSession
  }
}
