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
import { doc, serverTimestamp, collection, onSnapshot, setDoc, deleteDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/lazy';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  roomId: string;
}

const drawingColors = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#FFFFFF', '#000000'];
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const GLOBAL_PLACEHOLDER = PlaceHolderImages.find(img => img.id === 'video-placeholder') || PlaceHolderImages[0];

export function VideoPlayer({ roomId }: VideoPlayerProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [localMedia, setLocalMedia] = useState<string | MediaStream | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#E53935');
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seekingRef = useRef(false);
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

  const roomRef = useMemoFirebase(() => (firestore && roomId) ? doc(firestore, 'rooms', roomId) : null, [firestore, roomId]);
  const [roomState] = useDocumentData(roomRef);
  
  const isHost = user && roomState ? roomState.hostId === user.uid : false;
  const isScreenShare = roomState?.media?.source === 'screen';
  const mediaUrl = isScreenShare && !isHost ? localMedia : (isScreenShare && isHost ? localMedia : roomState?.media?.url);
  const isPlaying = roomState?.playback?.isPlaying;

  const placeholderImage = GLOBAL_PLACEHOLDER.imageUrl;

  // WebRTC Screen Share Signaling
  useEffect(() => {
    if (!firestore || !user || !isScreenShare) return;

    if (isHost && localMedia instanceof MediaStream) {
      // Host: Broadcast screen stream
      const signalsRef = collection(firestore, 'rooms', roomId, 'screenSignals');
      const unsubscribe = onSnapshot(signalsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const fromUid = change.doc.id;
            if (data.offer && !data.answer) {
              const pc = new RTCPeerConnection(ICE_SERVERS);
              peerConnections.current[fromUid] = pc;
              localMedia.getTracks().forEach(track => pc.addTrack(track, localMedia));
              
              pc.onicecandidate = (e) => {
                if (e.candidate) {
                  updateDoc(change.doc.ref, { 
                    answerCandidates: arrayUnion(e.candidate.toJSON()) 
                  });
                }
              };
              
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              updateDoc(change.doc.ref, { answer: { type: answer.type, sdp: answer.sdp } });
            }
          }
        });
      });
      return () => unsubscribe();
    } else if (!isHost && !isScreenShare) {
      // Participant: Receive screen stream
      const initPC = async () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const remoteStream = new MediaStream();
        
        pc.ontrack = (e) => {
          e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
          setLocalMedia(remoteStream);
        };
        
        const signalDoc = doc(firestore, 'rooms', roomId, 'screenSignals', user.uid);
        
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            updateDoc(signalDoc, { 
              offerCandidates: arrayUnion(e.candidate.toJSON()) 
            }).catch(() => {
              setDoc(signalDoc, { offerCandidates: [e.candidate.toJSON()] }, { merge: true });
            });
          }
        };
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(signalDoc, { offer: { type: offer.type, sdp: offer.sdp } });
        
        const unsubscribe = onSnapshot(signalDoc, (d) => {
          const data = d.data();
          if (data?.answer && !pc.currentRemoteDescription) pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          if (data?.answerCandidates) {
            data.answerCandidates.forEach((c: any) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
          }
        });
        
        return () => { 
          unsubscribe(); 
          deleteDoc(signalDoc); 
          pc.close(); 
        };
      };
      
      const cleanup = initPC();
      return () => {
        cleanup.then(c => c && c());
      };
    }
  }, [firestore, user, isScreenShare, isHost, localMedia, roomId]);

  // Sync client player to Firebase state
  useEffect(() => {
    const video = playerRef.current;
    if (!video || !roomState?.playback || seekingRef.current || !isReady || isScreenShare) return;
    if(!roomState.playback.lastUpdated) return;

    const serverTime = roomState.playback.lastUpdated.toDate().getTime();
    const clientTime = new Date().getTime();
    const timeDiff = (clientTime - serverTime) / 1000;
    
    let targetTime = roomState.playback.progress;
    if(isPlaying) targetTime += timeDiff;

    const localTime = video.getCurrentTime();
    if (Math.abs(targetTime - localTime) > 2) video.seekTo(targetTime, 'seconds');
  }, [roomState, isReady, isPlaying, isScreenShare]);

  const updatePlaybackState = (state: any) => {
    if (!roomRef || isScreenShare || !user) return;
    setDocumentNonBlocking(roomRef, {
        playback: { ...roomState?.playback, ...state, lastUpdated: serverTimestamp() },
      }, { merge: true }
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
      if (localMedia instanceof MediaStream) localMedia.getTracks().forEach(t => t.stop());
      setLocalMedia(url);
      setDocumentNonBlocking(roomRef, {
          media: { url, title, source },
          playback: { isPlaying: false, progress: 0, lastUpdated: serverTimestamp() }
        }, { merge: true }
      );
    }
  };

  const handlePlay = () => updatePlaybackState({ isPlaying: true });
  const handlePause = () => updatePlaybackState({ isPlaying: false });
  
  const handleProgress = (state: { playedSeconds: number }) => {
    setProgress(state.playedSeconds);
     if (user && !seekingRef.current && !isScreenShare && isHost) {
        updatePlaybackState({ progress: state.playedSeconds });
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

  const handleFullscreenToggle = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) playerContainerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playerContainerRef.current) return;
    const { width, height } = playerContainerRef.current.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }, [isDrawingMode]);

  return (
    <Card ref={playerContainerRef} className="h-full w-full bg-card/80 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl rounded-xl border-border/30">
      {(!mediaUrl && !isScreenShare) ? (
        <div className="w-full max-w-lg p-4 z-10">
          {isHost ? (
            <AddMediaTabs onUrlSelect={handleSelectMedia} />
          ) : (
            <div className="text-center text-muted-foreground animate-pulse">
              <p>Waiting for the host to start the stream...</p>
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
                    youtube: { playerVars: { showinfo: 0, controls: 0, rel: 0 } },
                    file: { attributes: { style: { objectFit: 'contain' }, crossOrigin: 'anonymous' } }
                }}
            />
            {isDrawingMode && (
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair z-20"
                    onMouseDown={(e) => {
                        const context = canvasRef.current?.getContext('2d');
                        if (!context) return;
                        context.strokeStyle = drawingColor;
                        context.lineWidth = 5;
                        context.lineCap = 'round';
                        context.beginPath();
                        context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        setIsDrawing(true);
                    }}
                    onMouseUp={() => { setIsDrawing(false); canvasRef.current?.getContext('2d')?.closePath(); }}
                    onMouseMove={(e) => {
                        if (!isDrawing) return;
                        const context = canvasRef.current?.getContext('2d');
                        if (!context) return;
                        context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        context.stroke();
                    }}
                />
            )}
        </>
      )}

      {mediaUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          {!isScreenShare && (
            <Slider
                value={[progress]}
                max={duration}
                onValueChange={user ? handleSeek : undefined}
                onPointerDown={() => seekingRef.current = true}
                onPointerUp={() => seekingRef.current = false}
                className="mb-4"
                disabled={!user}
            />
          )}

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              {!isScreenShare && (
                <>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={isPlaying ? handlePause : handlePlay} disabled={!user}>
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <div className="flex items-center gap-2 w-32">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                  </Button>
                  <Slider value={[isMuted ? 0 : volume]} max={1} step={0.05} onValueChange={handleVolumeChange} className="cursor-pointer"/>
                </div>
                <div className="text-xs font-mono opacity-70">
                  <span>{formatTime(progress)}</span> / <span>{formatTime(duration)}</span>
                </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className={`text-white hover:bg-white/10 ${isDrawingMode ? 'bg-white/20' : ''}`} onClick={() => setIsDrawingMode(!isDrawingMode)}>
                  <PenTool className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreenToggle}>
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!mediaUrl && !isScreenShare && placeholderImage && (
        <Image
          src={placeholderImage}
          alt="Video stream background"
          fill
          className="object-cover -z-10 opacity-30 grayscale blur-sm"
        />
      )}
    </Card>
  );
}
