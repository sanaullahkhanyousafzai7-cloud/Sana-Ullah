import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Camera, 
  FileText, 
  Wallet, 
  HelpCircle, 
  Image as ImageIcon,
  User,
  Bot,
  Loader2,
  Trash2,
  PlusCircle,
  Menu,
  X,
  Smartphone,
  Home,
  Search,
  PlusSquare,
  Heart,
  Type,
  MessageSquare,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Baby,
  Activity,
  History,
  ClipboardList,
  Stethoscope,
  Cpu,
  Zap,
  Upload,
  RefreshCcw,
  Maximize,
  ShieldCheck,
  Lock,
  Download,
  Copy,
  Check,
  Mic,
  MicOff,
  Wand2,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { getAIResponse } from './services/aiService';
import { cn } from './lib/utils';
import { PREDEFINED_PERSONAS, type Persona } from './constants';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  image?: string;
  timestamp: Date;
}

interface LogoSettings {
  customLogo: string | null;
  aiIcon: 'bot' | 'sparkles' | 'cpu' | 'zap';
  logoSize: number;
  isAnimated: boolean;
}

type LayoutType = 'default' | 'whatsapp' | 'instagram' | 'dashboard' | 'minimalist';

const Logo = ({ className = "w-10 h-10", settings }: { className?: string; settings: LogoSettings }) => {
  const IconComponent = {
    bot: Bot,
    sparkles: Sparkles,
    cpu: Cpu,
    zap: Zap
  }[settings.aiIcon];

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={className}
    >
      <div className={cn("relative group w-full h-full")} style={{ transform: `scale(${settings.logoSize / 100})` }}>
        {settings.isAnimated && (
          <>
            <div className="absolute inset-0 bg-blue-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform opacity-20"></div>
            <div className="absolute inset-0 bg-indigo-600 rounded-2xl -rotate-3 group-hover:-rotate-6 transition-transform opacity-20"></div>
          </>
        )}
        <div className="relative flex items-center justify-center bg-white rounded-2xl shadow-lg border border-white h-full w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90"></div>
          {settings.customLogo ? (
            <img 
              src={settings.customLogo} 
              alt="Custom Logo" 
              className={cn("w-full h-full object-contain relative z-10 p-1", settings.isAnimated && "robot-animate")} 
            />
          ) : (
            <IconComponent className={cn("w-2/3 h-2/3 text-white relative z-10", settings.isAnimated && "robot-animate")} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('default');
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  const [currentProgram, setCurrentProgram] = useState<string>('program1');
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    customLogo: null,
    aiIcon: 'bot',
    logoSize: 100,
    isAnimated: true,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      text: 'Main Asaan AI Assistant hoon. Main aap ki kya madad kar sakta hoon?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSmartMenuOpen, setIsSmartMenuOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('default');
  const [customPersonas, setCustomPersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('custom_personas');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [newPersona, setNewPersona] = useState({ name: '', description: '', instruction: '' });
  
  const allPersonas = [...PREDEFINED_PERSONAS, ...customPersonas];
  const selectedPersona = allPersonas.find(p => p.id === selectedPersonaId) || PREDEFINED_PERSONAS[0];

  useEffect(() => {
    localStorage.setItem('custom_personas', JSON.stringify(customPersonas));
  }, [customPersonas]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ur-PK'; // Urdu (Pakistan) or default

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => {
          // If it's a new result, append it or replace it depending on logic
          // Simple logic: replace if interim, append if final? 
          // Actually, let's just update the input with the current transcript
          return transcript;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Voice input mein masla aa gaya.", {
          description: event.error === 'not-allowed' ? "Microphone permission ki zaroorat hai." : "Dobara koshish karein."
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Aap ka browser voice input support nahi karta.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Sun raha hoon...", {
          description: "Bolna shuru karein.",
          duration: 2000
        });
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleActionClick = (prompt: string) => {
    handleSend(prompt);
  };

  const handleSend = async (textOverride?: string) => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    const textToSend = textOverride || input;
    if (!textToSend && !selectedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: textToSend,
      image: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSearchQuery('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Logic: Gemini first
      const aiReply = await getAIResponse(textToSend, userMsg.image?.split(',')[1], selectedPersona.instruction);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: aiReply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      // Display error message using sonner
      toast.error(error.message || "AI response mein masla aa gaya hai.", {
        description: "Baraye meharbani kuch dair baad dobara koshish karein.",
        duration: 5000,
      });

      // Seamless Fallback
      setIsReconnecting(true);
      setTimeout(async () => {
        try {
          const fallbackReply = "Main aap ki mukammal madad ke liye hazir hoon. " + 
                               (textToSend.toLowerCase().includes("biometric") ? "Mobile biometric verification ke liye aap ko nazdeeki service center ya franchise jana parega." : "Iska behtareen tareeqa ye hai ke aap step-by-step follow karein. Kya main mazeed samjhaoon?");
          
          const botMsg: Message = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            text: fallbackReply,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMsg]);
        } finally {
          setIsReconnecting(false);
        }
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    if (window.confirm("Poori chat clear karein?")) {
      setMessages([{
        id: 'welcome',
        type: 'bot',
        text: 'Main Asaan AI Assistant hoon. Main aap ki kya madad kar sakta hoon?',
        timestamp: new Date()
      }]);
      toast.success("Chat history clear ho gayi!");
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans relative">
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Status Bar (Desktop/Web simulation) */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50 hidden lg:flex">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Systems Online
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-2 bg-slate-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-sm"></div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="absolute inset-y-0 left-0 z-50 w-72 bg-white text-slate-800 p-6 shadow-2xl lg:relative lg:translate-x-0 border-r border-slate-200 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-10 pt-4">
                <Logo className="w-12 h-12" settings={logoSettings} />
                <div>
                  <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 leading-none">Asaan AI</h1>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Professional Assistant</p>
                </div>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Navigation</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => { setCurrentView('chat'); setIsSidebarOpen(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all futuristic-btn text-sm group",
                        currentView === 'chat' ? "bg-blue-600 text-white shadow-lg shadow-blue-200 glow-blue border-none" : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 select-none"
                      )}
                    >
                      {logoSettings.aiIcon === 'bot' ? <Bot className="w-5 h-5 robot-animate" /> :
                       logoSettings.aiIcon === 'sparkles' ? <Sparkles className="w-5 h-5 robot-animate" /> :
                       logoSettings.aiIcon === 'cpu' ? <Cpu className="w-5 h-5 robot-animate" /> :
                       <Zap className="w-5 h-5 robot-animate" />}
                      Asaan AI Main
                    </button>
                    <button 
                      onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all futuristic-btn text-sm group",
                        currentView === 'settings' ? "bg-slate-900 text-white shadow-lg shadow-slate-400 glow-blue border-none" : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 select-none"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings robot-animate"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                      Settings
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }}
                className="pt-6 border-t border-slate-100 flex items-center gap-3 w-full text-left hover:bg-slate-50 transition-colors p-2 rounded-xl mt-auto"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white sleek-shadow flex items-center justify-center shrink-0">
                   <User className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 leading-none truncate">User Account</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Premium Member</p>
                </div>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-80 bg-white text-slate-800 p-6 flex-col border-r border-slate-200 mt-8">
        <div className="flex items-center gap-4 mb-10">
          <Logo className="w-12 h-12" settings={logoSettings} />
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 leading-none">Asaan AI</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Professional Assistant</p>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pr-2 px-1">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
            <div className="space-y-3">
              <button 
                onClick={() => { setCurrentView('chat'); }}
                className={cn(
                  "flex items-center gap-4 w-full p-5 rounded-3xl font-bold transition-all futuristic-btn text-base group",
                  currentView === 'chat' ? "bg-blue-600 text-white shadow-xl shadow-blue-100 glow-blue" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", currentView === 'chat' ? "bg-white/20" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                  {logoSettings.aiIcon === 'bot' ? <Bot className="w-6 h-6 robot-animate" /> :
                   logoSettings.aiIcon === 'sparkles' ? <Sparkles className="w-6 h-6 robot-animate" /> :
                   logoSettings.aiIcon === 'cpu' ? <Cpu className="w-6 h-6 robot-animate" /> :
                   <Zap className="w-6 h-6 robot-animate" />}
                </div>
                Asaan AI Main
              </button>
              <button 
                onClick={() => { setCurrentView('settings'); }}
                className={cn(
                  "flex items-center gap-4 w-full p-5 rounded-3xl font-bold transition-all futuristic-btn text-base group",
                  currentView === 'settings' ? "bg-slate-800 text-white shadow-xl shadow-slate-100 glow-blue" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", currentView === 'settings' ? "bg-white/20" : "bg-slate-50 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings robot-animate"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                Settings
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setCurrentView('settings')}
          className="pt-6 border-t border-slate-100 flex items-center gap-3 w-full text-left hover:bg-slate-50 transition-colors p-2 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white sleek-shadow flex items-center justify-center shrink-0">
             <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-900 leading-none truncate">User Account</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Premium Member</p>
          </div>
        </button>
      </aside>

      {/* Main Container (Chat Area or Dashboard) */}
      <main className={cn(
        "flex-1 flex flex-col h-full relative overflow-hidden lg:mt-8",
        currentLayout === 'whatsapp' ? "bg-[#efe7dd]" : "bg-[#F3F4F6]"
      )}>
        {currentView === 'chat' ? (
          <>
            {/* Layout Specific Header Extensions */}
            {currentLayout === 'whatsapp' && (
              <div className="bg-[#075e54] text-white p-4 shrink-0 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                      <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h2 className="font-bold text-base leading-none">Asaan AI</h2>
                      <p className="text-[10px] opacity-80 mt-1">online</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button><Smartphone className="w-5 h-5" /></button>
                    <button><Menu className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <header className={cn(
              "h-20 lg:h-16 flex items-center justify-between px-8 z-30 shrink-0",
              currentLayout === 'whatsapp' ? "hidden" : ""
            )}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-white rounded-lg transition-colors border border-slate-200"
                >
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
                <div className="hidden sm:block">
                  <Logo settings={logoSettings} className="w-10 h-10" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Active Chat</p>
                  <h2 className="text-sm font-bold text-slate-800 italic font-display">“Mushkil kaam ko asaan banana”</h2>
                </div>
              </div>

              <div className="flex-1 max-w-sm mx-4 relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                 <button className="hidden sm:flex p-2.5 rounded-full glass-btn futuristic-btn glow-blue text-slate-600">
                   <HelpCircle className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={clearChat}
                    className="p-2.5 rounded-full glass-btn futuristic-btn glow-red text-slate-600 ml-1"
                    title="Clear Chat"
                  >
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 md:px-12 py-6 space-y-8 scroll-smooth"
            >
              {/* Mobile Search Bar */}
              <div className="md:hidden pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search chat history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium outline-none shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {filteredMessages.length === 0 && searchQuery && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No results found</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "biometric" or "health".</p>
                </motion.div>
              )}

              {filteredMessages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.type === 'user' ? "justify-end" : "justify-start",
                    (messages.length === 1 && i === 0) ? "hidden" : "" // Hide welcome msg in hero state
                  )}
                >
                  <div className={cn(
                    "flex max-w-[85%] md:max-w-[70%]",
                    msg.type === 'user' ? "flex-row" : "flex-row"
                  )}>
                    {msg.type === 'bot' && (
                      <div className={cn(
                        "w-10 h-10 rounded-full bg-white border border-slate-200 sleek-shadow flex shrink-0 items-center justify-center mr-3 hidden sm:flex",
                        currentLayout === 'instagram' ? "insta-gradient border-none" : ""
                      )}>
                        {logoSettings.customLogo ? (
                          <img src={logoSettings.customLogo} alt="logo" className="w-full h-full object-contain p-1 rounded-full" />
                        ) : (
                          currentLayout === 'instagram' ? (
                            logoSettings.aiIcon === 'bot' ? <Bot className="w-6 h-6 text-white" /> :
                            logoSettings.aiIcon === 'sparkles' ? <Sparkles className="w-6 h-6 text-white" /> :
                            logoSettings.aiIcon === 'cpu' ? <Cpu className="w-6 h-6 text-white" /> :
                            <Zap className="w-6 h-6 text-white" />
                          ) : (
                            <div className={cn("text-lg", logoSettings.isAnimated && "robot-animate")}>
                              {logoSettings.aiIcon === 'bot' ? '🤖' :
                               logoSettings.aiIcon === 'sparkles' ? '✨' :
                               logoSettings.aiIcon === 'cpu' ? '⚙️' : '⚡'}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      {msg.image && (
                        <div className="mb-1 p-1 bg-white rounded-2xl sleek-shadow border border-slate-200 overflow-hidden">
                          <img src={msg.image} alt="uploaded" className="rounded-xl w-full max-h-72 object-cover" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "p-5 rounded-3xl relative",
                        msg.type === 'user' 
                          ? (currentLayout === 'whatsapp' ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none shadow-sm border-none" : 
                             currentLayout === 'instagram' ? "bg-blue-500 text-white rounded-2xl" :
                             "bg-blue-600 text-white rounded-tr-sm bubble-shadow")
                          : (currentLayout === 'whatsapp' ? "bg-white text-slate-800 rounded-tl-none shadow-sm border-none" : 
                             currentLayout === 'instagram' ? "bg-white border border-slate-100 text-slate-800 rounded-2xl" :
                             "bg-white border border-slate-200 text-slate-800 rounded-tl-sm bubble-shadow")
                      )}>
                        {msg.type === 'bot' && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tighter",
                              currentLayout === 'whatsapp' ? "text-green-600" : 
                              currentLayout === 'instagram' ? "text-rose-500" :
                              "text-blue-600"
                            )}>AI Assistant Ready</span>
                          </div>
                        )}
                        
                        <div className={cn(
                          "prose prose-sm max-w-none text-inherit leading-relaxed font-medium",
                          msg.type === 'user' ? "prose-invert" : ""
                        )}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        <div className={cn(
                          "flex items-center gap-2 mt-4 text-[10px] items-center",
                          msg.type === 'user' ? "opacity-60 justify-end" : "text-slate-400 justify-between"
                        )}>
                          <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.type === 'bot' && (
                            <button 
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 group"
                              title="Copy to clipboard"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && !isReconnecting && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 sleek-shadow flex items-center justify-center shrink-0 hidden sm:flex">
                    {logoSettings.customLogo ? (
                      <img src={logoSettings.customLogo} alt="logo" className="w-full h-full object-contain p-2 rounded-full" />
                    ) : (
                      <span className={cn("text-lg", logoSettings.isAnimated && "robot-animate")}>
                        {logoSettings.aiIcon === 'bot' ? '🤖' :
                         logoSettings.aiIcon === 'sparkles' ? '✨' :
                         logoSettings.aiIcon === 'cpu' ? '⚙️' : '⚡'}
                      </span>
                    )}
                  </div>
                  <div className="bg-white border border-slate-200 px-5 py-4 rounded-3xl rounded-tl-sm bubble-shadow flex items-center gap-3">
                    <div className="flex gap-1.5 py-1">
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                      />
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                      />
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 italic">Asaan AI typing...</span>
                  </div>
                </motion.div>
              )}

              {/* Quick Replies Suggestions (Simulation) */}
              {messages[messages.length - 1].type === 'bot' && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 pt-2 px-12"
                >
                  {["Shukriya!", "Isko thora short karein", "English mein convert karein"].map((suggest, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(suggest)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 futuristic-btn glow-blue"
                    >
                      {suggest}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input Bar */}
            <div className={cn(
              "p-6 md:p-8 shrink-0 relative border-t",
              currentLayout === 'whatsapp' ? "bg-[#f0f0f0] border-slate-300" : 
              currentLayout === 'instagram' ? "bg-white border-slate-200 pb-10" :
              "bg-white border-slate-100"
            )}>
              {currentLayout === 'instagram' && (
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50">
                  <button onClick={() => setCurrentLayout('default')} className="text-slate-400 hover:text-slate-900"><Home className="w-6 h-6" /></button>
                  <button onClick={() => setIsChatVisible(true)} className="text-slate-400 hover:text-slate-900"><Search className="w-6 h-6" /></button>
                  <button 
                    onClick={() => setIsChatVisible(true)}
                    className="w-12 h-12 rounded-xl insta-gradient flex items-center justify-center text-white shadow-lg -translate-y-4"
                  >
                    <PlusSquare className="w-7 h-7" />
                  </button>
                  <button onClick={() => setIsChatVisible(true)} className="text-slate-400 hover:text-slate-900"><Heart className="w-6 h-6" /></button>
                  <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-slate-900"><User className="w-6 h-6" /></button>
                </div>
              )}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-6 flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-xl max-w-4xl mx-auto"
                  >
                    <div className="relative w-20 h-20 shrink-0">
                      <img src={selectedImage} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform"
                      >
                        <X className="w-3.4 h-3.4" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Photo Attachment</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">AI will analyze this image automatically when you send.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className={cn(
                  "flex-1 border rounded-full px-6 py-4 flex items-center gap-4 transition-all group",
                  currentLayout === 'whatsapp' ? "bg-white border-none shadow-sm" : 
                  currentLayout === 'instagram' ? "bg-slate-50 border-slate-200" :
                  "bg-slate-50 border-slate-200 shadow-inner focus-within:ring-4 focus-within:ring-blue-500/10"
                )}>
                  {currentLayout === 'instagram' && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-400 hover:text-blue-500"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={currentLayout === 'whatsapp' ? "Type a message" : "Write a caption..."}
                    className="flex-1 outline-none text-sm bg-transparent font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPersonaModalOpen(true)}
                      className={cn(
                        "p-2 rounded-full transition-all duration-300 relative group/p",
                        selectedPersonaId !== 'default' ? "bg-amber-50 text-amber-600" : "text-slate-400 hover:text-amber-600"
                      )}
                      title={`Current Persona: ${selectedPersona.name}`}
                    >
                      <Wand2 className="w-5 h-5 transition-transform group-hover/p:rotate-12" />
                      {selectedPersonaId !== 'default' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
                      )}
                    </button>
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "p-2 rounded-full transition-all duration-300",
                        isListening ? "bg-red-100 text-red-600 animate-pulse scale-110" : "text-slate-400 hover:text-blue-600"
                      )}
                      title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    {currentLayout !== 'instagram' && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xl text-slate-400 hover:text-blue-600 transition-colors"
                        title="Upload Photo"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input && !selectedImage)}
                  className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center futuristic-btn disabled:opacity-30 disabled:grayscale",
                    currentLayout === 'whatsapp' 
                      ? "bg-[#075E54] text-white shadow-md glow-blue" :
                    currentLayout === 'instagram' 
                      ? "bg-transparent text-blue-500 font-bold text-sm"
                      : "bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 glow-blue border-4 border-white/20"
                  )}
                >
                  {currentLayout === 'instagram' ? "Post" : <Send className={cn("w-6 h-6", currentLayout === 'whatsapp' ? "" : "rotate-45 -translate-y-0.5 translate-x-0.5")} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <SettingsView 
            logoSettings={logoSettings} 
            setLogoSettings={setLogoSettings} 
            openProgramModal={() => setIsProgramModalOpen(true)}
            currentProgram={currentProgram}
          />
        )}

        {/* Connectivity Notification (Floating) */}
        <AnimatePresence>
          {isProgramModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProgramModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Change Program</h2>
                  <button 
                    onClick={() => setIsProgramModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <p className="text-sm text-slate-500 font-medium mb-6">Please choose a new program configuration for the AI assistant:</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Program</label>
                    <select 
                      id="programSelect"
                      value={currentProgram}
                      onChange={(e) => setCurrentProgram(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="program1">Program 1: Health Assistant</option>
                      <option value="program2">Program 2: Creative Mode</option>
                      <option value="program3">Program 3: Technical Expert</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      // Logic for program change can go here
                      setIsProgramModalOpen(false);
                      // Since window.alert is blocked, we use the UI feedback
                      // In a real app we might update some global context or instructions
                    }}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all glow-blue mt-4"
                  >
                    Confirm Selection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Connectivity Notification (Floating) */}
        <AnimatePresence>
          {!isLoading && !isReconnecting && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 right-8 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl z-40 hidden sm:flex"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
              AI Assistant Ready
            </motion.div>
          )}
        </AnimatePresence>
        
        {isReconnecting && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 right-8 flex items-center gap-2.5 bg-amber-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl z-40"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Optimizing Performance...
          </motion.div>
        )}

        <Toaster position="top-center" richColors closeButton />
      </main>
      </div>

      {/* Persona Selection Modal */}
      <AnimatePresence>
        {isPersonaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPersonaModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Wand2 className="w-6 h-6 text-amber-500" />
                    AI Personas
                  </h2>
                  <p className="text-sm font-medium text-slate-500">AI ka baat karne ka andaaz (style) chunein.</p>
                </div>
                <button 
                  onClick={() => setIsPersonaModalOpen(false)}
                  className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Custom Creator */}
                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] space-y-4">
                  <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Custom Persona Banayen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Naam (e.g. History Guru)" 
                      value={newPersona.name}
                      onChange={e => setNewPersona(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-4 rounded-2xl bg-white border border-blue-100 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <input 
                      type="text" 
                      placeholder="Choti description" 
                      value={newPersona.description}
                      onChange={e => setNewPersona(prev => ({...prev, description: e.target.value}))}
                      className="w-full p-4 rounded-2xl bg-white border border-blue-100 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <textarea 
                    placeholder="AI ko kia instruction deni hai? (e.g. Aap hamesha bachon ki tarah samjhayen...)" 
                    value={newPersona.instruction}
                    onChange={e => setNewPersona(prev => ({...prev, instruction: e.target.value}))}
                    className="w-full p-4 rounded-2xl bg-white border border-blue-100 text-sm font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                  />
                  <button 
                    onClick={() => {
                      if (!newPersona.name || !newPersona.instruction) {
                        toast.error("Naam aur instructions dono lazmi hain.");
                        return;
                      }
                      const id = 'custom-' + Date.now();
                      setCustomPersonas(prev => [...prev, { ...newPersona, id }]);
                      setSelectedPersonaId(id);
                      setNewPersona({ name: '', description: '', instruction: '' });
                      toast.success("Naya Persona save ho gaya!");
                    }}
                    className="w-full p-4 rounded-2xl bg-blue-600 text-white text-xs font-black tracking-widest uppercase futuristic-btn"
                  >
                    Save & Apply Persona
                  </button>
                </div>

                {/* Grid of Personas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allPersonas.map(persona => (
                    <motion.div
                      key={persona.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedPersonaId(persona.id);
                        setIsPersonaModalOpen(false);
                        toast.success(`${persona.name} applied!`);
                      }}
                      className={cn(
                        "p-6 rounded-[2rem] text-left transition-all border-2 relative group cursor-pointer",
                        selectedPersonaId === persona.id 
                          ? "bg-amber-50 border-amber-500 shadow-xl shadow-amber-500/10" 
                          : "bg-white border-slate-100 hover:border-slate-300"
                      )}
                    >
                      {persona.id.startsWith('custom-') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Is persona ko delete karein?")) {
                              setCustomPersonas(prev => prev.filter(p => p.id !== persona.id));
                              if (selectedPersonaId === persona.id) setSelectedPersonaId('default');
                            }
                          }}
                          className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          selectedPersonaId === persona.id ? "bg-amber-500 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                        )}>
                          {persona.id === 'default' ? <Bot className="w-5 h-5" /> : 
                           persona.id === 'expert' ? <Cpu className="w-5 h-5" /> :
                           persona.id === 'writer' ? <Type className="w-5 h-5" /> :
                           persona.id === 'friend' ? <MessageSquare className="w-5 h-5" /> :
                           <Sparkles className="w-5 h-5" />}
                        </div>
                        <h4 className="font-black text-slate-800 tracking-tight">{persona.name}</h4>
                      </div>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">{persona.description}</p>
                      
                      {selectedPersonaId === persona.id && (
                        <motion.div 
                          layoutId="persona-active"
                          className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-br-2xl rounded-tl-xl shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          style: {
            borderRadius: '1.5rem',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }
        }}
      />
    </div>
  );
}

function SettingsView({ 
  logoSettings, 
  setLogoSettings, 
  openProgramModal,
  currentProgram
}: { 
  logoSettings: LogoSettings, 
  setLogoSettings: React.Dispatch<React.SetStateAction<LogoSettings>>,
  openProgramModal: () => void,
  currentProgram: string
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4">
            <Logo settings={logoSettings} className="w-14 h-14" />
            User Profile & Settings
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage your account preferences and AI personalization.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          {/* Section 1: Account Profile */}
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] sleek-shadow border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Profile Information
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-105 transition-all">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent("sanaullahkhanyousafzai7@gmail.com")}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg futuristic-btn">
                     <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" defaultValue="Sanaullah Khan" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input type="email" defaultValue="sanaullahkhanyousafzai7@gmail.com" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700" />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      toast.success("Profile preferences save ho gayin!");
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold futuristic-btn glow-blue"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] sleek-shadow border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                AI Logo & Brand Settings
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Brand Logo (PNG)</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="flex-1 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 group"
                      >
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-500">Transparent PNG</span>
                      </button>
                      <input 
                        id="logo-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/png" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoSettings(prev => ({ ...prev, customLogo: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {logoSettings.customLogo && (
                        <button 
                          onClick={() => setLogoSettings(prev => ({ ...prev, customLogo: null }))}
                          className="p-4 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors flex flex-col items-center justify-center gap-2"
                        >
                          <Trash2 className="w-6 h-6" />
                          <span className="text-[10px] font-bold">Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Icon */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Assistant Identity</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['bot', 'sparkles', 'cpu', 'zap'] as const).map(icon => {
                         const Icon = { bot: Bot, sparkles: Sparkles, cpu: Cpu, zap: Zap }[icon];
                         return (
                           <button 
                             key={icon}
                             onClick={() => setLogoSettings(prev => ({ ...prev, aiIcon: icon }))}
                             className={cn(
                               "p-3 rounded-xl border flex items-center justify-center transition-all",
                               logoSettings.aiIcon === icon ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
                             )}
                           >
                             <Icon className="w-5 h-5" />
                           </button>
                         )
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="flex-1">
                         <p className="font-bold text-sm text-slate-800 tracking-tight">Logo Scale</p>
                         <input 
                           type="range" 
                           min="50" 
                           max="150" 
                           value={logoSettings.logoSize} 
                           onChange={(e) => setLogoSettings(prev => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                           className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                         />
                       </div>
                       <span className="text-[10px] font-black text-slate-400 w-8 text-right ml-2">{logoSettings.logoSize}%</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div>
                         <p className="font-bold text-sm text-slate-800 tracking-tight">Robot Motion</p>
                         <p className="text-[11px] text-slate-400 font-medium">Float animations</p>
                       </div>
                       <button 
                         onClick={() => setLogoSettings(prev => ({ ...prev, isAnimated: !prev.isAnimated }))}
                         className={cn(
                           "w-12 h-6 rounded-full relative transition-colors cursor-pointer",
                           logoSettings.isAnimated ? "bg-blue-600" : "bg-slate-200"
                         )}
                       >
                          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all", logoSettings.isAnimated ? "right-1" : "left-1")}></div>
                       </button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="p-4 rounded-3xl bg-slate-900 flex flex-col items-center justify-center gap-4 relative overflow-hidden min-h-[140px] shadow-xl">
                     <Logo settings={logoSettings} className="w-16 h-16" />
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">Live Preview</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] sleek-shadow border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Personalization
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                   <div>
                     <p className="font-bold text-sm text-slate-800 tracking-tight">AI Assistant Personality</p>
                     <p className="text-[10px] font-medium text-slate-500">Customizes tone and response style.</p>
                   </div>
                   <select className="bg-white border border-amber-200 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer">
                      <option>Empathetic (Health Focus)</option>
                      <option>Ultra-Professional</option>
                      <option> Casual & Friendly</option>
                      <option>Concise (Speed Mode)</option>
                   </select>
                </div>

                {/* Program Change Button */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800 shadow-xl overflow-hidden relative group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                   <div className="relative z-10">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Advanced Scaling</p>
                     <p className="font-bold text-sm">Target Program: <span className="text-blue-400">{currentProgram.toUpperCase()}</span></p>
                   </div>
                   <button 
                     onClick={openProgramModal}
                     id="changeProgramBtn"
                     className="relative z-10 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                   >
                     Change Program
                   </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                   <div>
                     <p className="font-bold text-sm text-slate-800 tracking-tight">Memory Lane</p>
                     <p className="text-[10px] font-medium text-slate-500">Enable AI to learn from previous chats.</p>
                   </div>
                   <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                      <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                   </div>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <p className="font-bold text-sm text-slate-800 tracking-tight">Muje is naam se bulayein (Call me...)</p>
                   <input type="text" placeholder="e.g. Sana" className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                   <p className="text-[10px] font-medium text-slate-500">AI aapko is naam se مخاطب (address) karega.</p>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Custom AI Instructions</label>
                   <textarea 
                     placeholder="e.g. Always explain medical terms in Roman Urdu. Be very polite."
                     className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium min-h-[100px] outline-none focus:ring-2 focus:ring-blue-100 resize-none transition-all"
                   ></textarea>
                   <p className="text-[10px] text-slate-400 font-medium">Ye instructions AI ke har response ko affect karengi.</p>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-amber-50/30 border border-amber-100 mt-4">
                   <p className="font-bold text-[10px] text-amber-700 tracking-tight uppercase">Privacy Note</p>
                   <p className="text-[10px] text-slate-500">Your data is processed locally on your device specifically for this session. No training data is shared.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white p-8 rounded-[2.5rem] sleek-shadow border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Privacy & Data Security
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-bold text-sm text-slate-800">Two-Factor Authentication</p>
                       <p className="text-[10px] text-slate-500">Secure your account with 2FA.</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase">Disabled</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Download className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-bold text-sm text-slate-800">Export Personal Data</p>
                       <p className="text-[10px] text-slate-500">Download your chat history and profile.</p>
                     </div>
                   </div>
                   <button className="text-xs font-black text-blue-600 hover:underline">Request ZIP</button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section 2: Quick Preferences */}
          <div className="space-y-6">
             <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-[2.5rem] sleek-shadow border border-slate-100"
             >
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Preferences</h4>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Language</span>
                      <span className="text-xs font-black text-blue-600 italic">Roman Urdu</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Display Theme</span>
                      <select className="text-[11px] font-black text-blue-600 bg-transparent outline-none cursor-pointer text-right">
                         <option>Modern Light</option>
                         <option>OLED Dark</option>
                         <option>System Default</option>
                      </select>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Notifications</span>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                         <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                   </div>
                </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-rose-50/30 p-6 rounded-[2.5rem] border border-rose-100"
             >
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4">Account Danger Zone</h4>
                <button 
                  onClick={() => {
                    if (window.confirm("Kya aap waqai apna health data delete karna chahte hain? Ye wapas nahi aa sakega.")) {
                      toast.success("Health data delete ho gaya.");
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-white border border-rose-100 text-rose-500 text-xs font-black tracking-widest futuristic-btn flex items-center justify-center gap-2 uppercase"
                >
                   <Trash2 className="w-4 h-4" />
                   Delete Health Data
                </button>
             </motion.div>
           </div>
         </div>
       </div>
    </div>
  );
}


