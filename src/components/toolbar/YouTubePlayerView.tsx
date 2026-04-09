import { ControlYoutubeDisplayPlaybackMessageComposer, YouTubeRoomBroadcastEvent, YouTubeRoomPlayComposer, YouTubeRoomWatchersEvent, YouTubeRoomWatchingComposer } from "@nitrots/nitro-renderer";
import { FC, useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import {
    GetRoomSession,
    GetSessionDataManager,
    SendMessageComposer,
    YoutubeVideoPlaybackStateEnum,
} from "../../api";
import {
    NitroCardContentView,
    NitroCardHeaderView,
    NitroCardView,
} from "../../common";
import { useFurnitureYoutubeWidget, useMessageEvent } from "../../hooks";

const CONTROL_COMMAND_PREVIOUS_VIDEO = 0;
const CONTROL_COMMAND_NEXT_VIDEO = 1;
const CONTROL_COMMAND_PAUSE_VIDEO = 2;
const CONTROL_COMMAND_CONTINUE_VIDEO = 3;

const extractVideoId = (input: string): string => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) return match[1];
    }
    return input;
};

export const YouTubePlayerView: FC<{}> = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState<
        | "player"
        | "playlist"
        | "spectators"
        | "settings"
        | "history"
        | "share"
    >("player");
    const [inputValue, setInputValue] = useState("");
    const [isRoomMode, setIsRoomMode] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [volumePreset, setVolumePreset] = useState<number>(100);
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [showVolumeSlider, setShowVolumeSlider] = useState(true);
    const playerRef = useRef<any>(null);

    const {
        objectId: youtubeObjectId,
        videoId: roomVideoId,
        currentVideoState,
        hasControl,
    } = useFurnitureYoutubeWidget();

    const [spectators, setSpectators] = useState<
        { id: number; name: string; look: string }[]
    >([]);
    // Room broadcast state: set when someone broadcasts a video to the room
    const [broadcastVideo, setBroadcastVideo] = useState("");
    const [broadcastSender, setBroadcastSender] = useState("");
    const [broadcastPlaylist, setBroadcastPlaylist] = useState<string[]>([]);
    const [watcherIds, setWatcherIds] = useState<Set<number>>(new Set());

    // Listen for room-wide YouTube broadcast from the server
    useMessageEvent<YouTubeRoomBroadcastEvent>(YouTubeRoomBroadcastEvent, event => {
        const parser = event.getParser();
        setBroadcastVideo(parser.videoId);
        setBroadcastSender(parser.senderName);
        setBroadcastPlaylist(parser.playlist);
        // Auto-open the player and load the broadcast video
        if (parser.videoId) {
            setInputValue(parser.videoId);
            setIsOpen(true);
            setTab("player");
        }
    });

    // Listen for updated watcher list from the server
    useMessageEvent<YouTubeRoomWatchersEvent>(YouTubeRoomWatchersEvent, event => {
        setWatcherIds(new Set(event.getParser().watcherIds));
        loadRoomUsers(); // refresh spectator list so we can mark watchers
    });

    // Notify server when we open/close the YouTube player
    useEffect(() => {
        if (isOpen) {
            try { SendMessageComposer(new YouTubeRoomWatchingComposer(true)); } catch(e) {}
        }
        return () => {
            try { SendMessageComposer(new YouTubeRoomWatchingComposer(false)); } catch(e) {}
        };
    }, [isOpen]);

    // Enumerate room users via the session's userDataManager. Uses the
    // same brute-force index scan that the old FurnitureYoutubeDisplayView
    // used (and which worked). The fancier GetRoomEngine().getRoomObjects()
    // approach doesn't reliably return objects when called from the toolbar
    // context (outside the room widget tree).
    const loadRoomUsers = () => {
        try {
            const roomSession = GetRoomSession();
            if (!roomSession) { setSpectators([]); return; }
            const users: { id: number; name: string; look: string }[] = [];
            for (let i = 0; i < 500; i++) {
                const userData = roomSession.userDataManager.getUserDataByIndex(i);
                if (userData && userData.name && userData.type === 1) {
                    users.push({ id: userData.userId, name: userData.name, look: userData.figure });
                }
            }
            setSpectators(users);
        } catch (e) {
            setSpectators([]);
        }
    };

    // Load room users when the player opens so the spectators count
    // is visible on the tab button immediately.
    useEffect(() => {
        if (isOpen) loadRoomUsers();
    }, [isOpen]);

    useEffect(() => {
        if (youtubeObjectId && youtubeObjectId !== -1) {
            setIsRoomMode(true);
            if (roomVideoId) {
                setInputValue(roomVideoId);
            }
        } else {
            setIsRoomMode(false);
        }
    }, [youtubeObjectId, roomVideoId]);

    useEffect(() => {
        // Hold the same handler reference for both add and remove. Using a
        // fresh arrow function in the cleanup is a no-op because
        // removeEventListener requires reference equality; every mount
        // would otherwise leak a permanent listener on window.
        const handler = () => setIsOpen((p) => !p);
        window.addEventListener("youtube:toggle", handler);
        return () => window.removeEventListener("youtube:toggle", handler);
    }, []);

    useEffect(() => {
        const savedHistory = localStorage.getItem("youtube_history");
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed)) {
                    // Accept both legacy {id,title,...} objects and plain string[]
                    setHistory(parsed.map((entry: any) => typeof entry === "string" ? entry : entry?.id).filter(Boolean));
                }
            } catch (e) {}
        }
        const savedPlaylist = localStorage.getItem("youtube_playlist");
        if (savedPlaylist) {
            try {
                const parsed = JSON.parse(savedPlaylist);
                if (Array.isArray(parsed)) {
                    setPlaylist(parsed.map((entry: any) => typeof entry === "string" ? entry : entry?.id).filter(Boolean));
                }
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "youtube_history",
            JSON.stringify(history.slice(0, 50)),
        );
    }, [history]);

    useEffect(() => {
        localStorage.setItem("youtube_playlist", JSON.stringify(playlist));
    }, [playlist]);

    const addToHistory = (id: string) => {
        if (!id) return;
        setHistory((prev) => {
            const filtered = prev.filter((v) => v !== id);
            return [id, ...filtered].slice(0, 50);
        });
    };

    const handlePlay = () =>
        isRoomMode &&
        youtubeObjectId &&
        hasControl &&
        SendMessageComposer(
            new ControlYoutubeDisplayPlaybackMessageComposer(
                youtubeObjectId,
                CONTROL_COMMAND_CONTINUE_VIDEO,
            ),
        );
    const handlePause = () =>
        isRoomMode &&
        youtubeObjectId &&
        hasControl &&
        SendMessageComposer(
            new ControlYoutubeDisplayPlaybackMessageComposer(
                youtubeObjectId,
                CONTROL_COMMAND_PAUSE_VIDEO,
            ),
        );
    const handlePrev = () =>
        isRoomMode &&
        youtubeObjectId &&
        hasControl &&
        SendMessageComposer(
            new ControlYoutubeDisplayPlaybackMessageComposer(
                youtubeObjectId,
                CONTROL_COMMAND_PREVIOUS_VIDEO,
            ),
        );
    const handleNext = () =>
        isRoomMode &&
        youtubeObjectId &&
        hasControl &&
        SendMessageComposer(
            new ControlYoutubeDisplayPlaybackMessageComposer(
                youtubeObjectId,
                CONTROL_COMMAND_NEXT_VIDEO,
            ),
        );

    const addToPlaylist = () => {
        const id = extractVideoId(inputValue);
        if (id && !playlist.includes(id)) {
            setPlaylist((p) => [...p, id]);
        }
    };

    if (!isOpen) return null;

    const videoId = extractVideoId(inputValue);
    const isPlaying =
        currentVideoState === YoutubeVideoPlaybackStateEnum.PLAYING;
    const isPaused = currentVideoState === YoutubeVideoPlaybackStateEnum.PAUSED;
    const isMyRoom = GetSessionDataManager().isModerator || hasControl;

    const QuickVolumeButton = ({
        value,
        label,
    }: {
        value: number;
        label: string;
    }) => (
        <button
            onClick={() => {
                setVolume(value);
                setVolumePreset(value);
            }}
            className={`px-2 py-1 rounded text-xs ${volumePreset === value ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
            {label}
        </button>
    );

    return (
        <NitroCardView
            className={`youtube-player-modal fixed ${isFullscreen ? "inset-0 w-full h-full z-[9999] rounded-none" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-[550px]"}`}
        >
            <NitroCardHeaderView
                headerText={isRoomMode ? "📺 YouTube TV (Kamer)" : "▶ YouTube"}
                onCloseClick={() => setIsOpen(false)}
            />
            <NitroCardContentView>
                <div className="flex gap-1 mb-3 border-b border-gray-700 pb-2 flex-wrap">
                    <button
                        onClick={() => setTab("player")}
                        className={`px-3 py-1 rounded text-sm ${tab === "player" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                        ▶
                    </button>
                    <button
                        onClick={() => setTab("playlist")}
                        className={`px-3 py-1 rounded text-sm ${tab === "playlist" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                        📋 {playlist.length}
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`px-3 py-1 rounded text-sm ${tab === "history" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                        🕐 {history.length}
                    </button>
                    <button
                        onClick={() => setTab("share")}
                        className={`px-3 py-1 rounded text-sm ${tab === "share" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                        📤
                    </button>
                    {spectators.length > 0 && (
                        <button
                            onClick={() => { setTab("spectators"); loadRoomUsers(); }}
                            className={`px-3 py-1 rounded text-sm ${tab === "spectators" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                        >
                            👁️ {spectators.length}
                        </button>
                    )}
                    <button
                        onClick={() => setTab("settings")}
                        className={`px-3 py-1 rounded text-sm ${tab === "settings" ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}
                    >
                        ⚙️
                    </button>
                </div>

                {tab === "player" && (
                    <>
                        {isRoomMode && (
                            <div className="mb-2 p-2 bg-blue-900/50 rounded flex justify-between text-sm">
                                <span className="text-blue-300">
                                    📺 Verbonden met YouTube TV
                                </span>
                                <div className="flex gap-2">
                                    {isPlaying && (
                                        <span className="text-green-400">
                                            ▶ Speelt
                                        </span>
                                    )}
                                    {isPaused && (
                                        <span className="text-yellow-400">
                                            ⏸ Gepauzeerd
                                        </span>
                                    )}
                                    {isMyRoom && (
                                        <span className="text-green-400 text-xs">
                                            ✓ Jij bent eigenaar
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {videoId ? (
                            <YouTube
                                videoId={videoId}
                                opts={{
                                    width: "100%",
                                    height: isFullscreen ? "100%" : "280",
                                    playerVars: {
                                        autoplay: 1,
                                        volume: volume,
                                        muted: isMuted ? 1 : 0,
                                        loop: isLooping ? 1 : 0,
                                    },
                                }}
                                onReady={(e) => {
                                    playerRef.current = e.target;
                                    addToHistory(videoId);
                                }}
                            />
                        ) : (
                            <div className="h-[280px] flex items-center justify-center bg-gray-800 text-gray-500">
                                Geen video geladen
                            </div>
                        )}

                        {isRoomMode && hasControl && (
                            <div className="mt-2 flex gap-2 justify-center">
                                <button
                                    onClick={handlePrev}
                                    className="px-3 py-1 bg-gray-700 rounded text-white text-sm"
                                >
                                    ◀◀
                                </button>
                                <button
                                    onClick={
                                        isPlaying ? handlePause : handlePlay
                                    }
                                    className="px-4 py-1 bg-amber-600 rounded text-white font-bold text-sm"
                                >
                                    {isPlaying ? "⏸" : "▶"}
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-3 py-1 bg-gray-700 rounded text-white text-sm"
                                >
                                    ▶▶
                                </button>
                            </div>
                        )}

                        {broadcastVideo && broadcastSender && (
                            <div className="mt-2 p-2 bg-purple-900/50 rounded text-sm">
                                <span className="text-purple-300">📡 {broadcastSender} speelt voor de kamer</span>
                            </div>
                        )}

                        <div className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={!!broadcastVideo && !isMyRoom}
                                className={`flex-1 p-2 rounded text-white text-sm ${(!!broadcastVideo && !isMyRoom) ? "bg-gray-800" : "bg-gray-700"}`}
                                placeholder="YouTube URL of video ID"
                            />
                            {isMyRoom && videoId && (
                                <button
                                    onClick={() => {
                                        try {
                                            SendMessageComposer(new YouTubeRoomPlayComposer(videoId, playlist));
                                        } catch(e) {}
                                    }}
                                    className="px-3 bg-purple-600 rounded text-white text-sm whitespace-nowrap"
                                    title="Speel deze video voor iedereen in de kamer"
                                >
                                    📡 Kamer
                                </button>
                            )}
                        </div>
                    </>
                )}

                {tab === "playlist" && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Video URL toevoegen..."
                                className="flex-1 p-2 bg-gray-700 text-white rounded text-sm"
                                onKeyDown={(e) =>
                                    e.key === "Enter" && addToPlaylist()
                                }
                            />
                            <button
                                onClick={addToPlaylist}
                                className="px-4 bg-purple-600 rounded text-white"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setInputValue("")}
                                className="flex-1 px-3 py-2 bg-gray-700 rounded text-white text-sm"
                            >
                                🔄 Nieuwe video
                            </button>
                            <button
                                onClick={() => setPlaylist([])}
                                className="px-3 py-2 bg-red-900 rounded text-white text-sm"
                            >
                                🗑 Leeg
                            </button>
                        </div>
                        {playlist.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Playlist is leeg
                            </div>
                        ) : (
                            <div className="max-h-[250px] overflow-y-auto space-y-1">
                                {playlist.map((id, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 p-2 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setInputValue(id);
                                            setTab("player");
                                        }}
                                    >
                                        <span className="text-amber-500 text-sm w-6">
                                            {i + 1}.
                                        </span>
                                        <div className="flex-1 min-w-0 text-white text-sm truncate font-mono">
                                            {id}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPlaylist((p) =>
                                                    p.filter((x) => x !== id),
                                                );
                                            }}
                                            className="text-red-500 px-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === "history" && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="text-gray-400 text-sm">
                                🕐 Bekeken video's ({history.length})
                            </div>
                            <button
                                onClick={() => setHistory([])}
                                className="text-red-400 text-xs hover:text-red-300"
                            >
                                🗑 Wissen
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Nog geen video's bekeken
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {history.map((id, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 p-2 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setInputValue(id);
                                            setTab("player");
                                        }}
                                    >
                                        <div className="flex-1 min-w-0 text-white text-sm truncate font-mono">
                                            {id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === "share" && (
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-800 rounded">
                            <div className="text-gray-400 text-sm mb-2">
                                📤 Video delen
                            </div>
                            {videoId ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={`https://youtube.com/watch?v=${videoId}`}
                                            readOnly
                                            className="flex-1 p-2 bg-gray-700 text-white rounded text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    `https://youtube.com/watch?v=${videoId}`,
                                                );
                                            }}
                                            className="px-3 bg-blue-600 rounded text-white text-sm"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm text-center py-4">
                                    Selecteer eerst een video om te delen
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-gray-800 rounded">
                            <div className="text-gray-400 text-sm mb-2">
                                📋 Snel delen
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        if (videoId) {
                                            navigator.clipboard.writeText(
                                                `📺 https://youtube.com/watch?v=${videoId}`,
                                            );
                                            alert("Gekopieerd naar clipboard!");
                                        }
                                    }}
                                    disabled={!videoId}
                                    className="px-3 py-2 bg-gray-700 rounded text-white text-sm disabled:opacity-50"
                                >
                                    📋 Copy met emoji
                                </button>
                                <button
                                    onClick={() => {
                                        if (videoId) {
                                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                                `Nu kijken: https://youtube.com/watch?v=${videoId}`,
                                            )}`;
                                            window.open(url, "_blank");
                                        }
                                    }}
                                    disabled={!videoId}
                                    className="px-3 py-2 bg-blue-600 rounded text-white text-sm disabled:opacity-50"
                                >
                                    🐦 Twitter
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "spectators" && (
                    <div className="p-3 bg-gray-800 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-gray-400 text-sm">
                                👁️ Gebruikers in kamer ({spectators.length})
                            </div>
                            <button
                                onClick={loadRoomUsers}
                                className="text-gray-400 hover:text-white text-xs"
                            >
                                🔄
                            </button>
                        </div>
                        {spectators.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center py-4">
                                Geen gebruikers in deze kamer
                            </div>
                        ) : (
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {spectators.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 p-2 bg-gray-700 rounded"
                                    >
                                        <img
                                            src={`https://www.habbo.com/habbo-imaging/avatarimage?figure=${user.look}&size=s&direction=2&head_direction=2`}
                                            alt={user.name}
                                            className="w-8 h-8 rounded"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src =
                                                    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><circle cx='18' cy='18' r='18' fill='%23888'/></svg>";
                                            }}
                                        />
                                        <span className="text-white text-sm flex-1">
                                            {user.name}
                                        </span>
                                        {watcherIds.has(user.id) && (
                                            <span className="text-amber-400 text-xs" title="Kijkt YouTube">📺</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === "settings" && (
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-white text-sm">
                                    🔊 Volume: {volume}%
                                </label>
                                <button
                                    onClick={() =>
                                        setShowVolumeSlider(!showVolumeSlider)
                                    }
                                    className="text-gray-400 text-xs"
                                >
                                    {showVolumeSlider ? "▼" : "▲"}
                                </button>
                            </div>
                            {showVolumeSlider && (
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) => {
                                        setVolume(parseInt(e.target.value));
                                        setVolumePreset(
                                            parseInt(e.target.value),
                                        );
                                    }}
                                    className="w-full"
                                />
                            )}
                            <div className="flex gap-1 mt-2">
                                <QuickVolumeButton value={0} label="🔇" />
                                <QuickVolumeButton value={25} label="25%" />
                                <QuickVolumeButton value={50} label="50%" />
                                <QuickVolumeButton value={75} label="75%" />
                                <QuickVolumeButton value={100} label="100%" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMuted}
                                    onChange={(e) =>
                                        setIsMuted(e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                🔇 Dempen
                            </label>
                            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isLooping}
                                    onChange={(e) =>
                                        setIsLooping(e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                🔁 Herhalen
                            </label>
                            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFullscreen}
                                    onChange={(e) =>
                                        setIsFullscreen(e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                🖥️ Fullscreen
                            </label>
                        </div>

                        <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                            <div className="font-bold mb-1">ℹ️ Info</div>
                            <div>
                                Room Mode:{" "}
                                {isRoomMode ? "✓ Actief" : "✕ Niet actief"}
                            </div>
                            <div>
                                Controle:{" "}
                                {hasControl
                                    ? "✓ Je hebt controle"
                                    : "✕ Alleen kijken"}
                            </div>
                        </div>
                    </div>
                )}
            </NitroCardContentView>
        </NitroCardView>
    );
};
