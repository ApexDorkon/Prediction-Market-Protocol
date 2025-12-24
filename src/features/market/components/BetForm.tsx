"use client";
import { useState } from "react";
import Button from "@/components/Button";

export default function BetForm() {
  const [amount, setAmount] = useState(0);
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="number"
        className="w-32 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <Button type="submit">Place Bet</Button>
    </form>
  );
}




