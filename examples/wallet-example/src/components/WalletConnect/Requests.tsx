import React, {useCallback, useMemo, useState} from "react";
import {useWalletConnect} from "../../context/WalletConnectContext";
import {SignClientTypes} from "@walletconnect/types";
import {Card, CardContent, CardHeader, Collapse, IconButton, ListItem, ListItemText,} from "@mui/material";
import List from '@mui/material/List';
import ClearIcon from '@mui/icons-material/Clear';
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import DoneIcon from "@mui/icons-material/Done";
import {getSdkError} from "@walletconnect/utils";
import {useWalletContext, SignerStatus} from "../../context/SignerContext";
import {
  decodeDirectSignRpcRequestParams,
  decodeAminoSignRpcRequestParams,
  encodeDirectSignRpcResponse, encodeAminoSignRpcResponse
} from "@desmoslabs/desmjs-walletconnect-v2"

export interface Props {
  sessionRequest: SignClientTypes.EventArguments["session_request"]
  onApprove: (session: SignClientTypes.EventArguments["session_request"]) => any,
  onReject: (session: SignClientTypes.EventArguments["session_request"]) => any,
}

const WalletConnectSessionRequest: React.FC<Props> = ({sessionRequest, onApprove, onReject}) => {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(!open);
  };

  const requestInfo = useMemo(() => {
    const items: string[] = [];

    items.push(`Chain id: ${sessionRequest.params.chainId}`)
    items.push(`Method: ${sessionRequest.params.request.method}`)
    items.push(`Params: ${JSON.stringify(sessionRequest.params.request.params)}`)

    return items.map((item, key) => {
      return <ListItem sx={{pl: 4}} key={key}>
        <ListItemText primary={item}/>
      </ListItem>
    });
  }, [sessionRequest]);

  const onApproveClik = useCallback(() => {
    onApprove(sessionRequest)
  }, [sessionRequest, onApprove])

  const onRejectClick = useCallback(() => {
    onReject(sessionRequest)
  }, [sessionRequest, onReject])

  return <>
    <ListItem>
      <ListItemText
        primary={sessionRequest.topic}
        secondary={sessionRequest.id}
      />
      <IconButton onClick={onApproveClik}>
        <DoneIcon/>
      </IconButton>
      <IconButton onClick={onRejectClick}>
        <ClearIcon/>
      </IconButton>
      <IconButton onClick={handleClick}>
        {open ? <ExpandLess/> : <ExpandMore/>}
      </IconButton>
    </ListItem>
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {requestInfo}
      </List>
    </Collapse>
  </>
}


export const WalletConnectSessionRequests: React.FC = () => {
  const {sessionRequests, respondToSessionRequest} = useWalletConnect();
  const {signerState} = useWalletContext();

  const onApprove = useCallback(async (sessionRequest: SignClientTypes.EventArguments["session_request"]) => {
    if (signerState.status === SignerStatus.Connected) {
      const signer = signerState.signer;
      const {params, method} = sessionRequest.params.request;

      switch (method) {
        case "cosmos_signDirect": {
          const decodeResult = decodeDirectSignRpcRequestParams(params);
          if (decodeResult.isError()) {
            respondToSessionRequest(sessionRequest, {
              error: {
                code: 9000,
                message: decodeResult.error,
              }
            })
          }

          const {signerAddress, signDoc} = decodeResult.value;
          try {
            const signature = await signer.signDirect(signerAddress, signDoc);
            respondToSessionRequest(sessionRequest, {
              result: encodeDirectSignRpcResponse(signature)
            })
          } catch (e) {
            respondToSessionRequest(sessionRequest, {
              error: {
                message: "Signature error",
                code: 9001,
                data: e.toString()
              }
            });
          }
        }
          break;

        case "cosmos_signAmino": {
          const decodeResult = decodeAminoSignRpcRequestParams(params);
          if (decodeResult.isError()) {
            respondToSessionRequest(sessionRequest, {
              error: {
                code: 9000,
                message: decodeResult.error,
              }
            })
          }

          const {signerAddress, signDoc} = decodeResult.value;
          try {
            const signature = await signer.signAmino(signerAddress, signDoc);
            respondToSessionRequest(sessionRequest, {
              result: encodeAminoSignRpcResponse(signature)
            })
          } catch (e) {
            respondToSessionRequest(sessionRequest, {
              error: {
                message: "Signature error",
                code: 9001,
                data: e.toString()
              }
            });
          }
        }
          break;
      }
    } else {
      respondToSessionRequest(sessionRequest, {
        error: getSdkError("UNSUPPORTED_METHODS")
      })
    }
  }, [respondToSessionRequest, signerState]);

  const onReject = useCallback((sessionRequest: SignClientTypes.EventArguments["session_request"]) => {
    respondToSessionRequest(sessionRequest, {
      error: getSdkError("USER_REJECTED")
    })
  }, [respondToSessionRequest])

  return <Card>
    <CardHeader
      title={"Requests"}
    />
    <CardContent>
      <List>
        {sessionRequests.map((session, key) =>
          <WalletConnectSessionRequest
            key={key}
            sessionRequest={session}
            onApprove={onApprove}
            onReject={onReject}
          />)}
      </List>
    </CardContent>
  </Card>
}
