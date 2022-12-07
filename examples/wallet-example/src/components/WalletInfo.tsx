import React, {useEffect, useState} from "react";
import {useWalletContext, SignerStatus} from "../context/SignerContext";
import {TextField} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";


export const WalletInfo: React.FC = () => {
  const {signerState} = useWalletContext()
  const [address, setAddress] = useState<string>();

  // Effect to update the wallet address.
  useEffect(() => {
    (async () => {
      if (signerState?.status === SignerStatus.Connected) {
        const accounts = await signerState.signer.getAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0].address)
        }
      } else {
        setAddress("");
      }
    })()
  }, [signerState])

  return <Grid2 container direction={"column"} alignItems={"center"}>
    <Grid2 xs={12}>
      <TextField
        fullWidth
        multiline
        value={address}
        disabled={true}
        label={"Address"}
      />
    </Grid2>
  </Grid2>
}
