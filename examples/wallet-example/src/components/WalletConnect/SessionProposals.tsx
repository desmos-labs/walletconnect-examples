import React, {useCallback, useMemo, useState} from "react";
import {useWalletConnect} from "../../context/WalletConnectContext";
import {ProposalTypes} from "@walletconnect/types";
import {
  Card,
  CardContent,
  CardHeader, Collapse,
  IconButton, ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import List from '@mui/material/List';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import {useWalletContext, SignerStateConnected, SignerStatus} from "../../context/SignerContext";
import {getSdkError} from "@walletconnect/utils";
import {SigningMode} from "@desmoslabs/desmjs";

export interface Props {
  sessionProposal: ProposalTypes.Struct
  approve: (session: ProposalTypes.Struct) => any
  reject: (session: ProposalTypes.Struct) => any,
}

const WalletConnectSessionProposal: React.FC<Props> = ({sessionProposal, approve, reject}) => {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(!open);
  };

  const onApprove = useCallback(() => {
    approve(sessionProposal);
  }, [sessionProposal, approve]);

  const onReject = useCallback(() => {
    reject(sessionProposal);
  }, [sessionProposal, reject]);

  const chains = useMemo(() => {
    const fields: string[] = [];

    for (let namespace of Object.keys(sessionProposal.requiredNamespaces)) {
      const namespaceObj = sessionProposal.requiredNamespaces[namespace];
      fields.push(`Chains: ${namespaceObj.chains.join(",")}`)
      fields.push(`Methods: ${namespaceObj.methods.join(",")}`)
      fields.push(`Events: ${namespaceObj.events.join(",")}`)
    }

    return fields.map((chain, key) => {
      return <ListItem sx={{pl: 4}} key={key}>
        <ListItemIcon>
          <AccountCircleIcon/>
        </ListItemIcon>
        <ListItemText primary={chain}/>
      </ListItem>
    });
  }, [sessionProposal.requiredNamespaces]);

  return <>
    <ListItem>
      <ListItemText
        primary={sessionProposal.proposer.metadata.name}
        secondary={sessionProposal.proposer.metadata.description}
      />
      <IconButton onClick={onApprove}>
        <DoneIcon/>
      </IconButton>
      <IconButton onClick={onReject}>
        <ClearIcon/>
      </IconButton>
      <IconButton onClick={handleClick}>
        {open ? <ExpandLess /> : <ExpandMore />}
      </IconButton>
    </ListItem>
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {chains}
      </List>
    </Collapse>
  </>
}


export const WalletConnectSessionProposals: React.FC = () => {
  const {sessionProposals, rejectSession, approveSession} = useWalletConnect()
  const {signerState} = useWalletContext()

  const onApproveSession = useCallback(async (sessionProposal: ProposalTypes.Struct) => {
    const desmosNamespace = sessionProposal.requiredNamespaces['desmos'];
    if (desmosNamespace === undefined) {
      rejectSession(sessionProposal, getSdkError("UNSUPPORTED_NAMESPACE_KEY"))
      return;
    }

    if (signerState?.status !== SignerStatus.Connected) {
      rejectSession(sessionProposal, getSdkError("UNSUPPORTED_METHODS"))
    }

    // Check if the wallet supports the requested methods
    const walletMethods = ["cosmos_getAccounts"];
    const signer = (signerState as SignerStateConnected).signer;
    if (signer.signingMode === SigningMode.AMINO) {
      walletMethods.push("cosmos_signAmino");
    } else if (signer.signingMode === SigningMode.DIRECT) {
      walletMethods.push("cosmos_signDirect");
    } else {
      console.error("Unknown sign mode", signer.signingMode);
    }
    const methodsNotSupported = desmosNamespace.methods.filter((method) => walletMethods.indexOf(method) === -1);

    if (methodsNotSupported.length > 0) {
      rejectSession(sessionProposal, getSdkError("UNSUPPORTED_METHODS"))
    }

    const signerAccounts = await signer.getAccounts();
    const resultAccounts = [];
    for (let chain of desmosNamespace.chains) {
      for (let account of signerAccounts) {
        resultAccounts.push(`${chain}:${account.address}`)
      }
    }

    approveSession(sessionProposal, {
      desmos: {
        methods: walletMethods,
        accounts: resultAccounts,
        events: [],
      }
    });
  }, [approveSession, rejectSession, signerState]);

  const onRejectSession = useCallback((sessionProposal: ProposalTypes.Struct) => {
    rejectSession(sessionProposal, getSdkError("USER_REJECTED"));
  }, [rejectSession]);

  return <Card>
    <CardHeader
      title={"Session Proposals"}
    />
    <CardContent>
      <List>
        {sessionProposals.map((sessionProposal, key) =>
          <WalletConnectSessionProposal
            key={key}
            sessionProposal={sessionProposal}
            approve={onApproveSession}
            reject={onRejectSession}
          />)}
      </List>
    </CardContent>
  </Card>
}
