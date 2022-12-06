import React, {useCallback, useMemo, useState} from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import useWalletConnectPair from "../hooks/useWalletConnectPair";
import useWalletConnectOnSessionProposal from "../hooks/useWalletConnectSessionProposals";
import {Button, TextField} from "@mui/material";
import {SessionProposal, WalletConnectSession} from "./WalletConnectSession";
import {useWalletContext, WalletStatus, WalletStateConnected} from "../context/walletcontext";
import {SigningMode} from "@desmoslabs/desmjs";

interface Props {

}

export const WalletConnectInfo: React.FC<Props> = (props) => {
  const {walletState} = useWalletContext()
  const [sessionUri, setSessionUri] = useState("");
  const walletConnectPair = useWalletConnectPair();
  const {sessionProposals, approveSession, rejectSession} = useWalletConnectOnSessionProposal();
  const onUriChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setSessionUri(event.target.value);
  }, [])
  const onPair = useCallback(async () => {
    try {
      const result = await walletConnectPair(sessionUri);
      console.log("walletconnect pair", result);
    } catch (e) {
      console.error("walletconnect pair", e);
    } finally {
      setSessionUri("");
    }
  }, [sessionUri, walletConnectPair]);
  const approveSessionProposal = useCallback(async (session: SessionProposal) => {
    const desmosNamespace = session.params.requiredNamespaces['desmos'];
    if (desmosNamespace === undefined) {
      rejectSession(session, {
        code: 2,
        message: "Can't find desmos namespace"
      })
      return;
    }

    if (walletState?.status !== WalletStatus.CONNECTED) {
      rejectSession(session, {
        code: 2,
        message: "Signer not ready"
      })
    }


    // Check if the wallet supports the requested methods
    const walletMethods = ["cosmos_getAccounts"];
    const signer = (walletState as WalletStateConnected).signer;
    if (signer.signingMode === SigningMode.AMINO) {
      walletMethods.push("cosmos_signAmino");
    } else if (signer.signingMode === SigningMode.DIRECT) {
      walletMethods.push("cosmos_signDirect");
    } else {
      console.error("Unknown sign mode", signer.signingMode);
    }
    const methodsNotSupported = desmosNamespace.methods.filter((method) => walletMethods.indexOf(method) === -1);

    if (methodsNotSupported.length > 0) {
      rejectSession(session, {
        code: 6001,
        message: "unsupported methods: " + methodsNotSupported.join(","),
      })
    }

    const signerAccounts = await signer.getAccounts();
    const resultAccounts = [];
    for (let chain of desmosNamespace.chains) {
      for (let account of signerAccounts) {
        resultAccounts.push(`${chain}:${account.address}`)
      }
    }

    approveSession(session, {
      desmos: {
        methods: walletMethods,
        accounts: resultAccounts,
        events: [],
      }
    });
  }, [approveSession, rejectSession, walletState]);
  const rejectSessionProposal = useCallback((session: SessionProposal) => {
    rejectSession(session, {
      code: 1,
      message: "Rejected from the user",
    });
  }, [rejectSession]);
  const sessionProposalElements = useMemo(() => {
    return sessionProposals.map((proposal, index) => {
      return <WalletConnectSession
        key={index.toString()} proposal={proposal}
        onAcceptPressed={approveSessionProposal}
        onRejectPressed={rejectSessionProposal}
      />
    })
  }, [sessionProposals, approveSessionProposal, rejectSessionProposal]);

  return <Grid2 container direction={"column"}>
    <Grid2 container direction={"row"} columns={5}>
      <Grid2 xs={4}>
        <TextField fullWidth value={sessionUri} onChange={onUriChange}></TextField>
      </Grid2>
      <Grid2 xs={1}>
        <Button onClick={onPair}>Pair</Button>
      </Grid2>
    </Grid2>
    <Grid2>
      {sessionProposalElements}
    </Grid2>
  </Grid2>
}
