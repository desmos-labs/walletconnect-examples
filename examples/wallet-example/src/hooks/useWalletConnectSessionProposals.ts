import {useWalletConnect} from "../context/WalletConnectContext";


export default function () {
  const {sessionProposals, approveSession, rejectSession} = useWalletConnect();

  return {
    sessionProposals,
    approveSession,
    rejectSession
  }
}
