import React, {useCallback} from "react";
import {AppBar, Button, makeStyles, Toolbar, Typography,} from "@material-ui/core";
import {useDesmosContext} from "../context/desmos";
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
    const addresses = "....";
    const {connect, disconnect} = useDesmosContext();
    const signerStatus = useSignerStatus();

    const onClick = useCallback(() => {
        if (signerStatus === SignerStatus.NotConnected) {
            connect()
        } else if (signerStatus === SignerStatus.Connected) {
            disconnect();
        }
    }, [signerStatus, connect, disconnect]);

    const connectDisabled = signerStatus !== SignerStatus.Connected && signerStatus !== SignerStatus.NotConnected;

    return <div className={classes.root}>
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Profile Manager
                </Typography>
                {addresses !== undefined &&
                <Typography variant="h6" hidden={addresses.length === 0} className={classes.address}>
                    {addresses![0]}
                </Typography>
                }
                <Button color="inherit" onClick={onClick} disabled={connectDisabled}>
                    {signerStatus === SignerStatus.Connected ? "Disconnect" : "Connect"}
                </Button>
            </Toolbar>
        </AppBar>
    </div>
}
