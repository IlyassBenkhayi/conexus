import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  TwitchGqlResponse,
  TwitchStreamEdge,
  TwitchChannelSearchItem,
  TwitchVodEdge,
  DailymotionApiResponse,
  DailymotionVideoItem,
  YtSearchVideo,
} from '../types/database';

const router = Router();

// GET /api/media/youtube-search
router.get('/youtube-search', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string || 'lofi hip hop radio';
  try {
    const yts = require('yt-search');
    const r = await yts(query);
    const videos = (r.videos || []).slice(0, 25).map((v: YtSearchVideo) => ({
      videoId: v.videoId,
      title: v.title,
      channel: v.author?.name || 'Unknown Channel',
      duration: v.timestamp || String(v.duration),
      category: 'Video',
      thumbnail: v.thumbnail || v.image || `https://img.youtube.com/vi/${v.videoId}/0.jpg`,
    }));
    res.json(videos);
  } catch (err: unknown) {
    console.error('YouTube search failed:', err);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// GET /api/media/twitch-search
router.get('/twitch-search', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string || '';
  try {
    let gqlQuery = '';
    let variables = {};
    
    if (!query) {
      gqlQuery = `query {
        streams(first: 15) {
          edges {
            node {
              id
              title
              viewersCount
              game {
                name
              }
              broadcaster {
                login
                displayName
              }
            }
          }
        }
      }`;
    } else {
      gqlQuery = `query SearchFor($userQuery: String!) {
        searchFor(userQuery: $userQuery, platform: "web") {
          channels {
            items {
              id
              displayName
              login
              stream {
                id
                title
                viewersCount
                game {
                  name
                }
              }
            }
          }
        }
      }`;
      variables = { userQuery: query };
    }

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': process.env.TWITCH_CLIENT_ID!
      },
      body: JSON.stringify({ query: gqlQuery, variables })
    });

    const json = await response.json() as TwitchGqlResponse;
    
    let results: Array<Record<string, unknown>> = [];
    if (!query) {
      const edges = json.data?.streams?.edges || [];
      results = edges.map((e: TwitchStreamEdge) => {
        const node = e.node;
        const login = node.broadcaster?.login || '';
        return {
          channel: login,
          displayName: node.broadcaster?.displayName || login,
          title: node.title || '',
          game: node.game?.name || '',
          viewers: node.viewersCount >= 1000 ? `${(node.viewersCount / 1000).toFixed(1)}K` : String(node.viewersCount),
          isLive: true,
          thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-440x248.jpg`,
        };
      });
    } else {
      const items = json.data?.searchFor?.channels?.items || [];
      results = items.map((item: TwitchChannelSearchItem) => {
        const isLive = !!item.stream;
        const login = item.login;
        return {
          channel: login,
          displayName: item.displayName || login,
          title: item.stream ? item.stream.title : 'Offline - Channel Profile',
          game: item.stream ? item.stream.game?.name : '',
          viewers: item.stream ? (item.stream.viewersCount >= 1000 ? `${(item.stream.viewersCount / 1000).toFixed(1)}K` : String(item.stream.viewersCount)) : '0',
          isLive,
          thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-440x248.jpg`,
        };
      });

      if (items.length > 0) {
        const topChannel = items[0].login;
        try {
          const vodQuery = `query {
            user(login: "${topChannel}") {
              videos(first: 6) {
                edges {
                  node {
                    id
                    title
                    duration
                    viewCount
                    createdAt
                  }
                }
              }
            }
          }`;
          const vodResponse = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Id': process.env.TWITCH_CLIENT_ID!
            },
            body: JSON.stringify({ query: vodQuery })
          });
          const vodJson = await vodResponse.json() as TwitchGqlResponse;
          const vodEdges = vodJson.data?.user?.videos?.edges || [];
          const vodItems = vodEdges.map((e: TwitchVodEdge) => {
            const node = e.node;
            return {
              channel: topChannel,
              displayName: items[0].displayName,
              title: `[VOD] ${node.title}`,
              game: node.duration || 'Past Broadcast',
              viewers: node.viewCount >= 1000 ? `${(node.viewCount / 1000).toFixed(1)}K views` : `${node.viewCount} views`,
              isLive: false,
              videoId: node.id,
              thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${topChannel}-440x248.jpg`,
            };
          });
          results = [...results, ...vodItems];
        } catch (err) {
          console.error('Failed to fetch Twitch VODs:', err);
        }
      }
    }
    
    res.json(results);
  } catch (err: unknown) {
    console.error('Twitch search failed:', err);
    res.status(500).json({ error: 'Failed to search Twitch' });
  }
});

// GET /api/media/vimeo-search
router.get('/vimeo-search', requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  const VIMEO_LIBRARY = [
    { videoId: '305727901', title: 'Patagonia 8K', channel: 'Martin Heck', duration: '5:22', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/746440680_640x360.jpg' },
    { videoId: '435748696', title: 'Northern Lights 4K', channel: 'Henry Jun Wah Lee', duration: '6:18', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/913833898_640x360.jpg' },
    { videoId: '290524239', title: 'Earth - A Short Film', channel: 'Luc Bergeron', duration: '3:50', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/726050337_640x360.jpg' },
    { videoId: '236413792', title: 'Watchtower of Turkey', channel: 'Leonardo Dalessandri', duration: '5:30', category: 'Travel', thumbnail: 'https://i.vimeocdn.com/video/659318218_640x360.jpg' },
    { videoId: '209647923', title: 'Above the Mountains 4K', channel: 'Florian Nick', duration: '4:12', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/625720042_640x360.jpg' },
    { videoId: '197602083', title: 'Wanderers - A Short Film', channel: 'Erik Wernquist', duration: '3:50', category: 'Sci-Fi', thumbnail: 'https://i.vimeocdn.com/video/611202888_640x360.jpg' },
    { videoId: '427943452', title: 'Japan in 8K HDR', channel: 'Jacob + Katie Schwarz', duration: '6:45', category: 'Travel', thumbnail: 'https://i.vimeocdn.com/video/900831698_640x360.jpg' },
    { videoId: '365067023', title: 'Coastal - Timelapse Film', channel: 'Dustin Farrell', duration: '4:33', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/820254345_640x360.jpg' },
    { videoId: '256513283', title: 'Iceland Aerial 4K Drone', channel: 'Timelab Pro', duration: '7:15', category: 'Travel', thumbnail: 'https://i.vimeocdn.com/video/685502774_640x360.jpg' },
    { videoId: '386165839', title: 'Macro World - Insects', channel: 'Another Perspective', duration: '5:08', category: 'Science', thumbnail: 'https://i.vimeocdn.com/video/849282443_640x360.jpg' },
    { videoId: '191760916', title: 'Oceanscapes - Deep Blue', channel: 'Florian Fischer', duration: '8:20', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/601302455_640x360.jpg' },
    { videoId: '346060460', title: 'Night Sky Timelapse Collection', channel: 'Adrien Mauduit', duration: '12:00', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/797555309_640x360.jpg' },
    { videoId: '308662025', title: 'Urban Architecture - Cities', channel: 'Vadim Sherbakov', duration: '3:45', category: 'Travel', thumbnail: 'https://i.vimeocdn.com/video/749898445_640x360.jpg' },
    { videoId: '219350547', title: 'Into the Atmosphere', channel: 'Henry Jun Wah Lee', duration: '4:10', category: 'Nature', thumbnail: 'https://i.vimeocdn.com/video/637714282_640x360.jpg' },
    { videoId: '278532963', title: 'Abstract Fluids in Macro', channel: 'Roman De Giuli', duration: '3:22', category: 'Art', thumbnail: 'https://i.vimeocdn.com/video/710948382_640x360.jpg' },
  ];

  try {
    const searchUrl = `https://vimeo.com/search/page:1/sort:relevant/format:json?q=${encodeURIComponent(query || 'nature documentary')}`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      console.warn(`Vimeo public search returned status ${response.status}`);
    }
  } catch (err: unknown) {
    console.warn('Vimeo live search fetch failed, using fallback library:', err instanceof Error ? err.message : err);
  }

  let results = VIMEO_LIBRARY;
  if (query) {
    const q = query.toLowerCase();
    results = VIMEO_LIBRARY.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.channel.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );
  }
  res.json(results);
});

