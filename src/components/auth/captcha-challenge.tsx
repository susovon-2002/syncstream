'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const generateCaptchaText = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

interface CaptchaChallengeProps {
    onVerified: (isVerified: boolean) => void;
}

export function CaptchaChallenge({ onVerified }: CaptchaChallengeProps) {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    handleReset();
  }, []);

  useEffect(() => {
    onVerified(isVerified);
  }, [isVerified, onVerified]);

  const handleVerify = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsVerified(true);
    } else {
      handleReset();
      setUserInput('');
    }
  };

  const handleReset = () => {
    setCaptchaText(generateCaptchaText());
    setIsVerified(false);
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  }

  if (isVerified) {
    return (
        <div className="flex items-center justify-center p-4 rounded-md bg-green-500/10 border border-green-500/20">
            <p className="font-semibold text-green-400">Verified!</p>
        </div>
    );
  }

  return (
    <div className="p-4 border rounded-md bg-card space-y-4">
        <div className="flex justify-center items-center p-4 bg-muted rounded-md relative select-none">
            <p 
                className="text-4xl font-mono tracking-[0.2em] line-through italic"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M-10 10 l120 0\' stroke=\'%23888888\' stroke-width=\'1\'/%3E%3Cpath d=\'M-10 40 l120 0\' stroke=\'%23888888\' stroke-width=\'1\'/%3E%3Cpath d=\'M-10 70 l120 0\' stroke=\'%23888888\' stroke-width=\'1\'/%3E%3C/svg%3E")',
                    textShadow: '2px 2px 2px rgba(0,0,0,0.2)'
                }}
            >
                {captchaText}
            </p>
            <Button variant="ghost" size="icon" onClick={handleReset} className="absolute top-1 right-1 h-7 w-7">
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex gap-2">
            <Input 
                placeholder="Enter the text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyUp={handleKeyUp}
                className="text-center font-mono tracking-widest"
                aria-label="CAPTCHA input"
            />
            <Button onClick={handleVerify} className="w-32">
                Verify
            </Button>
        </div>
    </div>
  );
}
