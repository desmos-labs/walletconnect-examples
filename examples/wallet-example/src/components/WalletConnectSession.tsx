import {SignClientTypes} from "@walletconnect/types";
import React, {useCallback} from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {Button} from "@mui/material";

export type SessionProposal = SignClientTypes.EventArguments["session_proposal"];

export interface Props {
  proposal: SessionProposal,
  onAcceptPressed: (proposal: SessionProposal) => any,
  onRejectPressed: (proposal: SessionProposal) => any,
}

export const WalletConnectSession: React.FC<Props> = ({proposal, onAcceptPressed, onRejectPressed}) => {
  const onAccept = useCallback(() => {
    onAcceptPressed(proposal);
  }, [onAcceptPressed, proposal])

  const onReject = useCallback(() => {
    onRejectPressed(proposal);
  }, [onRejectPressed, proposal])

  return <Grid2 container direction={"column"}>
    <h4>Id: {proposal.id}</h4>
    <h4>{JSON.stringify(proposal.params.requiredNamespaces)}</h4>
    <Grid2 container direction={"row"} columns={2}>
      <Grid2 xs={1}>
        <Button onClick={onAccept}>Accept</Button>
      </Grid2>
      <Grid2 xs={1}>
        <Button onClick={onReject}>Reject</Button>
      </Grid2>
    </Grid2>
  </Grid2>
}
