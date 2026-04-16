import { Metadata, NextPage } from 'next'
import PageClient from './page.client'
export const metadata: Metadata = {
  title: "Savings Planner"
}
const Page: NextPage = () => {
  return <PageClient />
}

export default Page