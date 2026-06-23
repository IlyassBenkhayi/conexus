import React from 'react';

// YouTube Logo (colored)
export const Youtube: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z"
        fill="#FF0000"
      />
      <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF" />
    </svg>
  );
};

// YouTube Wordmark (Horizontal Logo + Text)
export const YoutubeWordmark: React.FC<{ size?: number | string }> = ({
  size = 24
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Youtube size={size} />
      <span style={{
        fontFamily: '"YouTube Sans", Roboto, Arial, sans-serif',
        fontWeight: 'bold',
        fontSize: '1.25rem',
        letterSpacing: '-0.8px',
        color: '#FFFFFF',
        userSelect: 'none'
      }}>
        YouTube
      </span>
    </div>
  );
};

// Twitch Logo (colored)
export const Twitch: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
        fill="#9146FF"
      />
    </svg>
  );
};

// Twitch Wordmark (Horizontal Logo + Text)
export const TwitchWordmark: React.FC<{ size?: number | string }> = ({
  size = 24
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Twitch size={size} />
      <span style={{
        fontFamily: '"Roobert", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 800,
        fontSize: '1.2rem',
        letterSpacing: '-0.3px',
        color: '#FFFFFF',
        userSelect: 'none'
      }}>
        twitch
      </span>
    </div>
  );
};

// Spotify Logo (colored)
export const Spotify: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path
        d="M17.521 17.34c-.24.359-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.09-.84-.18-.93-.6-.09-.42.18-.84.6-.93 4.62-1.08 8.58-.66 11.76 1.26.36.24.48.66.24 1.02zm1.44-3.24c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.44-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.6 13.5 1.68.42.24.6.78.3 1.2-.12.06-.06.06 0 0zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.26-.18-1.44-.78-.18-.6.18-1.26.78-1.44 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.72-1.56.42-.06.06-.06.06 0 0z"
        fill="#000000"
      />
    </svg>
  );
};

// Vimeo Logo (colored)
export const Vimeo: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M22.396 7.02c-.087 1.944-1.44 4.608-4.062 7.992-2.73 3.516-5.046 5.274-6.942 5.274-1.182 0-2.178-1.092-2.994-3.276-.546-2.004-1.092-4.008-1.638-6.012-.606-2.268-1.254-3.402-1.95-3.402-.15 0-.678.318-1.584.954l-.948-1.218c1.002-.876 1.992-1.746 2.97-2.61 1.344-1.176 2.34-1.794 2.982-1.854 1.518-.132 2.454.894 2.814 3.078.396 2.418.666 3.918.816 4.5.426 1.794.882 2.688 1.374 2.688.384 0 .96-.582 1.728-1.74.768-1.164 1.176-2.046 1.224-2.646.096-1.08-.282-1.626-1.134-1.626-.396 0-.858.09-1.38.27 1.056-3.456 3.078-5.124 6.072-5.004 2.226.09 3.294 1.512 3.21 4.272z"
        fill="#1AB7EA"
      />
    </svg>
  );
};

// Dailymotion Logo (colored)
export const Dailymotion: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <g transform="translate(12, 12) scale(0.95) translate(-12, -12)">
        <path
          d="M 11.25,8 A 6.5,6.5 0 1,1 11.25,21 A 6.5,6.5 0 1,1 11.25,8 M 11.25,11.5 A 3,3 0 1,0 11.25,17.5 A 3,3 0 1,0 11.25,11.5 M 15.25,5.2 L 18.25,3.7 L 18.25,21 L 15.25,21 Z"
          fill="#0066DC"
        />
      </g>
    </svg>
  );
};

// SoundCloud Logo (colored)
export const SoundCloud: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }> = ({
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M1.333 13.5v-1.667c.368 0 .667.299.667.667v1.667c0 .368-.299.667-.667.667zm1.334 1.333V11.5c.368 0 .666.299.666.667v2.667c0 .368-.298.666-.666.666zm1.333.667v-5.667c.369 0 .667.299.667.667v5c0 .368-.298.667-.667.667zm1.333-.333V8.833c.368 0 .667.299.667.667V15c0 .368-.299.667-.667.667zm1.334 0v-7.5c.368 0 .666.299.666.667v6.833c0 .368-.298.667-.666.667zm1.333-1v-8.167c.369 0 .667.299.667.667V14.5c0 .368-.298.667-.667.667zm1.334.333v-8.833c.368 0 .666.299.666.667v8.167c0 .368-.298.666-.666.666zm1.333-.333v-8.5c.369 0 .667.299.667.667v7.833c0 .368-.298.667-.667.667zm1.334 0V5.833c.368 0 .666.299.666.667V15c0 .368-.298.667-.666.667zm1.333-.333V5.5c.369 0 .667.299.667.667v8.167c0 .368-.298.667-.667.667zm1.334 0v-8.5c.368 0 .666.299.666.667V14c0 .368-.298.667-.666.667zm1.333-.667V6.5c.369 0 .667.299.667.667v6.167c0 .368-.298.667-.667.667zm1.334.667V7.167c.368 0 .666.299.666.667V14c0 .368-.298.667-.666.667zm1.666.333c-3.13 0-5.667-2.537-5.667-5.667 0-3.083 2.459-5.59 5.518-5.662C16.892 2.65 19.336 4.5 20.333 7c1.84 0 3.333 1.493 3.333 3.333 0 1.84-1.493 3.334-3.333 3.334h-9z"
        fill="#FF5500"
      />
    </svg>
  );
};

// Vimeo Wordmark
export const VimeoWordmark: React.FC<{ size?: number | string }> = ({ size = 24 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Vimeo size={size} />
      <span style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 700,
        fontSize: '1.2rem',
        letterSpacing: '-0.3px',
        color: '#1AB7EA',
        userSelect: 'none'
      }}>
        vimeo
      </span>
    </div>
  );
};

// Dailymotion Wordmark
export const DailymotionWordmark: React.FC<{ size?: number | string }> = ({ size = 24 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Dailymotion size={size} />
      <span style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 800,
        fontSize: '1.15rem',
        letterSpacing: '-0.5px',
        color: '#FFFFFF',
        userSelect: 'none'
      }}>
        dailymotion
      </span>
    </div>
  );
};

// Spotify Wordmark
export const SpotifyWordmark: React.FC<{ size?: number | string }> = ({ size = 24 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Spotify size={size} />
      <span style={{
        fontFamily: '"Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 700,
        fontSize: '1.25rem',
        letterSpacing: '-0.5px',
        color: '#1DB954',
        userSelect: 'none'
      }}>
        Spotify
      </span>
    </div>
  );
};

// SoundCloud Wordmark
export const SoundCloudWordmark: React.FC<{ size?: number | string }> = ({ size = 24 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <SoundCloud size={size} />
      <span style={{
        fontFamily: '"Interstate", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 700,
        fontSize: '1.2rem',
        letterSpacing: '-0.3px',
        color: '#FF5500',
        userSelect: 'none'
      }}>
        SoundCloud
      </span>
    </div>
  );
};

