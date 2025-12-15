import React, { useState, useRef, useEffect } from 'react';
import {
    MessageCircle,
    X,
    Send,
    Phone,
    Clock,
    CheckCircle,
    Paperclip,
    Image as ImageIcon,
    Smile
} from 'lucide-react';

/**
 * ChatWidget - Floating Chat Widget for Customer Support
 * 
 * Features:
 * - Floating action button
 * - Expandable chat interface
 * - Message history
 * - Quick actions (WhatsApp, Call)
 * - Typing indicator
 * - Timestamp display
 */

// Sample messages for demo
const sampleMessages = [
    {
        id: 1,
        type: 'received',
        text: 'مرحباً بك في Fix Zone! كيف يمكننا مساعدتك؟',
        time: new Date(Date.now() - 300000),
        sender: 'فريق الدعم'
    }
];

export default function ChatWidget({ 
    repairId,
    customerName,
    onSendMessage,
    isMinimized = false 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(sampleMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom when new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newMessage = {
            id: Date.now(),
            type: 'sent',
            text: inputValue.trim(),
            time: new Date(),
            sender: customerName || 'أنت'
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        // Simulate response
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const responseMessage = {
                id: Date.now() + 1,
                type: 'received',
                text: getAutoResponse(inputValue),
                time: new Date(),
                sender: 'فريق الدعم'
            };
            setMessages(prev => [...prev, responseMessage]);
        }, 1500);

        // Call external handler if provided
        onSendMessage?.(inputValue.trim());
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleWhatsApp = () => {
        const message = repairId 
            ? `مرحباً، أحتاج مساعدة بخصوص طلب الإصلاح رقم ${repairId}`
            : 'مرحباً، أحتاج مساعدة';
        window.open(
            `https://api.whatsapp.com/send/?phone=%2B201270388043&text=${encodeURIComponent(message)}`,
            '_blank'
        );
    };

    const handleCall = () => {
        window.open('tel:+201270388043', '_self');
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Auto responses based on keywords
    const getAutoResponse = (message) => {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('حالة') || lowerMessage.includes('status')) {
            return repairId 
                ? `يمكنك متابعة حالة طلبك رقم ${repairId} من صفحة التفاصيل. هل تحتاج مساعدة إضافية؟`
                : 'يمكنك متابعة حالة طلباتك من صفحة طلبات الإصلاح. هل تحتاج مساعدة؟';
        }
        
        if (lowerMessage.includes('فاتورة') || lowerMessage.includes('دفع')) {
            return 'يمكنك الاطلاع على فواتيرك من صفحة الفواتير. للدفع، يمكنك زيارة الفرع أو التواصل معنا.';
        }
        
        if (lowerMessage.includes('موقع') || lowerMessage.includes('فرع')) {
            return 'فرعنا في القاهرة - مدينة نصر. للحصول على الاتجاهات، تواصل معنا عبر الواتساب.';
        }
        
        return 'شكراً لرسالتك. سيتواصل معك أحد ممثلي خدمة العملاء قريباً. للرد الفوري، يمكنك التواصل عبر الواتساب.';
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 lg:bottom-6 left-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-light text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
                    style={{ boxShadow: '0 4px 20px rgba(5, 56, 135, 0.4)' }}
                >
                    <MessageCircle className="w-6 h-6" />
                    {/* Notification dot */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    
                    {/* Tooltip */}
                    <span className="absolute right-full mr-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        محادثة مع الدعم
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-blue to-brand-blue-light p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">الدعم الفني</h3>
                                    <div className="flex items-center gap-1 text-xs text-white/80">
                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                        متاح الآن
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handleWhatsApp}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                واتساب
                            </button>
                            <button
                                onClick={handleCall}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                اتصال
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'sent' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                        msg.type === 'sent'
                                            ? 'bg-brand-blue text-white rounded-br-none'
                                            : 'bg-card border border-border text-foreground rounded-bl-none'
                                    }`}
                                >
                                    <p className="text-sm">{msg.text}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                                        msg.type === 'sent' ? 'text-white/70' : 'text-muted-foreground'
                                    }`}>
                                        <Clock className="w-3 h-3" />
                                        {formatTime(msg.time)}
                                        {msg.type === 'sent' && (
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-end">
                                <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-muted rounded-xl px-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="اكتب رسالتك..."
                                    className="flex-1 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                                />
                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                    <Smile className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="p-2.5 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * InlineChatButton - Simple button to open WhatsApp chat
 */
export function InlineChatButton({ repairId, text = 'تحدث مع الدعم' }) {
    const handleClick = () => {
        const message = repairId 
            ? `مرحباً، أحتاج مساعدة بخصوص طلب الإصلاح رقم ${repairId}`
            : 'مرحباً، أحتاج مساعدة';
        window.open(
            `https://api.whatsapp.com/send/?phone=%2B201270388043&text=${encodeURIComponent(message)}`,
            '_blank'
        );
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
            <MessageCircle className="w-5 h-5" />
            {text}
        </button>
    );
}

