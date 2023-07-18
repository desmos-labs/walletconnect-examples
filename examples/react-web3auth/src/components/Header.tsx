import React, {useCallback, useEffect, useState} from "react";
import {AppBar, Button, Toolbar, Typography,} from "@mui/material";
import {useSignerContext} from "../context/signercontext";
import useSignerStatus from "../hooks/useSignerStatus";
import {SignerStatus} from "@desmoslabs/desmjs";

export default function Header(): JSX.Element {
  const {connect, disconnect, signer} = useSignerContext();
  const signerStatus = useSignerStatus();
  const [address, setAddress] = useState("");

  const onClick = useCallback(() => {
    if (signerStatus === SignerStatus.Connected) {
      disconnect();
    } else if (signerStatus === SignerStatus.NotConnected) {
      connect();
    }
  }, [connect, disconnect, signerStatus]);

  useEffect(() => {
    if (signer !== undefined && signerStatus === SignerStatus.Connected) {
      signer.getAccounts().then(accounts => {
        setAddress(accounts[0].address);
      })
    } else {
      setAddress("");
    }
  }, [signerStatus, signer])

  const connectDisabled = signerStatus !== SignerStatus.Connected && signerStatus !== SignerStatus.NotConnected;

  return <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" sx={{mr: 2}}>
        Profile Manager
      </Typography>
      <Typography
        variant="caption"
        component="div"
        sx={{flexGrow: 1, textAlign: "end"}}
      >
        {address}
      </Typography>
      <Button color="inherit" onClick={onClick} disabled={connectDisabled}>
        {signerStatus === SignerStatus.Connected ? "Disconnect" : "Connect"}
      </Button>
    </Toolbar>
  </AppBar>
}
