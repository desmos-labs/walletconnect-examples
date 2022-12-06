import {useWalletConnect} from "../context/walletconnect";
import {useCallback} from "react";
import {getSdkError} from "@walletconnect/utils";


export default function () {
  const {sessionProposals, sessions, rejectSession, closeSession} = useWalletConnect();

  return useCallback(() => {
      sessionProposals.forEach(sessionProposal => {
        rejectSession(sessionProposal, getSdkError("USER_REJECTED"))
      })
      sessions.forEach(closeSession);

  }, [sessions, sessionProposals, rejectSession, closeSession])
}
