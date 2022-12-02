import React, {useCallback} from "react";
import {Button, makeStyles, TextField, Theme} from "@material-ui/core";
import LoadingComponent from "../components/Loading";
import {useDesmosContext} from "../context/desmos";
import SignClient from "@walletconnect/sign-client";
import {WalletConnectSigner} from "../signer";
import {SigningMode} from "@desmoslabs/desmjs";

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
        },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: theme.spacing(2)
    },
}));

const LoadingTextField = LoadingComponent(TextField);
const LoadingButton = LoadingComponent(Button);

export default function ProfileEdit(): JSX.Element {
    const classes = useStyles();
    const {signerStatus} = useDesmosContext();


    return <div>
        <h1>Signer status: {signerStatus}</h1>
    </div>
}
