import React from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {WalletConnectPair} from "./WalletConnect/Pair";
import {WalletConnectActiveSessions} from "./WalletConnect/ActiveSessions";
import {WalletConnectSessionProposals} from "./WalletConnect/SessionProposals";
import {useWalletContext, WalletStatus} from "../context/walletcontext";

interface Props {

}

export const WalletConnectInfo: React.FC<Props> = (props) => {
  const {walletState} = useWalletContext();

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
    <Grid2 hidden={walletState.status !== WalletStatus.CONNECTED}>
      <WalletConnectPair/>
    </Grid2>
  </Grid2>
}
