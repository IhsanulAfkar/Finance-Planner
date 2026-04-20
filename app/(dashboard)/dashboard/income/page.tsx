
import DashboardPage from "@/components/pages/dashboard/DashboardPage"
import { APP_NAME } from "@/lib/clientConst"
import { Metadata } from "next"
import PageClient from "./page.client"
import AccountOverlay from "@/components/overlay/AccountOverlay"

export const metadata: Metadata = {
  title: 'Expenses | ' + APP_NAME
}
export default function Page() {
  return <><AccountOverlay /><PageClient /></>
}
