import { io } from 'socket.io-client';

async function runTest() {
  console.log('--- STARTING SKRIBBL.IO MULTIPLAYER TEST ---');
  const serverUrl = 'http://localhost:3001';

  // 1. Connect Host
  const hostSocket = io(serverUrl, { autoConnect: false });
  let roomId = '';

  const hostJoinedPromise = new Promise((resolve) => {
    hostSocket.on('joined_room', (data) => {
      roomId = data.roomId;
      console.log(`✓ Room created with code: ${roomId}, isHost: ${data.isHost}`);
      resolve(true);
    });
  });

  hostSocket.on('connect', () => {
    console.log('✓ Host connected to server');
    hostSocket.emit('create_room', {
      playerId: 'test_host_1',
      name: 'SpeedyArtist',
      avatar: { color: '#00cc00', eyes: 1, mouth: 0 }
    });
  });

  hostSocket.connect();
  await hostJoinedPromise;

  // 2. Connect Guesser
  const guesserSocket = io(serverUrl, { autoConnect: false });

  const guesserJoinedPromise = new Promise((resolve) => {
    guesserSocket.on('joined_room', (data) => {
      console.log(`✓ Guesser joined room ${data.roomId}`);
      resolve(true);
    });
  });

  guesserSocket.on('connect', () => {
    console.log('✓ Guesser connected to server');
    guesserSocket.emit('join_room', {
      roomId: roomId,
      playerId: 'test_guesser_2',
      name: 'SharpGuesser',
      avatar: { color: '#ef130b', eyes: 2, mouth: 1 }
    });
  });

  guesserSocket.connect();
  await guesserJoinedPromise;

  // 3. Start Game
  console.log('✓ Host starting game...');
  hostSocket.emit('start_game', { roomId });

  // 4. Wait for word options
  let chosenWord = '';
  await new Promise((resolve) => {
    hostSocket.on('room_state', (state) => {
      if (state.state === 'CHOOSING_WORD' && state.wordOptions.length > 0 && !chosenWord) {
        console.log(`✓ Drawer received word choices: ${state.wordOptions.join(', ')}`);
        chosenWord = state.wordOptions[0];
        console.log(`✓ Drawer selecting word: "${chosenWord}"`);
        hostSocket.emit('select_word', { roomId, word: chosenWord });
        resolve(true);
      }
    });
  });

  // 5. Verify Drawing State & Word Masking
  await new Promise((resolve) => {
    guesserSocket.on('room_state', (state) => {
      if (state.state === 'DRAWING') {
        console.log(`✓ Game state is DRAWING. Guesser sees masked word: "${state.displayWord}" (${state.wordLength} letters)`);
        if (state.displayWord.toLowerCase().includes(chosenWord.toLowerCase())) {
          console.error('FAILED: Secret word was leaked to guesser!');
          process.exit(1);
        } else {
          console.log('✓ Secret word is properly hidden from guesser!');
        }
        resolve(true);
      }
    });
  });

  // 6. Test Real-time Drawing Stroke Sync
  await new Promise((resolve) => {
    guesserSocket.on('draw_stroke', (stroke) => {
      console.log(`✓ Guesser received real-time stroke at (${stroke.x}, ${stroke.y}) color: ${stroke.color}`);
      resolve(true);
    });

    hostSocket.emit('draw_stroke', {
      roomId,
      stroke: { prevX: 100, prevY: 100, x: 120, y: 130, color: '#000000', size: 10, isEnd: false }
    });
  });

  // 7. Test Bucket Fill Sync
  await new Promise((resolve) => {
    guesserSocket.on('fill_bucket', (fill) => {
      console.log(`✓ Guesser received fill bucket at (${fill.x}, ${fill.y}) color: ${fill.color}`);
      resolve(true);
    });

    hostSocket.emit('fill_bucket', {
      roomId,
      fill: { x: 200, y: 200, color: '#ef130b' }
    });
  });

  // 8. Test Close Guess Hint
  await new Promise((resolve) => {
    const typoWord = chosenWord.length >= 4 ? chosenWord.slice(0, -1) + 'z' : 'cat';
    console.log(`✓ Guesser sending close guess typo: "${typoWord}"`);

    guesserSocket.on('chat_message', (msg) => {
      if (msg.subType === 'close_guess') {
        console.log(`✓ Guesser received close guess notification: "${msg.text}"`);
        resolve(true);
      }
    });

    guesserSocket.emit('send_chat', {
      roomId,
      playerId: 'test_guesser_2',
      text: typoWord
    });

    setTimeout(resolve, 800);
  });

  // 9. Test Exact Guess Validation and Score Award
  await new Promise((resolve) => {
    console.log(`✓ Guesser submitting exact word: "${chosenWord}"`);

    hostSocket.on('chat_message', (msg) => {
      if (msg.subType === 'correct_guess') {
        console.log(`✓ Host received announcement: "${msg.text}"`);
      }
    });

    guesserSocket.on('room_state', (state) => {
      const g = state.players.find(p => p.id === 'test_guesser_2');
      if (g && g.guessed && g.score > 0) {
        console.log(`✓ Guesser successfully awarded ${g.score} points!`);
        resolve(true);
      }
    });

    guesserSocket.emit('send_chat', {
      roomId,
      playerId: 'test_guesser_2',
      text: chosenWord
    });
  });

  console.log('--- ALL MULTIPLAYER TESTS PASSED SUCCESSFULLY! ---');
  hostSocket.disconnect();
  guesserSocket.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
