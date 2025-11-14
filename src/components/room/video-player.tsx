"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMediaTabs } from './add-media-tabs';
import { Card } from '../ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

export function VideoPlayer({ roomId }: { roomId: string }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const placeholderImage = PlaceHolderImages.find(p => p.id === 'video-placeholder');

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleFullscreenToggle = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => setProgress(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateDuration);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [mediaUrl]);
  
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card ref={playerRef} className="h-full w-full bg-card/80 flex flex-col items-center justify-center relative overflow-hidden group">
      {!mediaUrl ? (
        <div className="w-full max-w-lg p-4">
          <AddMediaTabs onUrlSelect={setMediaUrl} />
        </div>
      ) : (
        <video ref={videoRef} src={mediaUrl} className="h-full w-full object-contain" onClick={handlePlayPause}></video>
      )}

      {mediaUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-2">
            <Slider
              value={[progress]}
              max={duration}
              onValueChange={handleProgressChange}
              className="w-full cursor-pointer"
            />
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handlePlayPause}>
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <div className="flex items-center gap-2 w-32">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleMuteToggle}>
                    {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                  </Button>
                  <Slider value={[isMuted ? 0 : volume]} max={1} step={0.05} onValueChange={handleVolumeChange} className="cursor-pointer"/>
                </div>
                 <div className="text-xs font-mono">
                  <span>{formatTime(progress)}</span> / <span>{formatTime(duration)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreenToggle}>
                {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!mediaUrl && placeholderImage && (
        <Image
          src={placeholderImage.imageUrl}
          alt={placeholderImage.description}
          fill
          className="object-cover -z-10 opacity-20"
          data-ai-hint={placeholderImage.imageHint}
        />
      )}
    </Card>
  );
}
