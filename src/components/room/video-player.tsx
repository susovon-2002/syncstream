'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMediaTabs } from './add-media-tabs';
import { Card } from '../ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ScreenShare, ScreenShareOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/lazy';
import { useMemoFirebase } from '@/firebase/provider';

type MediaSource = 'youtube' | 'file' | null;

interface VideoPlayerProps {
  roomId: string;
  isHost: boolean;
}

export function VideoPlayer({ roomId, isHost }: VideoPlayerProps) {
  const { firestore } = useFirebase();

  // Component State
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);

  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const seekingRef = useRef(false);

  // Firebase Room State
  const roomRef = useMemoFirebase(() => doc(firestore, 'rooms', roomId), [firestore, roomId]);
  const [roomState, loadingRoomState] = useDocumentData(roomRef);

  const mediaUrl = roomState?.media?.url;
  const isPlaying = roomState?.playback?.isPlaying;
  const isScreenSharing = roomState?.screenShare?.active;

  // Derived State
  const placeholderImage = PlaceHolderImages.find((p) => p.id === 'video-placeholder');
  const displayMediaUrl = isScreenSharing && !isHost ? mediaUrl : localScreenStream;

  // Sync client player to Firebase state
  useEffect(() => {
    const video = playerRef.current;
    if (!video || !roomState?.playback?.lastUpdated || seekingRef.current || !isReady || isScreenSharing) return;

    if (video.props.playing !== isPlaying) {
      // Handled by ReactPlayer's `playing` prop
    }
    
    if(!roomState.playback.lastUpdated) return;

    const serverTime = roomState.playback.lastUpdated.toDate().getTime();
    const clientTime = new Date().getTime();
    const timeDiff = (clientTime - serverTime) / 1000;
    
    let targetTime = roomState.playback.progress;
    if(isPlaying) {
        targetTime += timeDiff;
    }

    const localTime = video.getCurrentTime();

    if (Math.abs(targetTime - localTime) > 2) {
      video.seekTo(targetTime, 'seconds');
    }

  }, [roomState, isReady, isPlaying, isScreenSharing]);


  const updatePlaybackState = (state: any) => {
    if (!isHost || !roomRef) return;
    setDocumentNonBlocking(roomRef, {
        playback: {
          ...roomState?.playback,
          ...state,
          lastUpdated: serverTimestamp(),
        },
      },
      { merge: true }
    );
  };

  const handleSelectMedia = (url: string, title: string, source: 'youtube' | 'file') => {
    if (!isHost || !roomRef) return;
     setDocumentNonBlocking(roomRef, {
        media: { url, title, source },
        playback: {
          isPlaying: false,
          progress: 0,
          lastUpdated: serverTimestamp(),
        },
        screenShare: { active: false },
      },
      { merge: true }
    );
  };

  const handlePlay = () => isHost && !isScreenSharing && updatePlaybackState({ isPlaying: true });
  const handlePause = () => isHost && !isScreenSharing && updatePlaybackState({ isPlaying: false });
  
  const handleProgress = (state: { playedSeconds: number }) => {
    if (isScreenSharing) return;
    setProgress(state.playedSeconds);
     if (isHost && !seekingRef.current) {
        updatePlaybackState({ progress: state.playedSeconds });
    }
  };

  const handleSeek = (value: number[]) => {
    if (isScreenSharing) return;
    const newTime = value[0];
    setProgress(newTime);
    if(isHost) {
        if(playerRef.current) playerRef.current.seekTo(newTime, 'seconds');
        updatePlaybackState({ progress: newTime });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => setIsMuted(!isMuted);

  const handleFullscreenToggle = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleScreenShareToggle = async () => {
    if (!isHost) return;

    if (isScreenSharing) {
        // Stop screen sharing
        localScreenStream?.getTracks().forEach(track => track.stop());
        setLocalScreenStream(null);
        setDocumentNonBlocking(roomRef, { screenShare: { active: false } }, { merge: true });
    } else {
        // Start screen sharing
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setLocalScreenStream(stream);

            // Listen for the user stopping the share from the browser UI
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                setLocalScreenStream(null);
                setDocumentNonBlocking(roomRef, { screenShare: { active: false } }, { merge: true });
            });

            // Use a placeholder URL for other clients; they won't use it directly
            setDocumentNonBlocking(roomRef, {
                media: { url: 'screenshare://active', title: 'Screen Share', source: 'file' },
                screenShare: { active: true },
                playback: { isPlaying: true }
            }, { merge: true });

        } catch (error) {
            console.error("Error starting screen share:", error);
        }
    }
};

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);


  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card ref={playerContainerRef} className="h-full w-full bg-card/80 flex flex-col items-center justify-center relative overflow-hidden group">
      {(!mediaUrl && !isScreenSharing) ? (
        <div className="w-full max-w-lg p-4">
          {isHost ? (
            <AddMediaTabs onUrlSelect={handleSelectMedia} />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Waiting for the host to select a video...</p>
            </div>
          )}
        </div>
      ) : (
        <ReactPlayer
            ref={playerRef}
            url={displayMediaUrl || mediaUrl}
            playing={isPlaying}
            controls={false}
            volume={volume}
            muted={isMuted}
            width="100%"
            height="100%"
            onReady={() => setIsReady(true)}
            onPlay={handlePlay}
            onPause={handlePause}
            onProgress={handleProgress}
            onDuration={setDuration}
            progressInterval={1000}
            config={{
                youtube: { playerVars: { showinfo: 0, controls: 0 } },
                file: { attributes: { style: { objectFit: 'contain' } } }
            }}
        />
      )}

      {(mediaUrl || isScreenSharing || isHost) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {(mediaUrl && !isScreenSharing) && (
            <div className="flex flex-col gap-2">
              <Slider
                value={[progress]}
                max={duration}
                onValueChange={handleSeek}
                onPointerDown={() => seekingRef.current = true}
                onPointerUp={() => seekingRef.current = false}
                className="w-full cursor-pointer"
                disabled={!isHost}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-white mt-2">
            <div className="flex items-center gap-4">
              {isHost && mediaUrl && !isScreenSharing && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={isPlaying ? handlePause : handlePlay}>
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
              )}
              {isHost && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleScreenShareToggle}>
                  {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
                </Button>
              )}
              {(mediaUrl || isScreenSharing) && (
                <>
                  <div className="flex items-center gap-2 w-32">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleMuteToggle}>
                      {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                    </Button>
                    <Slider value={[isMuted ? 0 : volume]} max={1} step={0.05} onValueChange={handleVolumeChange} className="cursor-pointer"/>
                  </div>
                  {!isScreenSharing && (
                    <div className="text-xs font-mono">
                      <span>{formatTime(progress)}</span> / <span>{formatTime(duration)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            {(mediaUrl || isScreenSharing) && (
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreenToggle}>
                {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            )}
          </div>
        </div>
      )}

      {!mediaUrl && placeholderImage && !isScreenSharing &&(
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
