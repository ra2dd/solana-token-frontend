import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import styles from "../styles/Home.module.css";
import {
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { decimals } from "./CreateMint"

export const MintToForm: FC = () => {
  const [txSig, setTxSig] = useState("");
  const [tokenAccount, setTokenAccount] = useState("");
  const [balance, setBalance] = useState(-1);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const mintTo = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }
    
    // BUILD AND SEND MINT TRANSACTION HERE
    const mintPublicKey = new web3.PublicKey(event.target.mint.value);
    const accountOwnerPublicKey = new web3.PublicKey(event.target.recipient.value);
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(
      mintPublicKey, 
      accountOwnerPublicKey, 
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(associatedTokenAccountAddress)
    if (accountInfo == null) {
      return alert(
      "Associated token account address for mint doesn't exists. Create token account and try again.");
    }

    const transaction = new web3.Transaction().add(
      createMintToInstruction(
        mintPublicKey,
        associatedTokenAccountAddress,
        publicKey,
        parseInt(event.target.amount.value) * (10 ** decimals)
      )
    )
  
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction(signature, "confirmed");

    setTxSig(signature);
    const tokenAccountData = await getAccount(connection, associatedTokenAccountAddress)
    setBalance(parseInt(tokenAccountData.amount.toString()) / (10 ** decimals));
  };

  return (
    <div>
      <br />
      {publicKey ? (
        <form onSubmit={mintTo} className={styles.form}>
          <label htmlFor="mint">Token Mint:</label>
          <input
            id="mint"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Mint"
            required
          />
          <label htmlFor="recipient">Recipient:</label>
          <input
            id="recipient"
            type="text"
            className={styles.formField}
            placeholder="Enter Recipient PublicKey"
            required
          />
          <label htmlFor="amount">Amount Tokens to Mint:</label>
          <input
            id="amount"
            type="text"
            className={styles.formField}
            placeholder="e.g. 100"
            required
          />
          <button type="submit" className={styles.formButton}>
            Mint Tokens
          </button>
        </form>
      ) : (
        <span></span>
      )}
      {txSig ? (
        <div>
          <p>Token Balance: {balance >= 0 ? balance : null} </p>
          <p>View your transaction on </p>
          <a href={link()}>Solana Explorer</a>
        </div>
      ) : null}
    </div>
  );
};
