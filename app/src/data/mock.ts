import { Orientation } from '$types';

export const MOCK_GAMES = {
  ECKCHEN: [
    {
      id: 1,
      name: 'Pixel Raiders',
      release_date: '2024-11-15',
      active: true,
      questions: [
        {
          game_id: 1,
          nr: 1,
          question: 'What is the name of the main character?',
          answer: 'Lara',
          xc: 5,
          yc: 3,
          direction: Orientation.HORIZONTAL,
          description: 'This question is about the protagonist of the game.',
        },
        {
          game_id: 1,
          nr: 2,
          question: 'What artifact are players searching for?',
          answer: 'Orb of Eternity',
          xc: 1,
          yc: 7,
          direction: Orientation.VERTICAL,
          description: 'This question is about the main quest.',
        },
      ],
    },
    {
      id: 2,
      name: 'Mystic Valley',
      release_date: '2025-02-10',
      active: true,
      questions: [
        {
          game_id: 2,
          nr: 1,
          question: 'What magical creature lives in the valley?',
          answer: 'Phoenix',
          xc: 2,
          yc: 4,
          direction: Orientation.HORIZONTAL,
          description: 'Creature related to the main storyline.',
        },
      ],
    },
  ]
}
