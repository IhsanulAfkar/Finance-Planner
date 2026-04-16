'use client'
import useChatHistory from '@/hooks/datasource/useChatHistory'
import { NextPage } from 'next'
import { ChatAssistant } from './pages/ChatAssistant'

interface Props { }

const ChatHistory: NextPage<Props> = ({ }) => {

  const { data: messages, refetch, isLoading } = useChatHistory()
  if (isLoading) return <></>
  return <ChatAssistant />
}

export default ChatHistory