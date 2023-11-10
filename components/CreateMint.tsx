import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { FC, useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
} from "@solana/spl-token";

export const CreateMintForm: FC = () => {
  const [txSig, setTxSig] = useState("");
  const [mint, setMint] = useState("");

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const createMint = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }

    // BUILD AND SEND CREATE MINT TRANSACTION HERE
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const mintAccountKeypair = web3.Keypair.generate();
    const decimals = 2;

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintAccountKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintAccountKeypair.publicKey,
        decimals,
        publicKey,
        publicKey,
        TOKEN_PROGRAM_ID,
      )
    );

    try {
      sendTransaction(transaction, connection, { signers: [mintAccountKeypair] })
      .then((sig) => {
        setTxSig(sig);
        const mintPublicKey = mintAccountKeypair.publicKey.toString()
        setMint(mintPublicKey);
        localStorage.setItem('mint', JSON.stringify(mintPublicKey));
      });
    } catch (error) {
      alert(JSON.stringify(error));
    }
  };

  useEffect(() => {
    const mintPublicKey = JSON.parse(localStorage.getItem('mint')) 
    console.log(mintPublicKey);
    if (mintPublicKey) {
      setMint(mintPublicKey);
    }
  }, [connection]);

  return (
    <div>
      {publicKey ? (
        <form onSubmit={createMint} className={styles.form}>
          <button type="submit" className={styles.formButton}>
            Create Mint
          </button>
        </form>
      ) : (
        <span>Connect Your Wallet</span>
      )}
      {mint && connection && publicKey ? (
        <div>
          <p>Token Mint Address: {mint}</p>
        </div>
      ) : null}
      {txSig ? (
        <div>
          <p>View your transaction on </p>
          <a href={link()}>Solana Explorer</a>
        </div>
      ) : null}
    </div>
  );
};
