import React, {useCallback} from "react";
import {Button} from "@material-ui/core";
import {useDesmosContext} from "../context/desmos";
import useSignerStatus from "../hooks/useSignerStatus";

export default function ProfileEdit(): JSX.Element {
    const {signer, client} = useDesmosContext();
    const signerStatus = useSignerStatus();

    const testSign = useCallback(async () => {
        if (signer !== undefined && client !== undefined) {
            console.log(client);
            const accounts = await signer.getAccounts();
            await client.sendTokens(accounts[0].address, accounts[0].address, [{
                denom: "udaric",
                amount: "1000"
            }], "auto");
        }
    }, [signer, client])

    return <div>
        <h1>Signer status: {signerStatus}</h1>
        <Button onClick={testSign}>Test sign</Button>
    </div>
}
