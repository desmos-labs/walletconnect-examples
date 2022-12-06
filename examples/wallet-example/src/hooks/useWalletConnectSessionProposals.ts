import {useWalletConnect} from "../context/walletconnect";


export default function () {
  const {sessionProposals, approveSession, rejectSession} = useWalletConnect();

  return {
    sessionProposals,
    approveSession,
    rejectSession
  }
}
