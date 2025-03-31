import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatMessage = ({ message }: { message: Message }) => {
  return (
    <div className={cn(
      "flex w-full mb-4",
      message.sender === 'user' ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg p-3",
        message.sender === 'user' 
          ? "bg-primary text-white rounded-tr-none" 
          : "bg-gray-100 text-gray-800 rounded-tl-none"
      )}>
        <p className="text-sm">{message.text}</p>
        <div className={cn(
          "text-xs mt-1",
          message.sender === 'user' ? "text-blue-100" : "text-gray-500"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi there! I'm your JobPortal assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      processMessage(input);
    }, 1000);
  };
  
  const processMessage = (messageText: string) => {
    let responseText = "";
    const lowerText = messageText.toLowerCase();
    
    // Simple pattern matching for demo purposes
    if (lowerText.includes("job") && lowerText.includes("apply")) {
      responseText = "To apply for a job, navigate to the job listing page, select a job that interests you, and click the 'Apply Now' button. You'll need to have an account and be logged in.";
    } else if (lowerText.includes("resume") || lowerText.includes("cv")) {
      responseText = "You can upload your resume in your profile settings. We also offer professional resume writing services that can help you stand out to employers!";
    } else if (lowerText.includes("account") && (lowerText.includes("create") || lowerText.includes("register"))) {
      responseText = "To create an account, click on the 'Register' button in the top right corner of the page and follow the instructions. It only takes a minute!";
    } else if (lowerText.includes("forgot") && lowerText.includes("password")) {
      responseText = "If you've forgotten your password, click on the 'Login' button, then select 'Forgot Password'. We'll send you an email with instructions to reset it.";
    } else if (lowerText.includes("contact") || lowerText.includes("support")) {
      responseText = "You can reach our support team at support@jobportal.com or call us at 1800-102-5557. We're available Monday through Friday, 9 AM to 6 PM.";
    } else if (lowerText.includes("premium") || lowerText.includes("subscription")) {
      responseText = "We offer various premium plans that can help boost your job search or recruitment efforts. Check out our Services page for more details!";
    } else {
      responseText = "I'm not sure I understand. Could you please rephrase your question? I can help with job applications, resume tips, account issues, and more.";
    }
    
    // Add bot response
    const botMessage: Message = {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      <Button
        className={cn(
          "w-14 h-14 rounded-full shadow-lg",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>
      
      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 md:w-96 shadow-xl">
          <CardHeader className="bg-primary text-white py-3">
            <CardTitle className="text-lg">JobPortal Assistant</CardTitle>
          </CardHeader>
          
          <CardContent className="p-3 h-80 overflow-y-auto">
            <div className="space-y-2">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none max-w-[80%] p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          <CardFooter className="p-3 pt-0">
            <form 
              className="flex w-full gap-2" 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <Send size={18} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Chatbot;