import React, {useCallback, useEffect, useState} from "react";
import {AppBar, Button, makeStyles, Toolbar, Typography,} from "@material-ui/core";
import {useDesmosContext} from "../context/desmos";
import {useWalletConnectContext} from "../context/walletconnect";
import {SignerStatus} from "@desmoslabs/desmjs";
import useSignerStatus from "../hooks/useSignerStatus";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
    },
    address: {
        fontSize: "small",
        marginRight: theme.spacing(5),
    },
    chainSelector: {
        marginLeft: theme.spacing(5),
    }
}));

export default function Header(): JSX.Element {
    const classes = useStyles();
    const [address, setAddress] = useState("")
    const {connect, disconnect, signer} = useDesmosContext();
    const {signClient} = useWalletConnectContext();
    const signerStatus = useSignerStatus();

    const onClick = useCallback(() => {
        if (signerStatus === SignerStatus.NotConnected) {
            connect()
        } else if (signerStatus === SignerStatus.Connected) {
            disconnect();
        }
    }, [signerStatus, connect, disconnect]);

    useEffect(() => {
        if (signer !== undefined && signerStatus === SignerStatus.Connected) {
            signer.getAccounts().then(accounts => {
                setAddress(accounts[0].address);
            })
        } else {
            setAddress("");
        }
    }, [signerStatus])

    const connectDisabled = signClient === undefined ||
      (signerStatus !== SignerStatus.Connected && signerStatus !== SignerStatus.NotConnected);

    return <div className={classes.root}>
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Profile Manager
                </Typography>
                <Typography variant="h6" hidden={signerStatus !== SignerStatus.Connected} className={classes.address}>
                    {address}
                </Typography>
                <Button color="inherit" onClick={onClick} disabled={connectDisabled}>
                    {signerStatus === SignerStatus.Connected ? "Disconnect" : "Connect"}
                </Button>
            </Toolbar>
        </AppBar>
    </div>
}
