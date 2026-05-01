"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Square, Loader2, CheckCircle2, Eye } from "lucide-react";
import { useChat, useCompletion } from "@ai-sdk/react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatHistory, { TChat } from "@/hooks/datasource/useChatHistory";
import { DefaultChatTransport, UIMessage, UIMessagePart } from "ai";
import { mapChatHistory } from "@/lib/ai";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import TaskDetailModal from "./dashboard/taks/TaskDetailModal";
import TaskFetchId from "./dashboard/taks/TaskFetchId";
import { TTask } from "@/hooks/datasource/useTasks";
// Internal Helper Component for Styling
function MarkdownRenderer({ content }: { content: string }) {
  return (
    // Wrap in a div to apply the tailwind 'prose' styles 
    // This avoids the 'className' error on the ReactMarkdown component itself
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Use destructured props to avoid 'node' unused warnings
          ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          // For inline code
          code: ({ ...props }) => (
            <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-xs" {...props} />
          ),
          // Ensure links open in new tabs
          a: ({ ...props }) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


type ToolInvocationPart = Extract<
  UIMessagePart<any, any>,
  { type: "tool-invocation" }
>;

function isToolInvocationPart(
  part: UIMessagePart<any, any>
): part is ToolInvocationPart {
  return part.type === "tool-invocation";
}
export function ChatAssistant() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('')
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const { data: messages } = useChatHistory()
  const initialMessages = useMemo(() => {
    return mapChatHistory(messages)
  }, [messages])
  const {
    messages: chatMessages, sendMessage,
    stop, status
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }),
    onFinish: () => {
      // refetch();
    },
    messages: initialMessages
  });
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "auto"
      })
    })
  }, [chatMessages])
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" })
      })
    }
  }, [isOpen])
  return (
    <div
      className={`fixed z-50 ${isOpen
        ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6"
        : "bottom-6 right-6"
        }`}
    >
      {!isOpen ? (
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsOpen(true)}>
          <MessageCircle className="size-8" />
        </Button>
      ) : (
        <Card
          className="
    w-full h-full 
    sm:w-[450px] sm:h-[700px] 
    flex flex-col shadow-2xl 
    border-t-4 border-t-primary
    rounded-none sm:rounded-xl
  ">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="font-medium">AI Assistant</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            <ScrollArea className="flex-1 overflow-y-auto px-4">
              {chatMessages.map((m: any) => {
                const text = m.parts
                  ?.filter((p: any) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("");
                return (
                  <div
                    key={m.id}
                    className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-sm shadow-sm max-w-[80%] ${m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border"
                        }`}
                    >
                      {m.role === "user" ? (
                        <p>{text}</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <MarkdownRenderer content={text ?? ""} />

                          {m.toolInvocations?.map((tool: any) => (
                            <Popover key={tool.toolCallId}>
                              <PopoverTrigger asChild>
                                <div
                                  className="mt-2 text-xs flex items-center gap-2 p-2 bg-background/50 rounded border border-primary/10 text-primary font-medium cursor-pointer hover:bg-muted transition "
                                >
                                  {tool.state === "call" && (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Executing {tool.toolName}...
                                    </>
                                  )}

                                  {tool.state === "result" && (
                                    <>
                                      <CheckCircle2 className="h-3 w-3" />
                                      Finished {tool.toolName}
                                    </>
                                  )}
                                </div>
                              </PopoverTrigger>

                              <PopoverContent
                                side="left"
                                align="center"
                                className="w-[320px] text-xs"
                              >
                                <div className="space-y-3">
                                  <div className="font-semibold text-primary">
                                    {tool.toolName}
                                  </div>

                                  {tool.args && (
                                    <div>
                                      <div className="text-muted-foreground mb-1 font-medium">
                                        Arguments
                                      </div>
                                      <pre className="bg-muted rounded p-2 overflow-x-auto">
                                        {JSON.stringify(tool.args, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  <p>Results</p>
                                  {tool.result?.transactions?.length > 0 && (
                                    <>
                                      <p>Transactions</p>
                                      {tool.result.transactions.map((t: any) => (
                                        <div key={t.id}>{t.description ?? t.amount}</div>
                                      ))}
                                    </>
                                  )}

                                  {tool.result?.accounts?.length > 0 && (
                                    <>
                                      <p>Accounts</p>
                                      {tool.result.accounts.map((a: any) => (
                                        <div key={a.id}>{a.type} - {a.balance}</div>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* STREAMING INDICATOR */}
              {status === "streaming" && (
                <div className="flex justify-start mb-4">
                  <div className=" text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              {status === "submitted" && (
                <div className="flex justify-start mb-4">
                  <div className="rounded-lg px-3 py-2 text-sm bg-muted border border-border flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>
            <div className="border-t p-3">
              <form onSubmit={async (e) => {
                e.preventDefault()
                sendMessage({ text: input }, {
                  body: {
                    text: input
                  }
                });
                setInput('');
              }} className="flex w-full gap-2">
                <Input
                  placeholder="Ask something..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="flex-1 "
                  disabled={status === 'streaming'}
                />

                {status === 'streaming' ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={stop}
                    className="animate-in fade-in zoom-in duration-200"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input || input.trim().length === 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>
          </CardContent>

        </Card>
      )}
    </div>
  );
}