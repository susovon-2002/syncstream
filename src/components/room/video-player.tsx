'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddMediaTabs } from './add-media-tabs';
import { Card } from '../ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Camera, Video as VideoIcon, Circle, PenTool, Eraser } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/lazy';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface VideoPlayerProps {
  roomId: string;
}

const drawingColors = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#FFFFFF', '#000000'];

// Robust global reference for the placeholder image to prevent ReferenceError
const GLOBAL_PLACEHOLDER = PlaceHolderImages.find(img => img.id === 'video-placeholder') || PlaceHolderImages[0];

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

  // Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#E53935');
  
  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seekingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Firebase Room State
  const roomRef = useMemoFirebase(() => (firestore && roomId) ? doc(firestore, 'rooms', roomId) : null, [firestore, roomId]);
  const [roomState] = useDocumentData(roomRef);
  
  const isHost = user && roomState ? roomState.hostId === user.uid : false;

  const isScreenShare = roomState?.media?.source === 'screen';
  const isYoutube = roomState?.media?.source === 'youtube';
  const mediaUrl = isScreenShare ? localMedia : roomState?.media?.url;
  const isPlaying = roomState?.playback?.isPlaying;

  // Sync client player to Firebase state
  useEffect(() => {
    const video = playerRef.current;
    if (!video || !roomState?.playback || seekingRef.current || !isReady || isScreenShare) return;

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
    if (!roomRef || isScreenShare || !user) return;
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
     if (user && !seekingRef.current && !isScreenShare) {
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
    const player = playerRef.current.getInternalPlayer();
    if (!player || !(player instanceof HTMLVideoElement)) {
        toast({ variant: "destructive", title: "Cannot take screenshot", description: "This feature is not available for the current video type." });
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `syncstream-screenshot-${new Date().getTime()}.png`;
    a.click();
    toast({ title: "Screenshot saved!" });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!playerRef.current) return;
      const player = playerRef.current.getInternalPlayer();
      if (!player || !(player instanceof HTMLVideoElement)) {
        toast({ variant: 'destructive', title: 'Could not start recording', description: 'This feature is not available for the current video type.' });
        return;
      }
      
      const stream = (player as any).captureStream?.();
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
        a.download = `syncstream-recording-${new Date().getTime()}.webm`;
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

  // Drawing logic
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playerContainerRef.current) return;
    const { width, height } = playerContainerRef.current.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }, [isDrawingMode]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.strokeStyle = drawingColor;
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!isDrawingMode || !isDrawing) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
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
        <>
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
                onPlay={user ? handlePlay : undefined}
                onPause={user ? handlePause : undefined}
                onProgress={handleProgress}
                onDuration={setDuration}
                progressInterval={1000}
                config={{
                    youtube: { playerVars: { showinfo: 0, controls: 0 } },
                    file: { attributes: { style: { objectFit: 'contain' }, crossOrigin: 'anonymous' } }
                }}
            />
            {isDrawingMode && (
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseLeave={finishDrawing}
                />
            )}
        </>
      )}

      {showPlayer && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {isDrawingMode && (
            <div className="absolute bottom-20 left-4 flex gap-2 items-center bg-background/50 p-2 rounded-md">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8" style={{ backgroundColor: drawingColor, border: '2px solid white' }} />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex gap-1">
                    {drawingColors.map(color => (
                      <Button
                        key={color}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: color }}
                        onClick={() => setDrawingColor(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
               <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={clearCanvas}>
                  <Eraser />
                </Button>
            </div>
          )}

          {!isScreenShare && (
            <div className="flex flex-col gap-2">
              <Slider
                value={[progress]}
                max={duration}
                onValueChange={user ? handleSeek : undefined}
                onPointerDown={() => seekingRef.current = true}
                onPointerUp={() => seekingRef.current = false}
                className={user ? "cursor-pointer" : "cursor-default"}
                disabled={!user}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-white mt-2">
            <div className="flex items-center gap-4">
              {!isScreenShare && (
                <>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={isPlaying ? handlePause : handlePlay} disabled={!user}>
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
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleScreenshot} disabled={isYoutube}>
                  <Camera />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleToggleRecording} disabled={isYoutube}>
                  {isRecording ? <Circle className="text-red-500 fill-current" /> : <VideoIcon />}
              </Button>
              <Button variant="ghost" size="icon" className={`text-white hover:bg-white/10 ${isDrawingMode ? 'bg-white/20' : ''}`} onClick={() => setIsDrawingMode(!isDrawingMode)}>
                  <PenTool />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreenToggle}>
              {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showPlayer && GLOBAL_PLACEHOLDER && (
        <Image
          src={GLOBAL_PLACEHOLDER.imageUrl}
          alt={GLOBAL_PLACEHOLDER.description}
          fill
          className="object-cover -z-10 opacity-20"
          data-ai-hint={GLOBAL_PLACEHOLDER.imageHint}
        />
      )}
    </Card>
  );
}
