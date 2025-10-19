import React from 'react';
import { BotIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center p-4 bg-white border-b border-gray-100">
      <BotIcon className="w-8 h-8 text-blue-600 mr-3" />
      <h1 className="text-2xl font-bold tracking-wider text-gray-900">
        Aether Chat
      </h1>
    </header>
  );
};

export default Header;