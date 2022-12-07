import React, {useCallback, useMemo, useState} from "react";
import {useWalletConnect} from "../../context/WalletConnectContext";
import {SessionTypes} from "@walletconnect/types";
import {
  Card,
  CardContent,
  CardHeader, Collapse,
  IconButton, ListItem,
  ListItemText,
} from "@mui/material";
import List from '@mui/material/List';
import ClearIcon from '@mui/icons-material/Clear';
import {ExpandLess, ExpandMore} from "@mui/icons-material";

export interface Props {
  sessionProposal: SessionTypes.Struct
  onClose: (session: SessionTypes.Struct) => any,
}

const WalletConnectSession: React.FC<Props> = ({sessionProposal, onClose}) => {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(!open);
  };

  const accountsItems = useMemo(() => {
    const items: string[] = [];

    for (let namespace of Object.keys(sessionProposal.namespaces)) {
      const namespaceObj = sessionProposal.namespaces[namespace];
      items.push(`${namespace} accounts: ${namespaceObj.accounts.join(",")}`)
      items.push(`${namespace} methods: ${namespaceObj.methods.join(",")}`)
      items.push(`${namespace} events: ${namespaceObj.events.join(",")}`)
    }

    return items.map((account, key) => {
      return <ListItem sx={{pl: 4}} key={key}>
        <ListItemText primary={account}/>
      </ListItem>
    });
  }, [sessionProposal.namespaces]);

  const onCloseClick = useCallback(() => {
    onClose(sessionProposal)
  }, [sessionProposal, onClose])


  return <>
    <ListItem>
      <ListItemText
        primary={sessionProposal.peer.metadata.name}
        secondary={sessionProposal.peer.metadata.description}
      />
      <IconButton onClick={onCloseClick}>
        <ClearIcon/>
      </IconButton>
      <IconButton onClick={handleClick}>
        {open ? <ExpandLess/> : <ExpandMore/>}
      </IconButton>
    </ListItem>
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {accountsItems}
      </List>
    </Collapse>
  </>
}


export const WalletConnectActiveSessions: React.FC = () => {
  const {sessions, closeSession} = useWalletConnect()

  return <Card>
    <CardHeader
      title={"Active Sessions"}
    />
    <CardContent>
      <List>
        {sessions.map((session, key) =>
          <WalletConnectSession
            key={key}
            sessionProposal={session}
            onClose={closeSession}
          />)}
      </List>
    </CardContent>
  </Card>
}
