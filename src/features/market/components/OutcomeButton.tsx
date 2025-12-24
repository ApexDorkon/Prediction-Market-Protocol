import Button from "@/components/Button";

type OutcomeButtonProps = {
  label: string;
};

export default function OutcomeButton({ label }: OutcomeButtonProps) {
  return <Button variant="secondary">{label}</Button>;
}




