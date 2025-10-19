
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type Message, type UploadedFile } from '../types';
import { startChatSession, generateImage, editImage } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon, PaperclipIcon, XCircleIcon, FileTextIcon } from './Icons';
import MessageDisplay from './MessageDisplay';
import LoadingSpinner from './LoadingSpinner';
import ImageModal from './ImageModal';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; previewUrl: string | null } | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatSessionRef.current = startChatSession();
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          setUploadedFile({ 
            file, 
            previewUrl: loadEvent.target?.result as string 
          });
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFile({ file, previewUrl: null });
      }
    }
  };
  
  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput || isLoading) return;

    const userMessage: Message = { 
        role: 'user', 
        parts: currentInput,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.file.name,
          previewUrl: uploadedFile.previewUrl,
          isImage: !!uploadedFile.previewUrl,
        } : undefined
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);
    setError(null);

    try {
        if (uploadedFile) {
            const isImage = uploadedFile.file.type.startsWith('image/');
            if (isImage) {
                const base64ImageData = await fileToBase64(uploadedFile.file);
                const editedImageData = await editImage(currentInput, base64ImageData, uploadedFile.file.type);
                const imageUrl = `data:image/png;base64,${editedImageData}`;
                const modelMessage: Message = { role: 'model', parts: `Here's the edited image based on your request: "${currentInput}"`, imageUrl };
                setMessages((prev) => [...prev, modelMessage]);
            } else {
                // Handle non-image files
                if (!chatSessionRef.current) throw new Error('Chat session not initialized.');
                const base64Data = await fileToBase64(uploadedFile.file);
                // FIX: The `sendMessage` method expects a `message` property, not `parts`.
                // The `message` property can accept an array of parts for multimodal input.
                const response = await chatSessionRef.current.sendMessage({
                  message: [
                    { text: currentInput },
                    { inlineData: { data: base64Data, mimeType: uploadedFile.file.type } }
                  ]
                });
                const modelMessage: Message = { role: 'model', parts: response.text };
                setMessages((prev) => [...prev, modelMessage]);
            }
        } else {
            if (!chatSessionRef.current) throw new Error('Chat session not initialized.');
            
            const response = await chatSessionRef.current.sendMessage({ message: currentInput });
            const functionCall = response.functionCalls?.[0];

            if (functionCall?.name === 'generateImage' && functionCall.args.prompt) {
                const { prompt, width, height } = functionCall.args;
                const base64ImageData = await generateImage(prompt as string, width as number | undefined, height as number | undefined);
                const imageUrl = `data:image/png;base64,${base64ImageData}`;
                const modelMessage: Message = { role: 'model', parts: `Here's an image for: "${prompt}"`, imageUrl };
                setMessages((prev) => [...prev, modelMessage]);
            } else {
                const modelMessage: Message = { role: 'model', parts: response.text };
                setMessages((prev) => [...prev, modelMessage]);
            }
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(`Error: ${errorMessage}`);
      if (!uploadedFile) {
          setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'model' && lastMessage.parts === '') {
                  return prev.slice(0, -1);
              }
              return prev;
          });
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, uploadedFile]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={chatHistoryRef} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {messages.map((msg, index) => (
          <MessageDisplay 
            key={index} 
            message={msg} 
            onImageClick={(url) => setModalImageUrl(url)}
          />
        ))}
        {isLoading && (
            <div className="flex justify-start"><div className="p-2"><LoadingSpinner /></div></div>
        )}
      </div>

      {error && (
        <div className="px-6 pb-2 text-red-600"><p>{error}</p></div>
      )}

      <div className="p-4 bg-white border-t border-gray-200">
        {uploadedFile && (
          <div className="relative inline-block mb-2 p-2 bg-gray-100 rounded-lg">
             <div className="flex items-start">
              {uploadedFile.previewUrl ? (
                <img src={uploadedFile.previewUrl} alt="Upload preview" className="h-20 w-20 object-cover rounded-lg" />
              ) : (
                <div className="h-20 w-20 flex flex-col items-center justify-center bg-gray-200 rounded-lg p-2">
                  <FileTextIcon className="w-8 h-8 text-gray-500 mb-1" />
                  <span className="text-xs text-center text-gray-600 break-all truncate w-full">{uploadedFile.file.name}</span>
                </div>
              )}
              <button
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none"
                aria-label="Remove file"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
            aria-label="Attach file"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={uploadedFile ? "Ask a question about the file..." : "Type your message..."}
            className="flex-1 w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !uploadedFile)}
            className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
      {modalImageUrl && (
        <ImageModal imageUrl={modalImageUrl} onClose={() => setModalImageUrl(null)} />
      )}
    </div>
  );
};

export default ChatWindow;
