import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import styles from "../styles/Home.module.css";

import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getMint,
  getAccountLenForMint,
  createInitializeAccountInstruction,
} from "@solana/spl-token";

import token from "@solana/spl-token";

export const CreateTokenAccountForm: FC = () => {
  const [txSig, setTxSig] = useState("");
  const [tokenAccount, setTokenAccount] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [ mint, setMint ] = useState("");
  const [ accountOwner, setAccoutOwner ] = useState("");
  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const createTokenAccount = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey ) {
      return alert('Connet solana wallet.');
    }

    if (!mint || !accountOwner) {
      return alert('Make sure mint and account fields are correct.');
    }

    
    // BUILD AND SEND CREATE TOKEN ACCOUNT TRANSACTION HERE
    // Building transaction account using generated keypair
    // Certain user can have multiple token accoutns
    const mintPublicKey = new web3.PublicKey(mint)
    const mintState =  await getMint(connection, mintPublicKey);
    const accountKeypair = web3.Keypair.generate();
    const space = getAccountLenForMint(mintState);
    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: accountKeypair.publicKey,
        space,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(
        accountKeypair.publicKey,
        mintPublicKey,
        publicKey,
        TOKEN_PROGRAM_ID
      )
    );

    try {
      sendTransaction(transaction, connection, { signers: [accountKeypair] })
      .then((sig) => {
        const tokenAccountPublicKeyString = accountKeypair.publicKey.toString();
        setTokenAccount(tokenAccountPublicKeyString);
        setTxSig(sig);
        console.log(sig);
      });
    } catch (error) {
      alert(JSON.stringify(error));
    }
  };

  return (
    <div>
      <br />
      {publicKey ? (
        <form onSubmit={createTokenAccount} className={styles.form}>
          <label htmlFor="owner">Token Mint:</label>
          <input
            id="mint"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Mint"
            required
            onChange={(event) => setMint(event.target.value)}
          />
          <label htmlFor="owner">Token Account Owner:</label>
          <input
            id="owner"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Account Owner PublicKey"
            required
            onChange={(event) => setAccoutOwner(event.target.value)}
          />
          <button type="submit" className={styles.formButton}>
            Create Token Account
          </button>
        </form>
      ) : (
        <span></span>
      )}
      {txSig ? (
        <div>
          <p>Token Account Address: {tokenAccount}</p>
          <p>View your transaction on </p>
          <a href={link()}>Solana Explorer</a>
        </div>
      ) : null}
    </div>
  );
};
