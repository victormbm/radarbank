import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BankStatusBadge } from "@/components/bank-status-badge";
import { formatDateTime } from "@/lib/utils";

interface Bank {
  id: string;
  name: string;
  type: string;
  country: string;
  updatedAt: Date | string;
  score: number;
}

interface BanksTableProps {
  banks: Bank[];
}

export function BanksTable({ banks }: BanksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>País</TableHead>
          <TableHead>Última Atualização</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {banks.map((bank) => (
          <TableRow key={bank.id}>
            <TableCell>
              <Link
                href={`/banks/${bank.id}`}
                className="font-medium text-primary hover:underline"
              >
                {bank.name}
              </Link>
            </TableCell>
            <TableCell className="capitalize">
              {bank.type === "digital" ? "Digital" : "Tradicional"}
            </TableCell>
            <TableCell>{bank.country}</TableCell>
            <TableCell>{formatDateTime(bank.updatedAt)}</TableCell>
            <TableCell>{bank.score.toFixed(1)}</TableCell>
            <TableCell>
              <BankStatusBadge score={bank.score} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
