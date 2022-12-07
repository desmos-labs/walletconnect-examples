import React from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {WalletConnectPair} from "./WalletConnect/Pair";
import {WalletConnectActiveSessions} from "./WalletConnect/ActiveSessions";
import {WalletConnectSessionProposals} from "./WalletConnect/SessionProposals";
import {useWalletContext, SignerStatus} from "../context/SignerContext";
import {WalletConnectSessionRequests} from "./WalletConnect/Requests";


export const WalletConnectInfo: React.FC = () => {
  const {signerState} = useWalletContext();

  return <Grid2
    container
    direction="column"
    id="WalletConnectInfo"
  >
    <Grid2>
      <WalletConnectActiveSessions/>
    </Grid2>
    <Grid2>
      <WalletConnectSessionProposals/>
    </Grid2>
    <Grid2>
      <WalletConnectSessionRequests/>
    </Grid2>
    <Grid2 hidden={signerState.status !== SignerStatus.Connected}>
      <WalletConnectPair/>
    </Grid2>
  </Grid2>
}
