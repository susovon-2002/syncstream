'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const challenges = [
  {
    label: 'traffic lights',
    images: [
      { id: 1, src: 'https://picsum.photos/seed/1/200/200', hint: 'traffic light' },
      { id: 2, src: 'https://picsum.photos/seed/2/200/200', hint: 'bicycle' },
      { id: 3, src: 'https://picsum.photos/seed/3/200/200', hint: 'traffic light' },
      { id: 4, src: 'https://picsum.photos/seed/4/200/200', hint: 'bridge' },
      { id: 5, src: 'https://picsum.photos/seed/5/200/200', hint: 'traffic light' },
      { id: 6, src: 'https://picsum.photos/seed/6/200/200', hint: 'road' },
      { id: 7, src: 'https://picsum.photos/seed/7/200/200', hint: 'car' },
      { id: 8, src: 'https://picsum.photos/seed/8/200/200', hint: 'traffic light' },
      { id: 9, src: 'https://picsum.photos/seed/9/200/200', hint: 'building' },
    ],
  },
  {
    label: 'bicycles',
    images: [
      { id: 10, src: 'https://picsum.photos/seed/10/200/200', hint: 'tree' },
      { id: 11, src: 'https://picsum.photos/seed/11/200/200', hint: 'bicycle' },
      { id: 12, src: 'https://picsum.photos/seed/12/200/200', hint: 'car' },
      { id: 13, src: 'https://picsum.photos/seed/13/200/200', hint: 'bicycle' },
      { id: 14, src: 'https://picsum.photos/seed/14/200/200', hint: 'building' },
      { id: 15, src: 'https://picsum.photos/seed/15/200/200', hint: 'road' },
      { id: 16, src: 'https://picsum.photos/seed/16/200/200', hint: 'bicycle' },
      { id: 17, src: 'https://picsum.photos/seed/17/200/200', hint: 'river' },
      { id: 18, src: 'https://picsum.photos/seed/18/200/200', hint: 'bicycle' },
    ],
  },
    {
    label: 'bridges',
    images: [
      { id: 19, src: 'https://picsum.photos/seed/19/200/200', hint: 'bridge' },
      { id: 20, src: 'https://picsum.photos/seed/20/200/200', hint: 'car' },
      { id: 21, src: 'https://picsum.photos/seed/21/200/200', hint: 'mountain' },
      { id: 22, src: 'https://picsum.photos/seed/22/200/200', hint: 'bridge' },
      { id: 23, src: 'https://picsum.photos/seed/23/200/200', hint: 'road' },
      { id: 24, src: 'https://picsum.photos/seed/24/200/200', hint: 'tree' },
      { id: 25, src: 'https://picsum.photos/seed/25/200/200', hint: 'bridge' },
      { id: 26, src: 'https://picsum.photos/seed/26/200/200', hint: 'river' },
      { id: 27, src: 'https://picsum.photos/seed/27/200/200', hint: 'building' },
    ],
  },
];

const shuffleArray = (array: any[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

interface CaptchaChallengeProps {
    onVerified: (isVerified: boolean) => void;
}

export function CaptchaChallenge({ onVerified }: CaptchaChallengeProps) {
  const [challenge, setChallenge] = useState(challenges[0]);
  const [images, setImages] = useState(shuffleArray([...challenge.images]));
  const [selected, setSelected] = useState<number[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  
  const correctImageIds = useMemo(() => 
    challenge.images.filter(img => img.hint === challenge.label).map(img => img.id),
    [challenge]
  );

  useEffect(() => {
    handleReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onVerified(isVerified);
  }, [isVerified, onVerified]);


  const handleSelect = (id: number) => {
    if (isVerified) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleVerify = () => {
    const isCorrect = selected.length === correctImageIds.length && selected.every(id => correctImageIds.includes(id));
    if (isCorrect) {
      setIsVerified(true);
    } else {
      handleReset();
    }
  };

  const handleReset = () => {
    setSelected([]);
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setChallenge(randomChallenge);
    setImages(shuffleArray([...randomChallenge.images]));
    setIsVerified(false);
  }

  if (isVerified) {
    return (
        <div className="flex items-center justify-center p-4 rounded-md bg-green-500/10 border border-green-500/20">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            <p className="font-semibold text-green-400">You are verified!</p>
        </div>
    );
  }

  return (
    <div className="p-4 border rounded-md bg-card">
      <div className="p-3 bg-primary text-primary-foreground rounded-t-md">
        <p className="text-sm">Select all images with</p>
        <p className="text-2xl font-bold">{challenge.label}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 bg-primary/10">
        {images.map(image => (
          <div
            key={image.id}
            className="relative cursor-pointer aspect-square group"
            onClick={() => handleSelect(image.id)}
          >
            <Image 
                src={image.src} 
                alt={image.hint}
                width={100} 
                height={100} 
                className="w-full h-full object-cover" 
                data-ai-hint={image.hint}
            />
            <div className={cn(
              "absolute inset-0 bg-black/50 transition-opacity",
              selected.includes(image.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
            )}>
              {selected.includes(image.id) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Check className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center p-2 rounded-b-md border-t-0 border">
        <Button variant="ghost" size="icon" onClick={handleReset}>
            <RefreshCw className="h-5 w-5" />
        </Button>
        <Button onClick={handleVerify} className="w-32">
            Verify
        </Button>
      </div>
    </div>
  );
}
