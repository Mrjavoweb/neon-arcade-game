export const enterFullscreen = async (): Promise<boolean> => {
  try {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      await (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    } else {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to enter fullscreen:', error);
    return false;
  }
};

export const exitFullscreen = async (): Promise<boolean> => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    } else {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to exit fullscreen:', error);
    return false;
  }
};

export const isFullscreen = (): boolean => {
  return !!document.fullscreenElement;
};

export const toggleFullscreen = async (): Promise<boolean> => {
  if (isFullscreen()) {
    return await exitFullscreen();
  } else {
    return await enterFullscreen();
  }
};

export const unlockOrientation = (): void => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (error) {
    console.log('Orientation unlock not available:', error);
  }
};

export const exitFullscreenAndUnlock = async (): Promise<boolean> => {
  unlockOrientation();
  return await exitFullscreen();
};
