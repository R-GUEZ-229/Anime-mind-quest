
export const playSound = (type: 'click' | 'success' | 'error' | 'levelUp' | 'diamonds', volume: number = 0.4) => {
  const sounds = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3',
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    diamonds: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {});
};

export const startBGM = (volume: number = 0.1) => {
  const bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3');
  bgm.loop = true;
  bgm.volume = Math.max(0, Math.min(1, volume));
  return bgm;
};
