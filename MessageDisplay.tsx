import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Message } from '../types';
import { DownloadIcon, FileTextIcon } from './Icons';

interface MessageDisplayProps {
  message: Message;
  onImageClick: (url: string) => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onImageClick }) => {
  const isModel = message.role === 'model';

  if (isModel) {
    // Model messages are formatted markdown or an image block, aligned left
    return (
      <div className="flex justify-start">
        <div className="max-w-xl md:max-w-2xl">
          {message.imageUrl ? (
            <div className="relative group inline-block bg-gray-100 p-2 rounded-lg">
              {message.parts && <p className="whitespace-pre-wrap text-gray-600 italic mb-2">{message.parts}</p>}
              <img
                src={message.imageUrl}
                alt={message.parts}
                className="rounded-lg shadow-md bg-white max-w-full h-auto cursor-pointer"
                aria-label={`Generated image for: ${message.parts}`}
                onClick={() => onImageClick(message.imageUrl!)}
              />
              <a
                href={message.imageUrl}
                download={`aether-image-${new Date().getTime()}.png`}
                className="absolute top-4 right-4 bg-gray-900 bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                aria-label="Download image"
              >
                <DownloadIcon className="w-5 h-5" />
              </a>
            </div>
          ) : (
            // FIX: The ReactMarkdown component does not accept a `className` prop. The className has been moved to a wrapping div.
            <div className="text-gray-800 leading-relaxed [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                }}
              >
                {message.parts}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User messages are in a gray bubble, aligned right
  return (
    <div className="flex justify-end">
      <div className="max-w-xl md:max-w-2xl px-4 py-2 bg-gray-200 text-gray-800 rounded-2xl">
        {message.uploadedFile && (
            <div className="bg-white/70 p-2 rounded-lg mb-2">
                {message.uploadedFile.isImage && message.uploadedFile.previewUrl ? (
                    <img 
                        src={message.uploadedFile.previewUrl} 
                        alt={message.uploadedFile.name} 
                        className="rounded-md max-w-xs h-auto"
                    />
                ) : (
                    <div className="flex items-center space-x-2">
                        <FileTextIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-800 truncate">{message.uploadedFile.name}</span>
                    </div>
                )}
            </div>
        )}
        <p className="whitespace-pre-wrap">{message.parts}</p>
      </div>
    </div>
  );
};

export default MessageDisplay;