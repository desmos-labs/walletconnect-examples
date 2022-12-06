import React, {useCallback, useState} from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {Button, TextField} from "@mui/material";
import useWalletConnectPair from "../../hooks/useWalletConnectPair";

export const WalletConnectPair: React.FC = () => {
  const [sessionUri, setSessionUri] = useState("");
  const walletConnectPair = useWalletConnectPair();

  const onUriChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setSessionUri(event.target.value);
  }, [])
  const onPair = useCallback(async () => {
    try {
      await walletConnectPair(sessionUri);
    } catch (e) {
      console.error("walletconnect pair", e);
    } finally {
      setSessionUri("");
    }
  }, [sessionUri, walletConnectPair]);


  return <Grid2 container direction={"row"} columns={5} alignItems={"center"}>
      <Grid2 xs={4}>
        <TextField
          fullWidth
          value={sessionUri}
          onChange={onUriChange}
        />
      </Grid2>
      <Grid2 xs={1}>
        <Button onClick={onPair}>Pair</Button>
      </Grid2>
    </Grid2>
}