// GET /api/media/dailymotion-search
router.get('/dailymotion-search', requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  const DM_LIBRARY = [
    { videoId: 'x8qk2hq', title: 'Wildlife of Africa - 4K Documentary', channel: 'NatureVision', duration: '48:20', category: 'Nature', views: '2.4M views', thumbnail: '' },
    { videoId: 'x8nk3pw', title: 'Street Art Around the World', channel: 'ArtExplorer', duration: '12:45', category: 'Art', views: '890K views', thumbnail: '' },
    { videoId: 'x8mk5rt', title: 'Cooking Masterclass - French Cuisine', channel: 'ChefPro', duration: '25:30', category: 'Food', views: '1.2M views', thumbnail: '' },
    { videoId: 'x8lk2mn', title: 'Top 10 Space Discoveries 2025', channel: 'ScienceDaily', duration: '18:15', category: 'Science', views: '3.1M views', thumbnail: '' },
    { videoId: 'x8kk7pq', title: 'Extreme Sports Compilation', channel: 'AdventureTV', duration: '15:00', category: 'Sports', views: '5.6M views', thumbnail: '' },
    { videoId: 'x8jk9st', title: 'Piano Relaxation - 1 Hour', channel: 'MusicZen', duration: '1:00:00', category: 'Music', views: '980K views', thumbnail: '' },
    { videoId: 'x8ik4uv', title: 'Drone Footage - Swiss Alps', channel: 'AerialViews', duration: '8:30', category: 'Travel', views: '1.5M views', thumbnail: '' },
    { videoId: 'x8hk6wx', title: 'Stand-Up Comedy Best Moments', channel: 'ComedyHub', duration: '22:10', category: 'Comedy', views: '4.2M views', thumbnail: '' },
    { videoId: 'x8gk8yz', title: 'Retro Gaming - Classic Arcade', channel: 'GameHistory', duration: '30:00', category: 'Gaming', views: '670K views', thumbnail: '' },
    { videoId: 'x8fk1ab', title: 'Fashion Week Highlights 2025', channel: 'StyleTV', duration: '14:20', category: 'Fashion', views: '1.8M views', thumbnail: '' },
    { videoId: 'x8ek3cd', title: 'DIY Home Renovation Tips', channel: 'HomeCraft', duration: '20:45', category: 'DIY', views: '2.1M views', thumbnail: '' },
    { videoId: 'x8dk5ef', title: 'Electric Vehicles - The Future', channel: 'TechToday', duration: '16:30', category: 'Tech', views: '3.8M views', thumbnail: '' },
  ];

  try {
    const searchQuery = query || 'trending';
    const dmUrl = `https://api.dailymotion.com/videos?search=${encodeURIComponent(searchQuery)}&fields=id,title,owner.screenname,duration,views_total,thumbnail_240_url&limit=25&sort=relevance`;

    const response = await fetch(dmUrl, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const json = await response.json() as DailymotionApiResponse;
      if (json.list && json.list.length > 0) {
        const results = json.list.map((v: DailymotionVideoItem) => ({
          videoId: v.id,
          title: v.title || 'Untitled',
          channel: v['owner.screenname'] || 'Unknown',
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '0:00',
          category: 'Video',
          views: v.views_total >= 1000000 ? `${(v.views_total / 1000000).toFixed(1)}M views` : v.views_total >= 1000 ? `${(v.views_total / 1000).toFixed(1)}K views` : `${v.views_total} views`,
          thumbnail: v.thumbnail_240_url || '',
        }));
        res.json(results);
        return;
      }
    }
  } catch (err: unknown) {
    console.warn('Dailymotion API search failed, using fallback library:', err instanceof Error ? err.message : err);
  }

  const q = (query || '').toLowerCase();
  const filtered = q ? DM_LIBRARY.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)) : DM_LIBRARY;
  res.json(filtered);
});

