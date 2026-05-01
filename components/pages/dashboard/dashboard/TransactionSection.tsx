import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import useTransaction from '@/hooks/datasource/useTransaction'
import { formatIDR } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { NextPage } from 'next'

interface Props { }

const TransactionSection: NextPage<Props> = ({ }) => {
  const { data: transactions, isLoading: isLoadingTransaction } = useTransaction({ limit: 5, syncUrl: false })
  return <Card>
    <CardHeader>
      <CardTitle>Recent Transactions</CardTitle>
    </CardHeader>

    <CardContent className="text-sm">
      {isLoadingTransaction ? (
        <ul className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* RIGHT */}
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {transactions.map((t) => {
            const isIncome = t.type === "INCOME";

            return (
              <li
                key={t.id}
                className="flex items-center justify-between"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${isIncome
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                      }`}
                  >
                    {isIncome ? (
                      <ArrowDownRight size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>

                  <div>
                    <p className="font-medium">
                      {t.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div
                  className={`font-semibold ${isIncome ? "text-green-600" : "text-red-500"
                    }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatIDR(t.amount)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CardContent>
  </Card>
}

export default TransactionSection