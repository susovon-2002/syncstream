'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMediaTabs } from './add-media-tabs';
import { Card } from '../ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Camera, Video as VideoIcon, Circle } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/lazy';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  roomId: string;
}

export function VideoPlayer({ roomId }: VideoPlayerProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // Component State
  const [localMedia, setLocalMedia] = useState<string | MediaStream | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const seekingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Firebase Room State
  const roomRef = useMemoFirebase(() => doc(firestore, 'rooms', roomId), [firestore, roomId]);
  const [roomState, loadingRoomState] = useDocumentData(roomRef);
  
  const isHost = user && roomState ? roomState.hostId === user.uid : false;
  const isMember = user && roomState ? user.uid in roomState.members : false;

  const isScreenShare = roomState?.media?.source === 'screen';
  const mediaUrl = isScreenShare ? localMedia : roomState?.media?.url;
  const isPlaying = roomState?.playback?.isPlaying;

  // Derived State
  const placeholderImage = PlaceHolderImages.find((p) => p.id === 'video-placeholder');
  
  // Sync client player to Firebase state
  useEffect(() => {
    const video = playerRef.current;
    if (!video || !roomState?.playback || seekingRef.current || !isReady || isScreenShare) return;

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

  }, [roomState, isReady, isPlaying, isScreenShare]);


  const updatePlaybackState = (state: any) => {
    if (!roomRef || isScreenShare || !isMember) return;
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

  const handleSelectMedia = (url: string | MediaStream, title: string, source: 'youtube' | 'file' | 'screen') => {
    if (!isHost || !roomRef) return;
    
    if (source === 'screen' && url instanceof MediaStream) {
      setLocalMedia(url);
      setDocumentNonBlocking(roomRef, {
        media: { url: null, title, source },
        playback: { isPlaying: true, progress: 0, lastUpdated: serverTimestamp() }
      }, { merge: true });

      url.getVideoTracks()[0].onended = () => {
        setLocalMedia(null);
        setDocumentNonBlocking(roomRef, { media: null, playback: null }, { merge: true });
      };

    } else if (typeof url === 'string') {
      if (localMedia) {
        if (localMedia instanceof MediaStream) {
            localMedia.getTracks().forEach(track => track.stop());
        }
        setLocalMedia(null);
      }
      setDocumentNonBlocking(roomRef, {
          media: { url, title, source },
          playback: { isPlaying: false, progress: 0, lastUpdated: serverTimestamp() }
        },
        { merge: true }
      );
    }
  };

  const handlePlay = () => updatePlaybackState({ isPlaying: true });
  const handlePause = () => updatePlaybackState({ isPlaying: false });
  
  const handleProgress = (state: { playedSeconds: number }) => {
    setProgress(state.playedSeconds);
     if (isMember && !seekingRef.current && !isScreenShare) {
        // More frequent updates can be taxing, let's allow host to be the main source of truth
        if (isHost) {
          updatePlaybackState({ progress: state.playedSeconds });
        }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setProgress(newTime);
    if (!isScreenShare) {
      if (playerRef.current) playerRef.current.seekTo(newTime, 'seconds');
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

  const handleScreenshot = () => {
    if (!playerRef.current) return;
    const player = playerRef.current.getInternalPlayer() as HTMLVideoElement;
    if (!player) return;

    const canvas = document.createElement('canvas');
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `syncstream-screenshot-${new Date().toISOString()}.png`;
    a.click();
    toast({ title: "Screenshot saved!" });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      if (!playerRef.current) return;
      const player = playerRef.current.getInternalPlayer() as HTMLVideoElement;
      if (!player) return;

      const stream = (player as any).captureStream();
      if (!stream) {
        toast({ variant: 'destructive', title: 'Could not start recording', description: 'Unable to capture video stream.' });
        return;
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syncstream-recording-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Recording saved!" });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started..." });
    }
  };

  useEffect(() => {
    if (mediaRecorderRef.current?.state === 'recording' && !isPlaying) {
      // If playback pauses, stop the recording to prevent silent videos
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isPlaying]);

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

  const showPlayer = !!mediaUrl || (isHost && isScreenShare);

  return (
    <Card ref={playerContainerRef} className="h-full w-full bg-card/80 flex flex-col items-center justify-center relative overflow-hidden group">
      {!showPlayer ? (
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
            url={mediaUrl as (string | MediaStream)}
            playing={isPlaying}
            controls={false}
            volume={volume}
            muted={isMuted}
            width="100%"
            height="100%"
            onReady={() => setIsReady(true)}
            onPlay={isMember ? handlePlay : undefined}
            onPause={isMember ? handlePause : undefined}
            onProgress={handleProgress}
            onDuration={setDuration}
            progressInterval={1000}
            config={{
                youtube: { playerVars: { showinfo: 0, controls: 0 } },
                file: { attributes: { style: { objectFit: 'contain' }, crossOrigin: 'anonymous' } }
            }}
        />
      )}

      {showPlayer && !isScreenShare && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-2">
            <Slider
              value={[progress]}
              max={duration}
              onValueChange={isMember ? handleSeek : undefined}
              onPointerDown={() => seekingRef.current = true}
              onPointerUp={() => seekingRef.current = false}
              className={isMember ? "cursor-pointer" : "cursor-default"}
              disabled={!isMember}
            />
          </div>
          <div className="flex items-center justify-between text-white mt-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={isPlaying ? handlePause : handlePlay} disabled={!isMember}>
                {isPlaying ? <Pause /> : <Play />}
              </Button>
              <div className="flex items-center gap-2 w-32">
                <Button variant="ghost" size="icon" className="text-white hover-bg-white/10" onClick={handleMuteToggle}>
                  {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                </Button>
                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.05} onValueChange={handleVolumeChange} className="cursor-pointer"/>
              </div>
              <div className="text-xs font-mono">
                <span>{formatTime(progress)}</span> / <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {isHost && (
                    <>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleScreenshot}>
                            <Camera />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleToggleRecording}>
                            {isRecording ? <Circle className="text-red-500 fill-current" /> : <VideoIcon />}
                        </Button>
                    </>
                )}
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreenToggle}>
                {isFullscreen ? <Minimize /> : <Maximize />}
                </Button>
            </div>
          </div>
        </div>
      )}

      {!showPlayer && placeholderImage && (
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
