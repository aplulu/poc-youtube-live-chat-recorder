import { Recorder } from './recorder';
import pino from 'pino';

const main = async () => {
  if (process.argv.length < 3) {
    console.error('Usage: ./recorder <videoId or videoURL>');
    process.exit(1);
  }
  let videoId = process.argv[2];
  // URL: https://www.youtube.com/watch?v=VIDEO_ID
  if (videoId.includes('youtube.com')) {
    const url = new URL(videoId);
    videoId = url.searchParams.get('v') || '';
  }

  if (!videoId) {
    console.error('Invalid videoId');
    process.exit(1);
  }

  const logger = pino({});

  const recorder = new Recorder(logger);
  await recorder.recordChat(videoId);
};

main();
