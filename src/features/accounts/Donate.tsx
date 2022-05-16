import {
  SlButton,
  SlDialog,
  SlInput,
} from "@shoelace-style/shoelace/dist/react";
import type SlInputElement from "@shoelace-style/shoelace/dist/components/input/input";
import React, { FC, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import styles from "./Donate.module.css";
import { sendCoins, setDonationOpen } from "./accountsSlice";
import { fromMicroDenom } from "../../util/coins";
import presets from "../connection/presets.json";

const DONATIONS_ADDRESS = "secret126vw9708azl3ujzdjfmwxgmhv5cxv7v4emuvfw";

export const Donate: FC = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.accounts.donationOpen);
  const sender = useAppSelector((state) => state.accounts.currentAccount!);
  const secretConfig = presets["secret-mainnet"];
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  function dispatchSend() {
    dispatch(
      sendCoins({
        sender,
        recipient: DONATIONS_ADDRESS,
        amount,
        memo,
        customConfig: secretConfig,
      })
    );
    dispatch(setDonationOpen(false));
    setAmount("");
    setMemo("");
  }

  return (
    <SlDialog
      label="Thank you!"
      open={open}
      onSlRequestClose={() => dispatch(setDonationOpen(false))}
      className={styles.dialog}
    >
      <div className={styles.form}>
        <SlInput
          placeholder="Amount"
          value={amount}
          className={styles.amount}
          onSlChange={(e) =>
            setAmount((e.target as SlInputElement).value.trim())
          }
        >
          <div slot="suffix">{fromMicroDenom(secretConfig["microDenom"])}</div>
        </SlInput>
        <SlInput
          placeholder="Memo"
          value={memo}
          className={styles.memo}
          onSlChange={(e) => setMemo((e.target as SlInputElement).value.trim())}
        />
        <SlButton variant="neutral" onClick={() => dispatchSend()}>
          Send
        </SlButton>
      </div>
    </SlDialog>
  );
};