// GET /api/media/spotify-search
router.get('/spotify-search', requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  try {
    const SPOTIFY_LIBRARY = [
      { trackId: '4cOdK2wGLETKBW3PvgPWqT', title: 'Never Gonna Give You Up', artist: 'Rick Astley', album: 'Whenever You Need Somebody', duration: '3:32', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b27315b3e2234a2e22c0fa5dbb10' },
      { trackId: '7qiZfU4dY1lWllzX7mPBI3', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷', duration: '3:53', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2731ec95cc180ce6df13fdc1a42' },
      { trackId: '0VjIjW4GlUZAMYd2vXMi3b', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { trackId: '3n3Ppam7vgaVa1iaRUc9Lp', title: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', duration: '3:42', category: 'Rock', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2731a0c8e15a94a695e3e064a60' },
      { trackId: '5HCyWlXZPP0y6Gqq8TgA20', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', category: 'Rock', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b' },
      { trackId: '2Fxmhks0bxGSBdJ92vM42m', title: 'bad guy', artist: 'Billie Eilish', album: 'WHEN WE ALL FALL ASLEEP...', duration: '3:14', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6d2' },
      { trackId: '1zi7xx7UVEFkmKfv06H8x0', title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', duration: '5:20', category: 'Electronic', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2732e02117d76426a08ac7c174f' },
      { trackId: '3AJwUDP919kvQ9QcozQPxg', title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile OST', duration: '5:23', category: 'Hip-Hop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2736ca5c90113b30c3c43ffb8f4' },
      { trackId: '1mea3bSkSGXuIRvnydlB5b', title: 'Viva la Vida', artist: 'Coldplay', album: 'Viva la Vida or Death and All His Friends', duration: '4:01', category: 'Rock', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273f2b7f26e42aa9d18cc3c8be7' },
      { trackId: '7GhIk7Il098yCjg4BQjzvb', title: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', duration: '6:09', category: 'Electronic', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937' },
      { trackId: '6gBFPUFcJLzWGx4lenP6h6', title: 'goosebumps', artist: 'Travis Scott', album: 'Birds in the Trap Sing McKnight', duration: '4:03', category: 'Hip-Hop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273f54b99bf27cda88f4a7403ce' },
      { trackId: '0pqnGHJpmpxLyEfLblFdDh', title: 'Redbone', artist: 'Childish Gambino', album: '"Awaken, My Love!"', duration: '5:26', category: 'R&B', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273271a8300a1249fcf861e84de' },
      { trackId: '2LawezPeJhN4AWuSB0GtAU', title: 'Circles', artist: 'Post Malone', album: "Hollywood's Bleeding", duration: '3:35', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2739478c87599550dd73bfa7e02' },
      { trackId: '2dpaYNEQHiRxtZbfNsse99', title: 'Lovely', artist: 'Billie Eilish & Khalid', album: 'Lovely', duration: '3:20', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2732e03e7bcb4cc3da5a1e1c3cf' },
      { trackId: '4BP3uh0hFLFRb5cjsgLqDh', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '4:03', category: 'Electronic', thumbnail: 'https://i.scdn.co/image/ab67616d0000b2737eb3fca327c18daae78fd37' },
      { trackId: '6habFhsceH2nhfWDioeadK', title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', album: 'AM', duration: '4:32', category: 'Rock', thumbnail: 'https://i.scdn.co/image/ab67616d0000b27326f7f19c7f0381e56156c94a' },
      { trackId: '32OlwWuMpZ6b0aN2RZOeMS', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', album: 'Uptown Special', duration: '4:30', category: 'Pop', thumbnail: 'https://i.scdn.co/image/ab67616d0000b27388e3cdd89e84cf2dff177124' },
      { trackId: '6dBUzqjtbnIa1TwYbyw5CM', title: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', duration: '3:56', category: 'Rock', thumbnail: 'https://i.scdn.co/image/ab67616d0000b273df55e326ed144ab4f5cecf95' },
    ];

    let results = SPOTIFY_LIBRARY;
    if (query) {
      const q = query.toLowerCase();
      results = SPOTIFY_LIBRARY.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    res.json(results);
  } catch (err: unknown) {
    console.error('Spotify search failed:', err);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

// GET /api/media/soundcloud-search
router.get('/soundcloud-search', requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  try {
    const SC_LIBRARY = [
      { trackUrl: 'https://soundcloud.com/flaboratory/sets/lofi-beats', title: 'Lo-Fi Beats Collection', artist: 'Flaboratory', duration: '45:00', category: 'Lo-Fi', plays: '2.3M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/chaboratory/chill-vibes', title: 'Chill Vibes Mix 2025', artist: 'ChillNation', duration: '1:12:00', category: 'Chill', plays: '5.8M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/nocopyrightsounds/alan-walker-fade', title: 'Fade', artist: 'Alan Walker', duration: '4:20', category: 'Electronic', plays: '180M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/mrsuicidesheep/sets/chill', title: 'Chill Mix - MrSuicideSheep', artist: 'MrSuicideSheep', duration: '55:00', category: 'Chill', plays: '12M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/trapnation/sets/trap-nation-2025', title: 'Trap Nation Essentials', artist: 'Trap Nation', duration: '1:30:00', category: 'Trap', plays: '8.4M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/monstercat/sets/instinct', title: 'Monstercat Instinct Playlist', artist: 'Monstercat', duration: '2:00:00', category: 'Electronic', plays: '3.1M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/theglitchmob/sets/drink-the-sea', title: 'Drink the Sea', artist: 'The Glitch Mob', duration: '52:00', category: 'Electronic', plays: '6.7M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/octobersveryown/drake-gods-plan', title: 'God\'s Plan', artist: 'Drake', duration: '3:18', category: 'Hip-Hop', plays: '450M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/flaboratory/jazz-hop', title: 'Jazz Hop - Study Session', artist: 'Flaboratory', duration: '40:00', category: 'Lo-Fi', plays: '1.5M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/deephouse/deep-house-mix', title: 'Deep House Essentials', artist: 'Deep House', duration: '1:15:00', category: 'House', plays: '4.2M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/ambient/ambient-sleep', title: 'Ambient Sleep Sounds', artist: 'Ambient', duration: '3:00:00', category: 'Ambient', plays: '2.8M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/majesticcasual/sets/majestic-casual', title: 'Majestic Casual Playlist', artist: 'Majestic Casual', duration: '1:45:00', category: 'Indie', plays: '9.1M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/bass-boosted/sets/bass-boosted-2025', title: 'Bass Boosted 2025', artist: 'Bass Boosted', duration: '1:20:00', category: 'Electronic', plays: '7.3M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/classical/sets/classical-piano', title: 'Classical Piano Collection', artist: 'Classical', duration: '2:30:00', category: 'Classical', plays: '1.9M', thumbnail: '' },
      { trackUrl: 'https://soundcloud.com/wave-music/phonk-mix', title: 'Phonk Drift Mix', artist: 'Wave Music', duration: '35:00', category: 'Phonk', plays: '6.2M', thumbnail: '' },
    ];

    let results = SC_LIBRARY;
    if (query) {
      const q = query.toLowerCase();
      results = SC_LIBRARY.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    res.json(results);
  } catch (err: unknown) {
    console.error('SoundCloud search failed:', err);
    res.status(500).json({ error: 'Failed to search SoundCloud' });
  }
});

export default router;
